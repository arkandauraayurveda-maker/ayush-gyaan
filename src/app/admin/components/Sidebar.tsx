"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, BookOpen, Ticket, Users, Tag, Building2, Layers, Bot, Settings, Crown } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="glass-panel w-full md:w-72 h-[50vh] md:h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      
      <div className="flex items-center gap-3 border-b border-gray-800 p-6 shrink-0">
        <ShieldCheck className="text-red-500 w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
          <p className="text-xs text-red-400">Strict Access Granted</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 p-6 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* 📚 CONTENT CREATION */}
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Content Creation</div>
        <button onClick={() => setActiveTab("SAMHITA")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "SAMHITA" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "text-gray-400 hover:bg-white/5"}`}>
          <Layers className="w-4 h-4" /> Samhita Engine
        </button>
        
        {/* 🤖 NEW: AI ENGINE CONTROL */}
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4 text-cyan-500">AI Engine Control</div>
        <button onClick={() => setActiveTab("AI_CHAT_LOGS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "AI_CHAT_LOGS" ? "bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "text-gray-400 hover:bg-white/5"}`}>
          <Bot className="w-4 h-4" /> AI Chat Analytics
        </button>
        <button onClick={() => setActiveTab("GLOBAL_SETTINGS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "GLOBAL_SETTINGS" ? "bg-purple-900/30 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "text-gray-400 hover:bg-white/5"}`}>
          <Settings className="w-4 h-4" /> Global Settings
        </button>

        {/* 📈 SALES & MARKETING */}
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4">Sales & Marketing</div>
        <button onClick={() => setActiveTab("COURSES")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "COURSES" ? "bg-amber-900/30 text-amber-400 border border-amber-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <BookOpen className="w-4 h-4" /> Manage Courses
        </button>
        <button onClick={() => setActiveTab("COUPONS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "COUPONS" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Tag className="w-4 h-4" /> Manage Coupons
        </button>
        <button onClick={() => setActiveTab("LEADS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${activeTab === "LEADS" ? "bg-purple-900/30 text-purple-400 border border-purple-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Ticket className="w-4 h-4" /> Early Bird Leads
        </button>

        {/* 👥 USER MANAGEMENT */}
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-2">User Management</div>
        <button onClick={() => setActiveTab("SUBSCRIPTIONS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "SUBSCRIPTIONS" ? "bg-amber-900/30 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "text-gray-400 hover:bg-white/5"}`}>
          <Crown className="w-4 h-4" /> Subscriptions & Roles
        </button>
        <button onClick={() => setActiveTab("STUDENTS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "STUDENTS" ? "bg-blue-900/30 text-blue-400 border border-blue-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Users className="w-4 h-4" /> App Students
        </button>
        <button onClick={() => setActiveTab("INSTITUTIONS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all pb-6 ${activeTab === "INSTITUTIONS" ? "bg-blue-900/30 text-blue-400 border border-blue-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Building2 className="w-4 h-4" /> Manage Institutions
        </button>
        
      </nav>
    </aside>
  );
}