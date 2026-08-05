"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Flame, Calendar, CheckCircle2, Ticket, Sparkles, Bot, X, Loader2, ShieldCheck, Check } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function CurriculumPricing() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // 💳 CHECKOUT MODAL STATES
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedAiTier, setSelectedAiTier] = useState<"none" | "basic" | "plus" | "pro">("none");
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");
  const [couponErrorMsg, setCouponErrorMsg] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetch("/api/courses/public")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.courses.length > 0) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingCourses(false));
  }, []);

  const openCheckout = (course: any) => {
    setSelectedCourse(course);
    setSelectedAiTier("none");
    setCouponInput(course.couponCode || "");
    setCouponDiscount(0);
    setCouponSuccessMsg("");
    setCouponErrorMsg("");
  };

  // 🎟️ LIVE COUPON VALIDATION
  const handleValidateCoupon = async () => {
    if (!couponInput.trim() || !selectedCourse) return;
    setIsValidatingCoupon(true);
    setCouponSuccessMsg("");
    setCouponErrorMsg("");

    const basePrice = getActivePriceNumber();

    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          courseId: selectedCourse.courseId || selectedCourse._id,
          orderAmount: basePrice,
          userId: auth.currentUser?.uid || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setCouponDiscount(data.discountAmount);
        setCouponSuccessMsg(data.message);
      } else {
        setCouponDiscount(0);
        setCouponErrorMsg(data.error);
      }
    } catch (err) {
      setCouponErrorMsg("Failed to validate coupon");
    }
    setIsValidatingCoupon(false);
  };

  const getActivePriceNumber = () => {
    if (!selectedCourse) return 0;
    let priceStr = selectedCourse.price;
    if (selectedAiTier === "basic" && selectedCourse.priceBasic) priceStr = selectedCourse.priceBasic;
    if (selectedAiTier === "plus" && selectedCourse.pricePlus) priceStr = selectedCourse.pricePlus;
    if (selectedAiTier === "pro" && selectedCourse.pricePro) priceStr = selectedCourse.pricePro;
    
    return parseInt(priceStr.toString().replace(/\D/g, ""), 10) || 0;
  };

  const calculateFinalPayable = () => {
    const base = getActivePriceNumber();
    return Math.max(1, base - couponDiscount);
  };

  // 💳 RAZORPAY CHECKOUT TRIGGER
  const handleRazorpayPayment = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please Sign In first to enroll in courses!");
      window.location.href = "/login";
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.courseId || selectedCourse._id,
          userId: user.uid,
          aiPlan: selectedAiTier,
          appliedCouponCode: couponDiscount > 0 ? couponInput.trim() : null
        })
      });

      const data = await res.json();

      if (!data.success) {
        alert("Order Error: " + (data.error || "Failed to create payment order"));
        setIsProcessingPayment(false);
        return;
      }

      // Load Razorpay Script if not loaded
      if (typeof (window as any).Razorpay === "undefined") {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise(r => script.onload = r);
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.order.key,
        amount: data.order.amount,
        currency: "INR",
        name: "AyushGyaan Academy",
        description: `Enrollment for ${selectedCourse.title}`,
        order_id: data.order.id,
        handler: async function (response: any) {
          // Verify Signature
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              courseId: selectedCourse.courseId || selectedCourse._id,
              aiPlan: selectedAiTier,
              appliedCouponCode: couponDiscount > 0 ? couponInput.trim() : null
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("🎉 Payment Successful! Access granted to your course and AI plan.");
            window.location.href = "/dashboard";
          } else {
            alert("Verification Failed: " + verifyData.error);
          }
        },
        prefill: {
          email: user.email || "",
          name: user.displayName || ""
        },
        theme: { color: "#059669" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert("Payment Initiation Error: " + err.message);
    }
    setIsProcessingPayment(false);
  };

  return (
    <section id="curriculum" className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-10 md:mb-16">
        <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest mb-4 text-[10px] md:text-xs bg-emerald-900/30 px-4 py-1.5 rounded-full border border-emerald-500/30">
          <Tag className="w-4 h-4" /> NCISM Compliant Courses
        </div>
        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Academic <span className="text-emerald-400">Modules</span></h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">Comprehensive Samhita & Clinical subject modules with optional AI assistant integration.</p>
      </div>

      {isLoadingCourses ? (
        <div className="flex justify-center p-10">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 items-start pt-4">
          {courses.map((course, i) => (
            <div key={course.id || i} className={`bg-white/[0.02] backdrop-blur-xl border ${course.highlight ? 'border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] md:-translate-y-2' : 'border-white/10'} rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col h-full relative transition-transform`}>
              
              {/* MARKETING TAG BADGE */}
              {(course.marketingTag || course.badge) && (
                <div className="absolute -top-3.5 left-6 md:left-8 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] md:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 border border-amber-400">
                  <Flame className="w-3.5 h-3.5" /> {course.marketingTag || course.badge}
                </div>
              )}

              {/* RECOMMENDED BADGE */}
              {course.highlight && !course.marketingTag && !course.badge && (
                <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Recommended
                </div>
              )}

              {/* AI ENABLED BADGE */}
              {course.aiSettings?.isAiEnabled && (
                 <div className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                   <Bot className="w-3.5 h-3.5" /> AI Integrated
                 </div>
              )}

              <span className={`${course.highlight ? 'text-emerald-400' : 'text-blue-400'} font-bold text-xs md:text-sm mb-2 uppercase tracking-wide mt-2`}>{course.prof}</span>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{course.title}</h3>
              
              {/* UPCOMING LAUNCH DATE */}
              {(course.isPreRegister || course.status === "PRE_REGISTER" || course.launchDate) && (
                <div className="text-[10px] md:text-xs text-amber-400 font-bold mb-4 flex items-center gap-1.5 bg-amber-500/10 w-fit px-3 py-1.5 rounded-md border border-amber-500/20">
                  <Calendar className="w-3.5 h-3.5" /> Launching: {course.launchDate || course.startDate || "Coming Soon"}
                </div>
              )}

              <div className="mb-6 md:mb-8 border-b border-white/5 pb-6">
                {course.originalPrice && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm md:text-base text-gray-500 line-through font-semibold">{course.originalPrice}</span>
                    {course.discountText && (
                      <span className="text-[10px] md:text-xs font-black text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        {course.discountText}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <span className="text-xl md:text-2xl text-gray-400 font-bold mb-1">Starts at</span>
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{course.price}</span>
                  <span className="text-xs md:text-sm text-gray-500 font-medium mb-1.5">/ {course.duration}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {course.syllabus?.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
                    <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${course.highlight ? 'text-emerald-500' : 'text-blue-500'} shrink-0 mt-0.5`} /> 
                    {item}
                  </div>
                ))}
              </div>

              {course.couponCode && (
                <div className="mb-5 bg-white/5 border border-dashed border-emerald-500/50 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Use Code:</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400 tracking-wider group-hover:scale-105 transition-transform">
                    {course.couponCode}
                  </span>
                </div>
              )}

              {/* ACTION BUTTON */}
              {course.isPreRegister || course.status === "PRE_REGISTER" ? (
                <a href="#early-bird" className="w-full py-4 rounded-xl font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10">
                  <Sparkles className="w-4 h-4" /> Pre-Register Spot
                </a>
              ) : (
                <button onClick={() => openCheckout(course)} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 text-sm md:text-base ${course.highlight ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                  Enroll & Select Plan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= 💳 RAZORPAY CHECKOUT MODAL ================= */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-emerald-500/30 rounded-3xl p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">{selectedCourse.title}</h3>
                <p className="text-xs text-emerald-400 font-bold">{selectedCourse.prof}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI TIER SELECTION */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Choose Plan Bundle</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  onClick={() => setSelectedAiTier("none")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedAiTier === "none" ? "bg-emerald-950/40 border-emerald-500 text-white" : "bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                >
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span>Course Only</span>
                    <span className="text-emerald-400">{selectedCourse.price}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Full Samhita Reader & Academic Access</p>
                </div>

                {selectedCourse.priceBasic && (
                  <div 
                    onClick={() => setSelectedAiTier("basic")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedAiTier === "basic" ? "bg-emerald-950/40 border-emerald-500 text-white" : "bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                  >
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-emerald-400"/> + AI Basic</span>
                      <span className="text-emerald-400">{selectedCourse.priceBasic}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">50 Daily AI Queries & Shloka Analysis</p>
                  </div>
                )}

                {selectedCourse.pricePlus && (
                  <div 
                    onClick={() => setSelectedAiTier("plus")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedAiTier === "plus" ? "bg-blue-950/40 border-blue-500 text-white" : "bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                  >
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-blue-400"/> + AI Plus</span>
                      <span className="text-blue-400">{selectedCourse.pricePlus}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">1,000 Monthly Tokens + Voice Input</p>
                  </div>
                )}

                {selectedCourse.pricePro && (
                  <div 
                    onClick={() => setSelectedAiTier("pro")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedAiTier === "pro" ? "bg-purple-950/40 border-purple-500 text-white" : "bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700"}`}
                  >
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-purple-400"/> + AI Pro</span>
                      <span className="text-purple-400">{selectedCourse.pricePro}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Unlimited AI Tokens + Multimodal Voice/Image</p>
                  </div>
                )}
              </div>
            </div>

            {/* 🎟️ LIVE COUPON INPUT */}
            <div className="mb-6 bg-black/40 p-4 rounded-xl border border-gray-800 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Apply Promo / Coupon Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. AYUSH50)" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 outline-none uppercase"
                />
                <button 
                  type="button" 
                  onClick={handleValidateCoupon}
                  disabled={isValidatingCoupon || !couponInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold rounded-lg text-xs"
                >
                  {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin"/> : "Apply"}
                </button>
              </div>
              {couponSuccessMsg && <p className="text-xs text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5"/> {couponSuccessMsg}</p>}
              {couponErrorMsg && <p className="text-xs text-red-400 font-bold">{couponErrorMsg}</p>}
            </div>

            {/* TOTAL PAYABLE */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Total Amount Payable</p>
                {couponDiscount > 0 && <p className="text-[10px] text-emerald-400 font-bold">Includes Coupon Discount: ₹{couponDiscount}</p>}
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">₹{calculateFinalPayable()}</span>
              </div>
            </div>

            <button 
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin"/> : <ShieldCheck className="w-5 h-5"/>}
              {isProcessingPayment ? "Initiating Secure Checkout..." : "Proceed to Razorpay Checkout"}
            </button>

          </div>
        </div>
      )}
    </section>
  );
}