"use client";

import { useState, useEffect } from "react"; // 🔥 Error Fix: useEffect imported here
import { BookOpen, Compass, PlayCircle, ShoppingBag, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

interface CourseHubProps {
  enrolledCourses: Array<{ courseId: string; title?: string; status: string }>;
}

export default function CourseHub({ enrolledCourses }: CourseHubProps) {
  // 1. All States
  const [activeTab, setActiveTab] = useState<"enrolled" | "explore">("enrolled");
  const [buyingCourseId, setBuyingCourseId] = useState<string | null>(null);
  const [exploreCourses, setExploreCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // 2. Fetch Courses Effect (Inside the function)
  useEffect(() => {
    if (activeTab === "explore" && exploreCourses.length === 0) {
      const fetchCourses = async () => {
        setIsLoadingCourses(true);
        try {
          const res = await fetch("/api/courses/public"); 
          const data = await res.json();
          if (data.success) {
            setExploreCourses(data.courses);
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setIsLoadingCourses(false);
        }
      };
      fetchCourses();
    }
  }, [activeTab, exploreCourses.length]);

  // 3. Purchase Handler
  const handleBuyCourse = async (courseId: string) => {
    try {
      setBuyingCourseId(courseId);
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to purchase courses.");
        return;
      }

      const userId = user.uid;

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to create order.");
        setBuyingCourseId(null);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load.");
        setBuyingCourseId(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AyushGyaan AI",
        description: `Purchase Course: ${courseId}`,
        order_id: data.order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              courseId,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Course purchased successfully!");
            window.location.reload();
          } else {
            alert("Verification failed: " + verifyData.error);
          }
          setBuyingCourseId(null);
        },
        prefill: { email: user.email || "" },
        theme: { color: "#10B981" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Course purchase error:", err);
      alert("Checkout error occurred.");
      setBuyingCourseId(null);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Learning Hub</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your active BAMS coursework and discover new modules.</p>
        </div>

        <div className="flex bg-[#050B08] p-1 rounded-xl border border-emerald-900/40 w-fit">
          <button
            onClick={() => setActiveTab("enrolled")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "enrolled" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> My Courses ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "explore" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Explore Store
          </button>
        </div>
      </div>

      {activeTab === "enrolled" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolledCourses.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[#050B08]/50 rounded-2xl border border-emerald-900/20">
              <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-300 font-medium text-sm">No active courses found.</p>
              <button 
                onClick={() => setActiveTab("explore")}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500"
              >
                Explore Courses
              </button>
            </div>
          ) : (
            enrolledCourses.map((course, idx) => (
              <div key={idx} className="bg-[#0A1410] border border-emerald-900/40 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Enrolled
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{course.title || `Course ID: ${course.courseId}`}</h3>
                  <p className="text-xs text-gray-400">Status: <span className="text-emerald-400 font-medium">{course.status}</span></p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-emerald-900/30 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Access: Lifetime</span>
                  <Link href={`/courses/${course.courseId}`} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoadingCourses ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-emerald-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/80">Fetching Global Store...</p>
            </div>
          ) : exploreCourses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              No new courses available right now. Check back later!
            </div>
          ) : (
            exploreCourses.map((course) => (
              <div key={course.courseId} className="bg-[#050B08]/80 border border-emerald-900/30 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      {course.category || "Samhita"}
                    </span>
                    <span className="text-base font-bold text-white">₹{course.price}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{course.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{course.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-900/30 flex justify-between items-center">
                  <span className="text-xs text-gray-500">BAMS Standard</span>
                  <button 
                    onClick={() => handleBuyCourse(course.courseId)}
                    disabled={buyingCourseId === course.courseId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 shadow-lg shadow-emerald-500/20"
                  >
                    {buyingCourseId === course.courseId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    Buy Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}