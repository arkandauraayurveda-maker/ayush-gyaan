"use client";

import { useState } from "react";
import { Sparkles, Crown, Check, Zap, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

interface UpgradeSectionProps {
  currentTier: string;
}

export default function UpgradeSection({ currentTier }: UpgradeSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (aiPlan: string) => {
    try {
      setLoadingPlan(aiPlan);
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to upgrade.");
        return;
      }

      const userId = user.uid;

      // 1. Call Create Order API
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, aiPlan }),
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
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "", // Ensure your public key is in .env.local
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AyushGyaan AI",
        description: `Upgrade to Ayush ${aiPlan.toUpperCase()} Plan`,
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
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment successful! Your plan has been upgraded.");
            window.location.reload();
          } else {
            alert("Verification failed: " + verifyData.error);
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

  // Helper to load Razorpay script dynamically
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
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Upgrade Your Knowledge Hub</h2>
        <p className="text-xs text-gray-400 mt-1">
          Unlock higher AI limits, advanced samhita analytics, and deep clinical reasoning tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Plus Plan Card */}
        <div className={`relative rounded-3xl p-6 flex flex-col justify-between border ${
          isPlus ? "bg-[#0A1410] border-emerald-500/50" : "bg-[#050B08]/80 border-emerald-900/30"
        }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Student Favorite
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ayush Plus</h3>
            <p className="text-xs text-gray-400 mb-6">Designed for BAMS students aiming for top exam scores.</p>
            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> High Daily Query Limits</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Image & Exam Paper Analysis</li>
            </ul>
          </div>

          <button 
            onClick={() => handleUpgrade("plus")}
            disabled={isPlus || isPro || loadingPlan !== null}
            className="w-full py-3 rounded-xl font-semibold text-xs tracking-wide bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loadingPlan === "plus" && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPlus ? "Active Plan" : isPro ? "Included in Pro" : "Upgrade to Plus"}
          </button>
        </div>

        {/* Pro Plan Card */}
        <div className={`relative rounded-3xl p-6 flex flex-col justify-between border ${
          isPro ? "bg-[#0A1410] border-amber-500/50" : "bg-[#050B08]/80 border-emerald-900/30"
        }`}>
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
            Ultimate Scholar
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro Access
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ayush Pro</h3>
            <p className="text-xs text-gray-400 mb-6">For professional practitioners needing unthrottled AI power.</p>
            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Unlimited AI Consultations</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Deep Tika & Commentary Integration</li>
            </ul>
          </div>

          <button 
            onClick={() => handleUpgrade("pro")}
            disabled={isPro || loadingPlan !== null}
            className="w-full py-3 rounded-xl font-semibold text-xs tracking-wide bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2"
          >
            {loadingPlan === "pro" && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPro ? "Current Active Plan" : "Upgrade to Pro"}
          </button>
        </div>

      </div>
    </div>
  );
}