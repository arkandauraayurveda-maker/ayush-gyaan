"use client";

import { Zap, ShieldCheck, Sparkles, Calendar, Crown } from "lucide-react";

interface PlanOverviewProps {
  aiPlan: {
    tier: string;
    tokens: number;
    validityEnd?: string | Date;
  };
}

export default function PlanOverview({ aiPlan }: PlanOverviewProps) {
  const tier = (aiPlan?.tier || "basic").toLowerCase();
  const tokens = aiPlan?.tokens ?? 10;
  const validityEnd = aiPlan?.validityEnd;

  // Max tokens reference for progress calculation based on tier
  const maxTokens = tier === "pro" ? 9999 : tier === "plus" ? 100 : 10;
  const progressPercentage = tier === "pro" ? 100 : Math.min(Math.max((tokens / maxTokens) * 100, 5), 100);

  const formattedValidity = validityEnd 
    ? new Date(validityEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1410] to-[#030806] border border-emerald-900/40 p-6 shadow-2xl flex flex-col justify-between h-full group hover:border-emerald-500/40 transition-all duration-300">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Active Subscription
          </span>
          <span className="text-xs text-gray-400 capitalize font-medium">
            Tier: <strong className="text-white uppercase">{tier}</strong>
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          {tier === "pro" ? (
            <>Ayush Pro Scholar <Crown className="w-5 h-5 text-amber-400" /></>
          ) : tier === "plus" ? (
            <>Ayush Plus Member <Sparkles className="w-5 h-5 text-emerald-400" /></>
          ) : (
            "Ayush Basic Explorer"
          )}
        </h3>
        
        <p className="text-xs text-gray-400 mb-4">
          {tier === "pro" 
            ? "Unlimited AI consultations, deep commentary search & advanced model reasoning." 
            : tier === "plus"
            ? "100 Daily text queries, image paper analysis & fast shloka decoding."
            : "10 Daily free AI queries. Upgrade to unlock unlimited samhita intelligence."}
        </p>

        {/* Pricing badge */}
        <div className="inline-flex items-center gap-2 bg-black/50 border border-emerald-900/50 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-semibold mb-4">
          <span>Current Pricing:</span>
          <span className="text-white font-bold">
            {tier === "pro" ? "₹499/mo (or ₹4,999/yr)" : tier === "plus" ? "₹199/mo (or ₹1,999/yr)" : "₹0 Free"}
          </span>
        </div>
      </div>

      {/* Token Progress Bar & Validity Section */}
      <div className="space-y-3 pt-4 border-t border-emerald-900/30">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Remaining Daily Tokens
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {tokens} <span className="text-gray-500 text-xs font-normal">/ {tier === "pro" ? "Unlimited" : maxTokens}</span>
          </span>
        </div>

        {tier !== "pro" && (
          <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-emerald-900/30 shadow-inner">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Resets daily
          </span>
          {formattedValidity && (
            <span className="flex items-center gap-1 text-emerald-300 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              <Calendar className="w-3 h-3 text-emerald-400" /> Valid till {formattedValidity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}