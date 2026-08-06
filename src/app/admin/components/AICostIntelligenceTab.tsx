"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, TrendingUp, Cpu, Users, AlertTriangle, Download, Settings,
  Zap, Layers, MessageSquare, Mic, Image, FileText, CheckCircle2, Loader2,
  Clock, ShieldAlert, BarChart3, RefreshCw, X, Save
} from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AICostIntelligenceTab() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Budget Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyBudgetInput, setDailyBudgetInput] = useState(500);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState(10000);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState("");

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/ai-analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
        if (result.budgetSettings) {
          setDailyBudgetInput(result.budgetSettings.dailyBudgetInr || 500);
          setMonthlyBudgetInput(result.budgetSettings.monthlyBudgetInr || 10000);
        }
      }
    } catch (e) {
      console.error("Failed to fetch AI cost analytics", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    setModalSuccessMsg("");

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/ai-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          aiBudgetSettings: {
            ...data?.budgetSettings,
            dailyBudgetInr: Number(dailyBudgetInput),
            monthlyBudgetInr: Number(monthlyBudgetInput)
          }
        })
      });

      const result = await res.json();
      if (result.success) {
        setModalSuccessMsg("Budget settings saved successfully!");
        fetchAnalytics();
        setTimeout(() => setIsModalOpen(false), 1200);
      }
    } catch (e) {
      console.error("Failed to save budget settings", e);
    } finally {
      setIsSavingBudget(false);
    }
  };

  // 📄 EXPORT CSV REPORT
  const exportCsvReport = () => {
    if (!data) return;
    let csv = "Feature Name,Requests,Total Tokens,Total Cost (INR),Avg Cost (INR),Avg Latency (ms)\n";
    data.featureCostMatrix?.forEach((row: any) => {
      csv += `"${row.featureName}",${row.requests},${row.totalTokens},₹${row.totalCostInr},₹${row.avgCostInr},${row.avgLatencyMs}ms\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AyushGyaan_AI_Cost_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 📊 EXPORT EXCEL / JSON REPORT
  const exportJsonReport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AyushGyaan_AI_Cost_Data_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">Aggregating AyushGyaan AI Cost Intelligence...</p>
      </div>
    );
  }

  const overview = data?.overview || {};
  const budget = data?.budgetSettings || { dailyBudgetInr: 500 };
  const dailyCost = overview.todayCost || 0;
  const budgetPercentage = Math.min(100, Math.round((dailyCost / (budget.dailyBudgetInr || 500)) * 100));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-16">
      
      {/* HEADER CONTROLS & SMART ALERTS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
              Production Cost Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-emerald-400" /> AyushGyaan AI Cost & Analytics
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real-time token usage, INR cost metrics, and model performance across all 13 features.</p>
        </div>

        {/* ACTION BUTTONS & EXPORT CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2.5 bg-black/40 hover:bg-black/60 border border-gray-800 rounded-xl text-xs text-gray-300 font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={exportCsvReport}
            className="px-3.5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> CSV Report
          </button>

          <button
            onClick={exportJsonReport}
            className="px-3.5 py-2.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <FileText className="w-3.5 h-3.5" /> Data JSON
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Settings className="w-3.5 h-3.5" /> Admin Controls
          </button>
        </div>
      </div>

      {/* 🔔 BUDGET PROGRESS BAR & ACTIVE SMART ALERTS */}
      <div className="glass-panel p-6 border border-gray-800 rounded-2xl bg-black/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Cost vs Daily Budget</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">₹{dailyCost.toFixed(2)}</span>
              <span className="text-xs text-gray-500 font-medium">/ ₹{budget.dailyBudgetInr || 500}.00 Daily Limit</span>
            </div>
          </div>

          {data?.alerts && data.alerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.alerts.map((alert: any, i: number) => (
                <span key={i} className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {alert.message}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress Line */}
        <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
          <div 
            className={`h-full transition-all duration-500 ${budgetPercentage > 90 ? 'bg-red-500' : budgetPercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>
      </div>

      {/* 📈 6 TOP OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-5 border border-emerald-500/30 bg-emerald-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today's Cost</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₹{overview.todayCost || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">{overview.todayReqs || 0} Requests Today</p>
        </div>

        <div className="glass-panel p-5 border border-blue-500/30 bg-blue-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Yesterday</p>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">₹{overview.yesterdayCost || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">Prior 24 Hours</p>
        </div>

        <div className="glass-panel p-5 border border-purple-500/30 bg-purple-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 7 Days</p>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">₹{overview.last7DaysCost || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">7-Day Total</p>
        </div>

        <div className="glass-panel p-5 border border-amber-500/30 bg-amber-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Cost</p>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">₹{overview.monthlyCost || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">Current Month</p>
        </div>

        <div className="glass-panel p-5 border border-cyan-500/30 bg-cyan-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Cost</p>
          <h3 className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">₹{overview.lifetimeCost || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">{overview.totalLifetimeTokens || 0} Tokens</p>
        </div>

        <div className="glass-panel p-5 border border-teal-500/30 bg-teal-950/10 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Cost/Req</p>
          <h3 className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">₹{overview.avgCostPerRequest || 0}</h3>
          <p className="text-[10px] text-gray-500 mt-1">Avg Latency: {overview.avgLatencyMs || 0}ms</p>
        </div>
      </div>

      {/* 📊 FEATURE COST MATRIX (ALL 13 AYUSHGYAAN FEATURES) */}
      <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-800 bg-black/40 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> AyushGyaan 13-Feature Cost & Token Matrix
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Granular breakdown of cost in ₹ INR, token counts, and response latency across features.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-gray-400 uppercase font-bold tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">Feature Name</th>
                <th className="p-4">Requests</th>
                <th className="p-4">Total Tokens</th>
                <th className="p-4">Total Cost (₹ INR)</th>
                <th className="p-4">Avg Cost / Req</th>
                <th className="p-4">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {data?.featureCostMatrix?.map((row: any) => (
                <tr key={row.featureName} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-white font-bold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> {row.featureName}
                  </td>
                  <td className="p-4 text-gray-300 font-mono">{row.requests}</td>
                  <td className="p-4 text-gray-300 font-mono">{row.totalTokens.toLocaleString()}</td>
                  <td className="p-4 text-emerald-400 font-bold font-mono">₹{row.totalCostInr}</td>
                  <td className="p-4 text-teal-300 font-mono">₹{row.avgCostInr}</td>
                  <td className="p-4 text-gray-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" /> {row.avgLatencyMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👑 MOST EXPENSIVE USERS & INPUT TYPE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEADERBOARD */}
        <div className="glass-panel border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-gray-800 pb-3">
            <Users className="w-4 h-4 text-purple-400" /> Top Expensive Users Leaderboard
          </h3>

          <div className="space-y-3">
            {data?.mostExpensiveUsers?.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No AI activity recorded yet.</p>
            ) : (
              data?.mostExpensiveUsers?.map((u: any, idx: number) => (
                <div key={u.userId} className="p-3 bg-black/40 border border-gray-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 font-mono">₹{u.totalCostInr}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{u.totalTokens} Tokens • {u.requests} Reqs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* INPUT TYPE & MODEL BREAKDOWN */}
        <div className="glass-panel border border-gray-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-gray-800 pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" /> Input Types & Model Breakdown
          </h3>

          {/* Input Types Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-black/40 border border-gray-800 rounded-xl text-center">
              <MessageSquare className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-gray-400 uppercase">Text Requests</p>
              <p className="text-lg font-black text-white mt-0.5">{data?.inputTypeBreakdown?.TEXT?.requests || 0}</p>
              <p className="text-[10px] text-emerald-400 font-mono">₹{data?.inputTypeBreakdown?.TEXT?.costInr || 0}</p>
            </div>

            <div className="p-4 bg-black/40 border border-gray-800 rounded-xl text-center">
              <Image className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-gray-400 uppercase">Vision/Image</p>
              <p className="text-lg font-black text-white mt-0.5">{data?.inputTypeBreakdown?.IMAGE?.requests || 0}</p>
              <p className="text-[10px] text-purple-400 font-mono">₹{data?.inputTypeBreakdown?.IMAGE?.costInr || 0}</p>
            </div>

            <div className="p-4 bg-black/40 border border-gray-800 rounded-xl text-center">
              <Mic className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-gray-400 uppercase">Voice Chat</p>
              <p className="text-lg font-black text-white mt-0.5">{data?.inputTypeBreakdown?.VOICE?.requests || 0}</p>
              <p className="text-[10px] text-cyan-400 font-mono">₹{data?.inputTypeBreakdown?.VOICE?.costInr || 0}</p>
            </div>
          </div>

          {/* Model Distribution */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Model Usage Distribution</h4>
            <div className="space-y-2">
              {data?.modelUsage?.map((m: any) => (
                <div key={m.modelName} className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-200 font-mono">{m.modelName}</span>
                  <span className="text-gray-400 font-mono">{m.requests} Requests • <strong className="text-emerald-400">₹{m.costInr}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 🔒 ADMIN BUDGET CONTROLS MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#070d0a] border border-emerald-900/60 p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" /> Admin Budget Controls (₹ INR)
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {modalSuccessMsg}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Daily AI Budget Cap (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={dailyBudgetInput}
                    onChange={(e) => setDailyBudgetInput(Number(e.target.value))}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Monthly AI Budget Cap (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={monthlyBudgetInput}
                    onChange={(e) => setMonthlyBudgetInput(Number(e.target.value))}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-black/40 border border-gray-800 text-gray-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  disabled={isSavingBudget}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSavingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Budget
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
