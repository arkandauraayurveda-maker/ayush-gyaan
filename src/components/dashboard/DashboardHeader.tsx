"use client";

import { Crown, Zap, User } from "lucide-react";

interface DashboardHeaderProps {
  name: string;
  tier: string;
}

export default function DashboardHeader({ name, tier }: DashboardHeaderProps) {
  // Determine badge styling based on the user's tier
  const isPro = tier === "pro";
  const isPlus = tier === "plus";

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-emerald-900/30">
      <div>
        <p className="text-emerald-500/80 text-sm font-semibold tracking-wide uppercase mb-1">
          Dashboard Overview
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          Welcome back, {name}
        </h1>
      </div>

      {/* Dynamic Status Badge */}
      <div className="flex items-center gap-2 bg-[#0A1410] border border-emerald-900/50 px-4 py-2 rounded-xl shadow-lg">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-1">
            Current Status
          </span>
          <div className="flex items-center gap-1.5 leading-none">
            {isPro ? (
              <><Crown className="w-3.5 h-3.5 text-amber-400" /><span className="text-sm font-bold text-amber-400">Ayush Pro</span></>
            ) : isPlus ? (
              <><Zap className="w-3.5 h-3.5 text-blue-400" /><span className="text-sm font-bold text-blue-400">Ayush Plus</span></>
            ) : (
              <span className="text-sm font-bold text-gray-300">Basic Plan</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}