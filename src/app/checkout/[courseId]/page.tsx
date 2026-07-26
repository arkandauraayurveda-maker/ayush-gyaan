"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, Ticket, CreditCard, Loader2, Lock, ArrowLeft, Sparkles, AlertCircle, UserCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

// 🌐 Razorpay Script Loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🔥 NEW: Authenticated User State
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // 🛡️ Initial Fetch & Security Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Not logged in -> Kick to login page
        router.push("/login");
        return;
      }

      try {
        // 1. Fetch Auth Details from DB (To get Mobile & Onboarding status)
        const userRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, email: user.email, name: user.displayName || "" })
        });
        const userData = await userRes.json();
        
        if (userData.success) {
          setCurrentUser(userData.user);
          
          // Force onboarding if incomplete
          if (!userData.user.isOnboarded) {
             alert("Please complete your profile first.");
             router.push("/onboarding");
             return;
          }
        }

        // 2. Fetch Course Details
        const courseRes = await fetch("/api/courses"); // Public courses API
        const courseData = await courseRes.json();
        if (courseData.success) {
          const selectedCourse = courseData.courses.find((c: any) => c.courseId === courseId);
          if (selectedCourse) {
            setCourse(selectedCourse);
          } else {
            alert("Course not found!");
            router.push("/"); 
          }
        }
      } catch (error) {
        console.error("Initialization error", error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [courseId, router]);

  // 🎟️ Apply Coupon Logic
  const handleApplyCoupon = async () => {
    if (!couponInput || !currentUser) return;
    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupon/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, courseId: course.courseId, userId: currentUser.uid })
      });
      const data = await res.json();

      if (data.success) {
        setAppliedDiscount(data.discountPercentage);
        setCouponError("");
      } else {
        setCouponError(data.error);
        setAppliedDiscount(0);
      }
    } catch (error) {
      setCouponError("Could not verify coupon. Try again.");
    }
    setIsApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setCouponInput("");
    setAppliedDiscount(0);
    setCouponError("");
  };

  // 💸 Pay via Razorpay Logic
  const handlePayment = async () => {
    if (!currentUser) return;

    setIsProcessing(true);
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create Order via Backend
      const orderRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          courseId: course.courseId, 
          userId: currentUser.uid,
          appliedCouponCode: appliedDiscount > 0 ? couponInput : null 
        })
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert("Checkout Error: " + orderData.error);
        setIsProcessing(false);
        return;
      }

      // 2. Open Razorpay Checkout Window
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.order.amount,
        currency: "INR",
        name: "AyushGyaan Academy",
        description: `Enrollment: ${course.title}`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: currentUser.uid,
              courseId: course.courseId
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("🎉 Payment Successful! Welcome to the Academy.");
            router.push("/dashboard"); // Take them to Student Dashboard
          } else {
            alert("Payment Verification Failed!");
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.mobile || "9999999999"
        },
        theme: { color: "#10b981" }, 
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error) {
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /><p className="text-emerald-400 text-sm font-bold animate-pulse">Securing Checkout...</p></div>;
  }

  if (!course || !currentUser) return null;

  // Calculate Prices
  const basePrice = parseInt(course.price.replace(/\D/g, ""), 10);
  const discountAmount = appliedDiscount > 0 ? Math.round((basePrice * appliedDiscount) / 100) : 0;
  const finalPrice = basePrice - discountAmount;

  return (
    <div className="min-h-screen bg-[#020604] text-white font-sans selection:bg-emerald-500/30">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-emerald-700/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <nav className="relative z-10 border-b border-white/10 bg-[#050B08]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Cancel & Back
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-widest uppercase">Secure Checkout</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* ================= LEFT: COURSE SUMMARY ================= */}
        <div className="w-full lg:w-7/12 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Complete your Enrollment</h1>
            <p className="text-gray-400 text-sm md:text-base">You are just one step away from unlocking the ultimate AI clinical ecosystem.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
            
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">{course.prof}</span>
            <h2 className="text-2xl font-black mt-1 mb-6">{course.title}</h2>

            <div className="space-y-3 border-y border-white/10 py-6 mb-6">
              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">What's included in {course.duration}:</h4>
              {course.syllabus?.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {item}
                </div>
              ))}
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" /> Samhita AI Smart Reader Access
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
              <Lock className="w-4 h-4 text-gray-400" />
              100% Secure Payment • Strict 5-Day Money Back Guarantee
            </div>
          </div>
        </div>

        {/* ================= RIGHT: PAYMENT & USER DETAILS ================= */}
        <div className="w-full lg:w-5/12 bg-[#050B08] border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
          
          <h3 className="text-xl font-black mb-4">Scholar Details</h3>
          
          {/* 🔥 READ-ONLY USER INFO CARD 🔥 */}
          <div className="bg-black/40 border border-gray-800 rounded-xl p-4 mb-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-white">
              <UserCircle className="w-4 h-4 text-emerald-500" /> {currentUser.name}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Mail className="w-4 h-4 text-emerald-500" /> {currentUser.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Phone className="w-4 h-4 text-emerald-500" /> {currentUser.mobile || "N/A"}
            </div>
            <p className="text-[10px] text-gray-500 italic pt-2 border-t border-gray-800 mt-2">These details are auto-synced from your profile.</p>
          </div>

          <h3 className="text-xl font-black mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm mb-6 pb-6 border-b border-white/10">
            <div className="flex justify-between text-gray-400">
              <span>Course Fee</span>
              <span>₹{basePrice}</span>
            </div>
            
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold bg-emerald-900/20 p-2 -mx-2 rounded-lg">
                <span>Coupon Discount ({appliedDiscount}%)</span>
                <span>- ₹{discountAmount}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-black text-white pt-2">
              <span>Total Amount</span>
              <span>₹{finalPrice}</span>
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="mb-8">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Ticket className="w-4 h-4"/> Have a Coupon?</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter code" 
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                disabled={appliedDiscount > 0}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors uppercase placeholder:normal-case disabled:opacity-50" 
              />
              {appliedDiscount > 0 ? (
                <button onClick={removeCoupon} className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors">Remove</button>
              ) : (
                <button onClick={handleApplyCoupon} disabled={!couponInput || isApplyingCoupon} className="bg-white/10 text-white border border-white/20 px-6 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors disabled:opacity-50">
                  {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin"/> : "Apply"}
                </button>
              )}
            </div>
            {couponError && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {couponError}</p>}
            {appliedDiscount > 0 && <p className="text-emerald-400 text-xs mt-2 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Coupon Applied Successfully!</p>}
          </div>

          {/* Checkout Button */}
          <button 
            onClick={handlePayment} 
            disabled={isProcessing || finalPrice < 1}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CreditCard className="w-5 h-5"/>}
            {isProcessing ? "Processing Secure Payment..." : `Pay ₹${finalPrice} Securely`}
          </button>
          
          <p className="text-center text-[10px] text-gray-500 mt-4">By proceeding, you agree to our Terms of Service & Privacy Policy.</p>
        </div>
      </main>
    </div>
  );
}