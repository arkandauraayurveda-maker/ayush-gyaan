"use client";

import { useState, useEffect } from "react";
import { Sparkles, Crown, Check, Zap, Loader2, Calendar } from "lucide-react";
import { auth } from "@/lib/firebase";

interface UpgradeSectionProps {
  currentTier: string;
}

export default function UpgradeSection({ currentTier }: UpgradeSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [pricingData, setPricingData] = useState<{
    plus: { monthly: number; yearly: number; offerTag?: string };
    pro: { monthly: number; yearly: number; offerTag?: string };
  }>({
    plus: { monthly: 199, yearly: 1999, offerTag: "Save 16%" },
    pro: { monthly: 499, yearly: 4999, offerTag: "Save 17%" }
  });

  useEffect(() => {
    // Fetch live pricing from admin settings if available
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/courses/public");
        const data = await res.json();
        if (data.settings?.aiPricing) {
          const p = data.settings.aiPricing;
          setPricingData({
            plus: typeof p.plus === "object" ? p.plus : { monthly: Number(p.plus || 199), yearly: Number(p.plus || 199) * 12, offerTag: "Save 16%" },
            pro: typeof p.pro === "object" ? p.pro : { monthly: Number(p.pro || 499), yearly: Number(p.pro || 499) * 12, offerTag: "Save 17%" }
          });
        }
      } catch (err) {
        console.error("Failed to fetch public pricing settings", err);
      }
    };

    fetchPricing();
  }, []);

  const handleUpgrade = async (aiPlan: string) => {
    try {
      setLoadingPlan(aiPlan);
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to upgrade.");
        return;
      }

      const userId = user.uid;

      // 1. Call Create Order API with billingCycle
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, aiPlan, billingCycle }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to create payment order.");
        setLoadingPlan(null);
        return;
      }

      // 2. Load Razorpay Script Dynamically if not loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Check your connection.");
        setLoadingPlan(null);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AyushGyaan AI",
        description: `Upgrade to Ayush ${aiPlan.toUpperCase()} Plan (${billingCycle.toUpperCase()})`,
        order_id: data.order.id,
        handler: async function (response: any) {
          // 4. Call Verify API
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              aiPlan,
              billingCycle
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("✅ Payment successful! Your AI plan has been upgraded.");
            window.location.reload();
          } else {
            alert("⚠️ Verification failed: " + verifyData.error);
          }
          setLoadingPlan(null);
        },
        prefill: {
          email: user.email || "",
          name: user.displayName || "Scholar",
        },
        theme: { color: "#10B981" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("An error occurred during checkout.");
      setLoadingPlan(null);
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

  const isPlus = currentTier === "plus";
  const isPro = currentTier === "pro";

  return (
    <div className="space-y-6">
      
      {/* HEADER & BILLING TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#050B08]/80 border border-emerald-900/40 p-5 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Upgrade Your Knowledge Hub
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Higher daily AI limits, image analysis & clinical reasoning tools.
          </p>
        </div>

        {/* 🔄 MONTHLY / ANNUAL TOGGLE SWITCH */}
        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-gray-800 shrink-0">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Annual
            <span className="bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
              Save Big
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PLUS PLAN CARD */}
        <div className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 ${
          isPlus ? "bg-[#0A1410] border-emerald-500/50" : "bg-[#050B08]/80 border-emerald-900/30 hover:border-emerald-500/40"
        }`}>
          {billingCycle === "annual" && pricingData.plus.offerTag && (
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
              {pricingData.plus.offerTag}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Student Favorite
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Ayush Plus</h3>
            <p className="text-xs text-gray-400 mb-4">Designed for BAMS scholars aiming for top exam scores.</p>
            
            {/* PRICING DISPLAY */}
            <div className="mb-6 pb-4 border-b border-emerald-900/30">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">
                  ₹{billingCycle === "annual" ? pricingData.plus.yearly : pricingData.plus.monthly}
                </span>
                <span className="text-xs text-gray-400">
                  / {billingCycle === "annual" ? "year" : "month"}
                </span>
              </div>
              {billingCycle === "annual" && (
                <div className="text-[10px] text-emerald-400 mt-1 font-medium">
                  ≈ ₹{Math.round(pricingData.plus.yearly / 12)}/month billed annually
                </div>
              )}
            </div>

            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 100 Daily AI Queries</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Image & Exam Paper Analysis</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Fast Shloka Decoding</li>
            </ul>
          </div>

          <button 
            onClick={() => handleUpgrade("plus")}
            disabled={isPlus || isPro || loadingPlan !== null}
            className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            {loadingPlan === "plus" && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPlus ? "Active Plan" : isPro ? "Included in Pro" : `Upgrade to Plus (${billingCycle === "annual" ? "Annual" : "Monthly"})`}
          </button>
        </div>

        {/* PRO PLAN CARD */}
        <div className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 ${
          isPro ? "bg-[#0A1410] border-amber-500/50" : "bg-[#050B08]/80 border-purple-900/30 hover:border-purple-500/40"
        }`}>
          {billingCycle === "annual" && pricingData.pro.offerTag ? (
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
              {pricingData.pro.offerTag}
            </div>
          ) : (
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Ultimate Scholar
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Pro Access
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Ayush Pro</h3>
            <p className="text-xs text-gray-400 mb-4">For professional practitioners needing unthrottled AI power.</p>

            {/* PRICING DISPLAY */}
            <div className="mb-6 pb-4 border-b border-purple-900/30">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">
                  ₹{billingCycle === "annual" ? pricingData.pro.yearly : pricingData.pro.monthly}
                </span>
                <span className="text-xs text-gray-400">
                  / {billingCycle === "annual" ? "year" : "month"}
                </span>
              </div>
              {billingCycle === "annual" && (
                <div className="text-[10px] text-amber-400 mt-1 font-medium">
                  ≈ ₹{Math.round(pricingData.pro.yearly / 12)}/month billed annually
                </div>
              )}
            </div>

            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Unlimited AI Consultations</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Deep Tika & Commentary Integration</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Advanced Gemini Pro Reasoning Model</li>
            </ul>
          </div>

          <button 
            onClick={() => handleUpgrade("pro")}
            disabled={isPro || loadingPlan !== null}
            className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-wide bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
          >
            {loadingPlan === "pro" && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPro ? "Current Active Plan" : `Upgrade to Pro (${billingCycle === "annual" ? "Annual" : "Monthly"})`}
          </button>
        </div>

      </div>
    </div>
  );
}