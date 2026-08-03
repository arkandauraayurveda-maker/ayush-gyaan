"use client";

import { Zap, ShieldCheck, Sparkles } from "lucide-react";

interface PlanOverviewProps {
  aiPlan: {
    tier: string;
    tokens: number;
    validityEnd?: string;
  };
}

export default function PlanOverview({ aiPlan }: PlanOverviewProps) {
  const tier = aiPlan?.tier || "basic";
  const tokens = aiPlan?.tokens ?? 10;

  // Max tokens reference for progress calculation based on tier
  const maxTokens = tier === "pro" ? 9999 : tier === "plus" ? 100 : 10;
  const progressPercentage = tier === "pro" ? 100 : Math.min(Math.max((tokens / maxTokens) * 100, 5), 100);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1410] to-[#030806] border border-emerald-900/40 p-6 shadow-2xl flex flex-col justify-between h-full">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Active Subscription
          </span>
          <span className="text-xs text-gray-400 capitalize font-medium">
            Tier: <strong className="text-white uppercase">{tier}</strong>
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {tier === "pro" ? "Ayush Pro Scholar" : tier === "plus" ? "Ayush Plus Member" : "Ayush Basic Explorer"}
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          {tier === "pro" 
            ? "You have unlimited AI consultations and advanced model access." 
            : "Upgrade your plan to unlock more daily AI queries and advanced features."}
        </p>
      </div>

      {/* Token Progress Bar Section */}
      <div className="space-y-2 pt-4 border-t border-emerald-900/30">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Remaining Tokens
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {tokens} <span className="text-gray-500 text-xs font-normal">/ {tier === "pro" ? "Unlimited" : maxTokens}</span>
          </span>
        </div>

        {tier !== "pro" && (
          <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-emerald-900/30">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}

        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Resets daily or updates instantly upon upgrade.
        </p>
      </div>
    </div>
  );
}