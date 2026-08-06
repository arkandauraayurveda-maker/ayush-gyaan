"use client";

import { ShieldCheck, BookOpen, Ticket, Users, Tag, Building2, Layers, Bot, Settings, UserPlus, BarChart3 } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isMainAdmin?: boolean;
  allowedTabs?: string[];
}

export default function Sidebar({ activeTab, setActiveTab, isMainAdmin = false, allowedTabs = [] }: SidebarProps) {

  // Helper check: Main Admin sees everything; Co-Admin sees only explicitly approved tabs
  const canSeeTab = (tabKey: string) => {
    if (isMainAdmin) return true;
    return allowedTabs.includes(tabKey);
  };

  const hasSalesCategory = canSeeTab("COURSES") || canSeeTab("COUPONS") || canSeeTab("LEADS");
  const hasUserCategory = canSeeTab("STUDENTS") || canSeeTab("INSTITUTIONS");
  const hasAiCategory = canSeeTab("AI_CHAT_LOGS") || canSeeTab("GLOBAL_SETTINGS");

  return (
    <aside className="glass-panel w-full md:w-72 h-[50vh] md:h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      
      <div className="flex items-center gap-3 border-b border-gray-800 p-6 shrink-0">
        <ShieldCheck className={`w-8 h-8 ${isMainAdmin ? 'text-amber-500' : 'text-emerald-500'}`} />
        <div>
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
          <p className={`text-xs font-semibold ${isMainAdmin ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isMainAdmin ? "Super Admin Access" : "Co-Admin Access"}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 p-6 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* 🔒 MAIN ADMIN ONLY: CO-ADMIN MANAGEMENT */}
        {isMainAdmin && (
          <>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Super Admin Controls</div>
            <button 
              onClick={() => setActiveTab("CO_ADMIN_MANAGER")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "CO_ADMIN_MANAGER" 
                  ? "bg-amber-900/30 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-bold" 
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <UserPlus className="w-4 h-4 text-amber-400" /> Co-Admin Permissions
            </button>
          </>
        )}

        {/* 📚 CONTENT CREATION */}
        {canSeeTab("SAMHITA") && (
          <>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-3">Content Creation</div>
            <button 
              onClick={() => setActiveTab("SAMHITA")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "SAMHITA" 
                  ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold" 
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <Layers className="w-4 h-4" /> Samhita Engine
            </button>
          </>
        )}
        
        {/* 🤖 AI ENGINE CONTROL */}
        {hasAiCategory && (
          <>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4 text-cyan-500">AI Engine Control</div>
            {canSeeTab("AI_CHAT_LOGS") && (
              <button 
                onClick={() => setActiveTab("AI_CHAT_LOGS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "AI_CHAT_LOGS" 
                    ? "bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Bot className="w-4 h-4" /> AI Chat Logs
              </button>
            )}
            {canSeeTab("AI_CHAT_LOGS") && (
              <button 
                onClick={() => setActiveTab("AI_COST_INTELLIGENCE")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "AI_COST_INTELLIGENCE" 
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Cost Intelligence
              </button>
            )}
            {canSeeTab("GLOBAL_SETTINGS") && (
              <button 
                onClick={() => setActiveTab("GLOBAL_SETTINGS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "GLOBAL_SETTINGS" 
                    ? "bg-purple-900/30 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)] font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Settings className="w-4 h-4" /> Global Settings
              </button>
            )}
          </>
        )}

        {/* 📈 SALES & MARKETING */}
        {hasSalesCategory && (
          <>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4">Sales & Marketing</div>
            {canSeeTab("COURSES") && (
              <button 
                onClick={() => setActiveTab("COURSES")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "COURSES" 
                    ? "bg-amber-900/30 text-amber-400 border border-amber-500/50 font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Manage Courses
              </button>
            )}
            {canSeeTab("COUPONS") && (
              <button 
                onClick={() => setActiveTab("COUPONS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "COUPONS" 
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Tag className="w-4 h-4" /> Manage Coupons
              </button>
            )}
            {canSeeTab("LEADS") && (
              <button 
                onClick={() => setActiveTab("LEADS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "LEADS" 
                    ? "bg-purple-900/30 text-purple-400 border border-purple-500/50 font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Ticket className="w-4 h-4" /> Early Bird Leads
              </button>
            )}
          </>
        )}

        {/* 👥 USER MANAGEMENT */}
        {hasUserCategory && (
          <>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4">User Management</div>
            {canSeeTab("STUDENTS") && (
              <button 
                onClick={() => setActiveTab("STUDENTS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "STUDENTS" || activeTab === "SUBSCRIPTIONS" 
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Users className="w-4 h-4" /> Students & Subscriptions
              </button>
            )}
            {canSeeTab("INSTITUTIONS") && (
              <button 
                onClick={() => setActiveTab("INSTITUTIONS")} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "INSTITUTIONS" 
                    ? "bg-blue-900/30 text-blue-400 border border-blue-500/50 font-bold" 
                    : "text-gray-400 hover:bg-white/5"
                }`}
              >
                <Building2 className="w-4 h-4" /> Manage Institutions
              </button>
            )}
          </>
        )}
        
      </nav>
    </aside>
  );
}