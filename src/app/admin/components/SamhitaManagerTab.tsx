"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, FileText, Database, Wand2 } from "lucide-react";

// In components ko hum aage chalkar apne naye logic (Tika, Hindi translation) ke sath update karenge
import AutoPilotTab from "./AutoPilotTab"; 
import PendingReviewTab from "./PendingReviewTab"; 
import LiveDatabaseTab from "./LiveDatabaseTab"; 
import TikaAgentTab from "./TikaAgentTab"; // 🔥 NAYA AGENT IMPORT KIYA

export default function SamhitaManagerTab() {
  // Samhita Engine ke andar ka routing state
  const [engineTab, setEngineTab] = useState<"MOOL_AGENT" | "TIKA_AGENT" | "REVIEW" | "LIVE_DB">("MOOL_AGENT");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
      
      {/* 🚀 INTERNAL TOP NAVIGATION FOR SAMHITA ENGINE */}
      <div className="bg-[#050B08]/80 backdrop-blur-md border border-emerald-500/20 p-2 rounded-2xl mb-6 flex flex-wrap gap-2 shadow-lg">
        
        <button onClick={() => setEngineTab("MOOL_AGENT")} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${engineTab === "MOOL_AGENT" ? "bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "text-gray-400 hover:bg-white/5 hover:text-emerald-300"}`}>
          <Cpu className="w-4 h-4" /> Mool Shloka Agent
        </button>

        <button onClick={() => setEngineTab("TIKA_AGENT")} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${engineTab === "TIKA_AGENT" ? "bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.4)]" : "text-gray-400 hover:bg-white/5 hover:text-teal-300"}`}>
          <Wand2 className="w-4 h-4" /> Tika & Grammar Agent
        </button>

        <button onClick={() => setEngineTab("REVIEW")} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${engineTab === "REVIEW" ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "text-gray-400 hover:bg-white/5 hover:text-amber-300"}`}>
          <FileText className="w-4 h-4" /> Review Merged Drafts
        </button>

        <button onClick={() => setEngineTab("LIVE_DB")} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${engineTab === "LIVE_DB" ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "text-gray-400 hover:bg-white/5 hover:text-blue-300"}`}>
          <Database className="w-4 h-4" /> Live Database
        </button>
      </div>

      {/* 🧩 DYNAMIC WORKSPACE (Sub-Components Render Here) */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <AnimatePresence mode="wait">
          
          {engineTab === "MOOL_AGENT" && (
            <motion.div key="mool" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              {/* Purana AutoPilot yahan chalega, aage hum ise update karenge */}
              <AutoPilotTab /> 
            </motion.div>
          )}
          
          {/* 🔥 YAHAN TIKA AGENT COMPONENT LAGA DIYA */}
          {engineTab === "TIKA_AGENT" && (
            <motion.div key="tika" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <TikaAgentTab />
            </motion.div>
          )}

          {engineTab === "REVIEW" && (
            <motion.div key="review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              {/* Purana Review tab */}
              <PendingReviewTab />
            </motion.div>
          )}

          {engineTab === "LIVE_DB" && (
            <motion.div key="live" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              {/* Purana Live Database tab */}
              <LiveDatabaseTab />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}