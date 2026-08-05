"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Server, Loader2, Sparkles, AlertTriangle, Database, IndianRupee, Image as ImageIcon, Mic } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function GlobalSettingsTab() {
  const [models, setModels] = useState({
    basic: "gemini-1.5-flash-8b",
    plus: "gemini-1.5-flash",
    pro: "gemini-1.5-pro"
  });
  
  const [limits, setLimits] = useState({
    basic: 10,
    plus: 100,
    pro: 9999
  });

  const [multimodalLimits, setMultimodalLimits] = useState({
    basic: 3,
    plus: 25,
    pro: 9999
  });

  const [pricing, setPricing] = useState({
    basic: { monthly: 0, yearly: 0, offerTag: "Free Forever" },
    plus: { monthly: 199, yearly: 1999, offerTag: "Save 16%" },
    pro: { monthly: 499, yearly: 4999, offerTag: "Save 17%" }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🔄 डेटाबेस से मौजूदा सेटिंग्स मंगाएं
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/settings", {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {}
        });
        const data = await res.json();
        if (data.success && data.settings) {
          if (data.settings.aiModels) setModels(data.settings.aiModels);
          if (data.settings.aiLimits) {
            const l = data.settings.aiLimits;
            setLimits({
              basic: typeof l.basic === "object" ? l.basic.text : (l.basic ?? 10),
              plus: typeof l.plus === "object" ? l.plus.text : (l.plus ?? 100),
              pro: typeof l.pro === "object" ? l.pro.text : (l.pro ?? 9999),
            });
          }
          if (data.settings.aiMultimodalLimits) setMultimodalLimits(data.settings.aiMultimodalLimits);
          if (data.settings.aiPricing) {
            const p = data.settings.aiPricing;
            setPricing({
              basic: typeof p.basic === "object" ? p.basic : { monthly: Number(p.basic || 0), yearly: 0, offerTag: "Free Forever" },
              plus: typeof p.plus === "object" ? p.plus : { monthly: Number(p.plus || 199), yearly: Number(p.plus || 199) * 12, offerTag: "Save 16%" },
              pro: typeof p.pro === "object" ? p.pro : { monthly: Number(p.pro || 499), yearly: Number(p.pro || 499) * 12, offerTag: "Save 17%" }
            });
          }
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          aiModels: models,
          aiLimits: limits,
          aiMultimodalLimits: multimodalLimits,
          aiPricing: pricing
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ All System Settings Updated Successfully!");
      } else {
        alert("⚠️ Failed to update settings: " + (data.error || "Unknown error"));
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
        <p className="text-sm text-gray-400 mt-1">Manage AI models, daily text/multimodal limits, and subscription pricing dynamically.</p>
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
            <p><strong>Note:</strong> You can type any model name manually (e.g., <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">gemini-3.6-flash</code>, <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">gemini-3.5</code>, <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">gemini-2.5-flash</code>, <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">gemini-1.5-pro</code>).</p>
          </div>

          <datalist id="gemini-models-list">
            <option value="gemini-3.6-flash" />
            <option value="gemini-3.5" />
            <option value="gemini-3.0-flash" />
            <option value="gemini-2.5-flash" />
            <option value="gemini-2.5-pro" />
            <option value="gemini-2.0-flash" />
            <option value="gemini-1.5-flash" />
            <option value="gemini-1.5-pro" />
            <option value="gemini-1.5-flash-8b" />
          </datalist>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 focus-within:border-gray-500 transition-colors">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic Plan Model</label>
              <input 
                type="text" 
                list="gemini-models-list"
                required 
                placeholder="e.g. gemini-1.5-flash-8b"
                value={models.basic} 
                onChange={(e) => setModels({...models, basic: e.target.value})} 
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" 
              />
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Sparkles className="w-3 h-3"/> Plus Plan Model</label>
              <input 
                type="text" 
                list="gemini-models-list"
                required 
                placeholder="e.g. gemini-3.6-flash"
                value={models.plus} 
                onChange={(e) => setModels({...models, plus: e.target.value})} 
                className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" 
              />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Sparkles className="w-3 h-3"/> Pro Plan Model</label>
              <input 
                type="text" 
                list="gemini-models-list"
                required 
                placeholder="e.g. gemini-3.5"
                value={models.pro} 
                onChange={(e) => setModels({...models, pro: e.target.value})} 
                className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" 
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: DAILY TEXT TOKEN LIMITS ================= */}
        <div className="glass-panel border border-blue-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-gray-200">Daily Text Query Limits</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 focus-within:border-gray-500 transition-colors">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic Text Limit</label>
              <input type="number" min="0" required value={limits.basic} onChange={(e) => setLimits({...limits, basic: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">Plus Text Limit</label>
              <input type="number" min="0" required value={limits.plus} onChange={(e) => setLimits({...limits, plus: Number(e.target.value)})} className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Pro Text Limit</label>
              <input type="number" min="0" required value={limits.pro} onChange={(e) => setLimits({...limits, pro: Number(e.target.value)})} className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
              <p className="text-[10px] text-purple-500 mt-2">Enter 9999 for unlimited.</p>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: DAILY MULTIMODAL LIMITS ================= */}
        <div className="glass-panel border border-cyan-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-1 text-cyan-400">
              <ImageIcon className="w-5 h-5" />
              <Mic className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-gray-200">Daily Multimodal (Image & Voice) Query Limits</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 focus-within:border-gray-500 transition-colors">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Basic Image/Voice Limit</label>
              <input type="number" min="0" required value={multimodalLimits.basic} onChange={(e) => setMultimodalLimits({...multimodalLimits, basic: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" />
            </div>
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">Plus Image/Voice Limit</label>
              <input type="number" min="0" required value={multimodalLimits.plus} onChange={(e) => setMultimodalLimits({...multimodalLimits, plus: Number(e.target.value)})} className="w-full bg-black/50 border border-emerald-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Pro Image/Voice Limit</label>
              <input type="number" min="0" required value={multimodalLimits.pro} onChange={(e) => setMultimodalLimits({...multimodalLimits, pro: Number(e.target.value)})} className="w-full bg-black/50 border border-purple-900 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500" />
              <p className="text-[10px] text-purple-500 mt-2">Enter 9999 for unlimited.</p>
            </div>
          </div>
        </div>

        {/* ================= SECTION 4: PRICING (MONTHLY & YEARLY OPTIONS) ================= */}
        <div className="glass-panel border border-emerald-500/20 bg-black/40 p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-gray-200">Subscription Pricing Engine</h3>
              <p className="text-xs text-gray-400">Set monthly and annual plan prices with custom discount offer badges.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BASIC PLAN */}
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 transition-colors opacity-60">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Basic Plan</label>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Monthly Price (₹)</label>
                  <input type="number" disabled value={pricing.basic.monthly} className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Yearly Price (₹)</label>
                  <input type="number" disabled value={pricing.basic.yearly} className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400" />
                </div>
                <p className="text-[10px] text-emerald-400 pt-1">Always Free.</p>
              </div>
            </div>

            {/* PLUS PLAN */}
            <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-900/50 focus-within:border-emerald-500 transition-colors">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Plus Plan Pricing
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-emerald-300 uppercase block mb-1 font-semibold">Monthly Price (₹/mo)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={pricing.plus.monthly} 
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setPricing({
                        ...pricing, 
                        plus: { 
                          ...pricing.plus, 
                          monthly: m,
                          yearly: pricing.plus.yearly || m * 12
                        }
                      });
                    }} 
                    className="w-full bg-black/50 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-300 uppercase block mb-1 font-semibold">Yearly Price (₹/yr)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={pricing.plus.yearly} 
                    onChange={(e) => setPricing({...pricing, plus: {...pricing.plus, yearly: Number(e.target.value)}})} 
                    className="w-full bg-black/50 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-300 uppercase block mb-1 font-semibold">Offer Tag / Discount Badge</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Save 16%" 
                    value={pricing.plus.offerTag || ""} 
                    onChange={(e) => setPricing({...pricing, plus: {...pricing.plus, offerTag: e.target.value}})} 
                    className="w-full bg-black/50 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
            </div>

            {/* PRO PLAN */}
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/50 focus-within:border-purple-500 transition-colors">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Pro Plan Pricing
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-purple-300 uppercase block mb-1 font-semibold">Monthly Price (₹/mo)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={pricing.pro.monthly} 
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setPricing({
                        ...pricing, 
                        pro: { 
                          ...pricing.pro, 
                          monthly: m,
                          yearly: pricing.pro.yearly || m * 12
                        }
                      });
                    }} 
                    className="w-full bg-black/50 border border-purple-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300 uppercase block mb-1 font-semibold">Yearly Price (₹/yr)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={pricing.pro.yearly} 
                    onChange={(e) => setPricing({...pricing, pro: {...pricing.pro, yearly: Number(e.target.value)}})} 
                    className="w-full bg-black/50 border border-purple-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300 uppercase block mb-1 font-semibold">Offer Tag / Discount Badge</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Save 17%" 
                    value={pricing.pro.offerTag || ""} 
                    onChange={(e) => setPricing({...pricing, pro: {...pricing.pro, offerTag: e.target.value}})} 
                    className="w-full bg-black/50 border border-purple-900 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500" 
                  />
                </div>
              </div>
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