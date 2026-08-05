"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Zap, Database, Search, User, Clock, Bot, CheckCircle2, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function ChatAnalyticsTab() {
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔄 डेटाबेस से चैट हिस्ट्री मंगाने का फंक्शन
  const fetchChatLogs = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/chat-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChatLogs();
  }, []);

  // 🧮 Stats Calculation
  const totalQueries = chatLogs.length;
  const dbHits = chatLogs.filter(log => log.isExactMatch).length; // Zero Cost Queries
  const aiGenerated = totalQueries - dbHits;

  // 🔍 Search Filter
  const filteredLogs = chatLogs.filter(log => 
    log.userMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.aiResponse?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <Bot className="w-6 h-6" /> AI Chat Analytics
        </h2>
        <p className="text-sm text-gray-400 mt-1">Monitor student queries, AI responses, and token usage in real-time.</p>
      </div>

      {/* 📈 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 border border-blue-500/20 bg-blue-950/10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare className="w-16 h-16 text-blue-500"/></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Queries</p>
          <h3 className="text-4xl font-black text-blue-400">{totalQueries}</h3>
          <p className="text-xs text-blue-500/70 mt-2">All time questions asked</p>
        </div>
        
        <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-950/10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Database className="w-16 h-16 text-emerald-500"/></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Direct DB Hits</p>
          <h3 className="text-4xl font-black text-emerald-400">{dbHits}</h3>
          <p className="text-xs text-emerald-500/70 mt-2">Zero-cost API bypasses</p>
        </div>

        <div className="glass-panel p-6 border border-purple-500/20 bg-purple-950/10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-16 h-16 text-purple-500"/></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">AI Generated</p>
          <h3 className="text-4xl font-black text-purple-400">{aiGenerated}</h3>
          <p className="text-xs text-purple-500/70 mt-2">Gemini API requests used</p>
        </div>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search questions or answers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/50 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
      </div>

      {/* 📜 CHAT LOGS LIST */}
      <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-black/40 flex justify-between items-center">
          <h3 className="font-bold text-gray-200">Recent Conversations</h3>
          <button onClick={fetchChatLogs} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Refresh Logs"}
          </button>
        </div>

        {isLoading && chatLogs.length === 0 ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No chat history found.</div>
        ) : (
          <div className="divide-y divide-gray-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredLogs.map((log) => (
              <div key={log._id} className="p-5 hover:bg-white/[0.02] transition-colors">
                
                {/* Meta Info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md border border-gray-700">
                      <User className="w-3 h-3 text-blue-400"/> User ID: {log.userId?.substring(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md border border-gray-700">
                      <Clock className="w-3 h-3 text-gray-400"/> {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Badge: DB Match vs AI Generation */}
                  {log.isExactMatch ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-1 rounded-full">
                      <Database className="w-3 h-3"/> Direct Match (Free)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-950/30 border border-purple-500/30 px-2 py-1 rounded-full">
                      <Zap className="w-3 h-3"/> AI ({log.modelUsed})
                    </span>
                  )}
                </div>

                {/* Question & Answer */}
                <div className="space-y-3 pl-2 border-l-2 border-gray-800">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Q:</span>
                    <p className="text-sm text-gray-200 mt-0.5">{log.userMessage}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3"/> AI Reply:
                    </span>
                    <p className="text-sm text-gray-400 line-clamp-3">{log.aiResponse}</p>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}