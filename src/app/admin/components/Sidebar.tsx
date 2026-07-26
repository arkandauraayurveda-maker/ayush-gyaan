"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, UploadCloud, FileText, Database, BookOpen, Ticket, Users, Tag, Building2 } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [pendingCount, setPendingCount] = useState(0);

  // Sidebar khud check karega ki kitne pending shlokas hain
  useEffect(() => {
    fetch("/api/shlokas/pending")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPendingCount(data.data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="glass-panel w-full md:w-72 h-[50vh] md:h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      
      {/* 🔥 FIXED HEADER (Yeh kabhi move nahi hoga) */}
      <div className="flex items-center gap-3 border-b border-gray-800 p-6 shrink-0">
        <ShieldCheck className="text-red-500 w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
          <p className="text-xs text-red-400">Strict Access Granted</p>
        </div>
      </div>

      {/* 🔥 SCROLLABLE MENU (Yahan scrollbar aayega agar buttons zyada honge) */}
      <nav className="flex flex-col gap-2 p-6 overflow-y-auto flex-1 custom-scrollbar">
        
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">AI Extraction</div>
        <button onClick={() => setActiveTab("EXTRACT")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "EXTRACT" ? "bg-primary/20 text-primary border border-primary/50" : "text-gray-400 hover:bg-white/5"}`}>
          <UploadCloud className="w-4 h-4" /> Auto-Pilot
        </button>
        <button onClick={() => setActiveTab("REVIEW")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${activeTab === "REVIEW" ? "bg-accent/20 text-accent border border-accent/50" : "text-gray-400 hover:bg-white/5"}`}>
          <FileText className="w-4 h-4" /> Pending Review
          {pendingCount > 0 && <span className="absolute right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>}
        </button>
        <button onClick={() => setActiveTab("DATABASE")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${activeTab === "DATABASE" ? "bg-green-900/30 text-green-400 border border-green-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Database className="w-4 h-4" /> Live Database
        </button>
        
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-2">Sales & Marketing</div>
        <button onClick={() => setActiveTab("COURSES")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "COURSES" ? "bg-amber-900/30 text-amber-400 border border-amber-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <BookOpen className="w-4 h-4" /> Manage Courses
        </button>
        <button onClick={() => setActiveTab("COUPONS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "COUPONS" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Tag className="w-4 h-4" /> Manage Coupons
        </button>
        <button onClick={() => setActiveTab("LEADS")} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${activeTab === "LEADS" ? "bg-purple-900/30 text-purple-400 border border-purple-500/50" : "text-gray-400 hover:bg-white/5"}`}>
          <Ticket className="w-4 h-4" /> Early Bird Leads
        </button>

        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-2">User Management</div>
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