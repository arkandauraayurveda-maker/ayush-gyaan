"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Server, Loader2, Sparkles, AlertTriangle, Database, IndianRupee } from "lucide-react";

export default function GlobalSettingsTab() {
  const [models, setModels] = useState({
    basic: "gemini-3.5-flash-lite",
    plus: "gemini-3.5-flash",
    pro: "gemini-3.6-flash"
  });
  
  const [limits, setLimits] = useState({
    basic: 10,
    plus: 100,
    pro: 9999
  });

  const [pricing, setPricing] = useState({
    basic: 0,
    plus: 199,
    pro: 499
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🔄 डेटाबेस से मौजूदा सेटिंग्स मंगाएं
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          if (data.settings.aiModels) setModels(data.settings.aiModels);
          if (data.settings.aiLimits) setLimits(data.settings.aiLimits);
          if (data.settings.aiPricing) setPricing(data.settings.aiPricing);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 💾 सेटिंग्स सेव करें
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔥 Send all three objects
        body: JSON.stringify({ aiModels: models, aiLimits: limits, aiPricing: pricing })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ All System Settings Updated Successfully!");
      } else {
        alert("⚠️ Failed to update settings.");
      }
    } catch (error) {
      alert("⚠️ Network Error.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
          <Settings className="w-6 h-6" /> Global System Settings
        </h2>
        <p className="text-sm text-gray-400 mt-1">Manage AI models, daily token limits, and subscription pricing dynamically.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* ================= SECTION 1: AI MODELS ================= */}
        <div className="glass-panel border border-purple-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <Server className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-gray-200">Generative AI Model Configuration</h3>
          </div>
          
          <div className="bg-blue-950/20 border-l-4 border-blue-500 p-4 rounded-r-xl mb-8 flex gap-3 text-sm text-blue-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-blue-400" />
            <p><strong>Note:</strong> Ensure the model names perfectly match the official Google Gemini aliases (e.g., <code className="bg-black/50 px-1 py-0.5 rounded text-blue-300">gemini-1.5-flash</code>).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 focus-within:border-gray-500 transition-colors">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic Plan (Fallback)</label>
              <input type="text" required value={models.basic} onChange={(e) => setModels({...models, basic: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Sparkles className="w-3 h-3"/> Plus Plan</label>
              <input type="text" required value={models.plus} onChange={(e) => setModels({...models, plus: e.target.value})} className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Sparkles className="w-3 h-3"/> Pro Plan</label>
              <input type="text" required value={models.pro} onChange={(e) => setModels({...models, pro: e.target.value})} className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: TOKEN LIMITS ================= */}
        <div className="glass-panel border border-blue-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-gray-200">Daily Token Limits (Queries/Day)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 focus-within:border-gray-500 transition-colors">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic (Free)</label>
              <input type="number" min="0" required value={limits.basic} onChange={(e) => setLimits({...limits, basic: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">Plus Limit</label>
              <input type="number" min="0" required value={limits.plus} onChange={(e) => setLimits({...limits, plus: Number(e.target.value)})} className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Pro Limit</label>
              <input type="number" min="0" required value={limits.pro} onChange={(e) => setLimits({...limits, pro: Number(e.target.value)})} className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
              <p className="text-[10px] text-purple-500 mt-2">Enter 9999 for unlimited.</p>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: PRICING ================= */}
        <div className="glass-panel border border-emerald-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-gray-200">Subscription Pricing (₹/mo)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 transition-colors opacity-60 cursor-not-allowed">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic Plan</label>
              <input type="number" disabled value={pricing.basic} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400 outline-none" />
              <p className="text-[10px] text-gray-500 mt-2">Always Free.</p>
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">Plus Price (₹)</label>
              <input type="number" min="1" required value={pricing.plus} onChange={(e) => setPricing({...pricing, plus: Number(e.target.value)})} className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Pro Price (₹)</label>
              <input type="number" min="1" required value={pricing.pro} onChange={(e) => setPricing({...pricing, pro: Number(e.target.value)})} className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl flex justify-end">
          <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
            {isSaving ? "Saving Config..." : "Save All Settings"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}