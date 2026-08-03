"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Database, Trash, AlertTriangle, Edit3, Trash2, 
  ChevronDown, ChevronUp, Sparkles, BrainCircuit, CheckCircle2, AlertCircle 
} from "lucide-react";

export default function LiveDatabaseTab() {
  const [liveShlokas, setLiveShlokas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [expandedShlokas, setExpandedShlokas] = useState<Record<string, boolean>>({});
  
  // 🔥 AI EMBEDDINGS STATES
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info" | null; text: string }>({ type: null, text: "" });

  useEffect(() => {
    fetchLiveShlokas();
  }, []);

  const fetchLiveShlokas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shlokas/approved");
      const json = await res.json();
      if (json.success) setLiveShlokas(json.data);
    } catch (error) { 
      console.error("Failed to fetch live database", error); 
    }
    setIsLoading(false);
  };

  const generateEmbeddings = async () => {
    setIsGenerating(true);
    setStatusMsg({ type: "info", text: "AI is reading and vectorizing your Shlokas. Please wait..." });

    try {
      const response = await fetch("/api/embeddings/generate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setStatusMsg({ type: "success", text: data.message });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to generate embeddings" });
      }
    } catch (error) {
      setStatusMsg({ type: "error", text: "Server connection failed!" });
    } finally {
      setIsGenerating(false);
      fetchLiveShlokas();
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this section?")) return;
    try {
      await fetch(`/api/shlokas/${id}`, { method: "DELETE" });
      setLiveShlokas(prev => prev.filter(s => s._id !== id));
    } catch (error) { 
      console.error("Delete failed", error); 
    }
  };

  const saveEdits = async (id: string) => {
    try {
      // 🔥 NEW LOGIC: Convert string (26, 27) back to array ["26", "27"] safely
      const finalShlokas = editFormData.containedShlokas_raw !== undefined
        ? editFormData.containedShlokas_raw.split(",").map((s: string) => s.trim()).filter(Boolean)
        : editFormData.containedShlokas;

      const updatedData = { 
        ...editFormData, 
        containedShlokas: finalShlokas, // Save as correct Array
        embedding: [] // Reset embedding on edit
      }; 
      delete updatedData.containedShlokas_raw; // Clean up temp field

      await fetch(`/api/shlokas/${id}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(updatedData)
      });
      setEditingId(null);
      fetchLiveShlokas();
    } catch (error) { 
      console.error("Update failed", error); 
    }
  };

  const handleBulkDelete = async (shlokasList: any[]) => {
    if(!confirm(`ATTENTION! Are you sure you want to permanently DELETE these ${shlokasList.length} sections?`)) return;
    await Promise.all(shlokasList.map(s => fetch(`/api/shlokas/${s._id}`, { method: "DELETE" })));
    fetchLiveShlokas();
  };

  const toggleExpand = (id: string) => {
    setExpandedShlokas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderShlokasList = (dataList: any[]) => {
    const sortedDataList = [...dataList].sort((a, b) => {
      const numA = parseInt(a.shlokaNumber?.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.shlokaNumber?.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

    const textCounts = new Map();
    const numCounts = new Map();
    sortedDataList.forEach(s => {
      textCounts.set(s.originalShloka, (textCounts.get(s.originalShloka) || 0) + 1);
      numCounts.set(s.shlokaNumber, (numCounts.get(s.shlokaNumber) || 0) + 1);
    });

    const grouped = sortedDataList.reduce((acc, shloka) => {
      const key = `${shloka.samhitaName} - ${shloka.sthana} (Chapter ${shloka.chapter})`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(shloka);
      return acc;
    }, {} as Record<string, any[]>);

    if (Object.keys(grouped).length === 0) {
      return <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No data available.</div>;
    }

  return Object.entries(grouped).map(([chapterName, shlokasList]) => (
      <div key={chapterName} className="border border-gray-800 bg-black/20 rounded-xl overflow-hidden mb-6 shadow-lg">
        <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" /> {chapterName}
            {/* 1. Type casting added here for .length */}
            <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full text-gray-300 ml-2">{(shlokasList as any[]).length} Items</span>
          </h3>
          {/* 2. Type casting added here for the delete function parameter */}
          <button onClick={() => handleBulkDelete(shlokasList as any[])} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs font-bold border border-red-500/30 flex items-center gap-1">
            <Trash className="w-3 h-3" /> Delete All
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 3. Type casting added here for the .map function */}
          {(shlokasList as any[]).map((shloka, index) => {
            const isDuplicate = textCounts.get(shloka.originalShloka) > 1 || numCounts.get(shloka.shlokaNumber) > 1;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={shloka._id} 
                className={`glass-panel p-8 border relative transition-colors ${isDuplicate ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/10" : "border-gray-800 hover:border-gray-700"}`}
              >
                
                {isDuplicate && (
                  <span className="absolute top-4 right-4 bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full font-bold border border-red-500/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> DUPLICATE
                  </span>
                )}
                
                {!shloka.embedding || shloka.embedding.length === 0 ? (
                    <span className="absolute top-4 left-4 bg-amber-500/20 text-amber-500 text-[10px] px-2 py-1 rounded font-bold border border-amber-500/50 flex items-center gap-1">
                        PENDING AI VECTOR
                    </span>
                ) : (
                    <span className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-500 text-[10px] px-2 py-1 rounded font-bold border border-emerald-500/50 flex items-center gap-1">
                        AI READY
                    </span>
                )}

                <h4 className={`text-sm tracking-widest uppercase font-black mb-6 mt-4 ${isDuplicate ? "text-red-400" : "text-blue-400"}`}>
                  Section {shloka.shlokaNumber}
                </h4>

                {editingId === shloka._id ? (
                  <div className="space-y-4 bg-black/60 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-sm font-bold text-blue-400 mb-4 border-b border-gray-700 pb-2">Edit Full Shloka Content</h3>
                    
                    {/* 🔥 NEW: 3 Columns Grid with RAG Search Numbers Input */}
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Display Shloka Number</label>
                        <input className="w-full bg-black/80 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors" value={editFormData.shlokaNumber || ""} onChange={(e) => setEditFormData({...editFormData, shlokaNumber: e.target.value})} placeholder="e.g. 5-6" />
                      </div>
                      <div>
                        <label className="text-xs text-blue-400 font-bold block mb-1">RAG Search Numbers</label>
                        <input className="w-full bg-black/80 border border-blue-900/50 rounded p-3 text-blue-100 text-sm outline-none focus:border-blue-500 transition-colors" value={editFormData.containedShlokas_raw ?? ""} onChange={(e) => setEditFormData({...editFormData, containedShlokas_raw: e.target.value})} placeholder="e.g. 5, 6" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Tantra Yukti</label>
                        <input className="w-full bg-black/80 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors" value={editFormData.tantraYukti || ""} onChange={(e) => setEditFormData({...editFormData, tantraYukti: e.target.value})} placeholder="Leave blank if none" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Main Shloka (मूल श्लोक)</label>
                        <textarea className="w-full bg-black/80 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors custom-scrollbar" value={editFormData.originalShloka || ""} onChange={(e) => setEditFormData({...editFormData, originalShloka: e.target.value})} rows={4} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Translation (हिंदी अनुवाद)</label>
                        <textarea className="w-full bg-black/80 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors custom-scrollbar" value={editFormData.translationHindi || ""} onChange={(e) => setEditFormData({...editFormData, translationHindi: e.target.value})} rows={4} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
                      <div>
                        <label className="text-xs text-teal-400 block mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/> संस्कृत टीका (Sanskrit Tika)</label>
                        <textarea className="w-full bg-teal-950/20 border border-teal-900/50 rounded p-3 text-teal-100 text-sm outline-none focus:border-teal-500 transition-colors custom-scrollbar" value={editFormData.tikaSanskrit || ""} onChange={(e) => setEditFormData({...editFormData, tikaSanskrit: e.target.value})} rows={4} placeholder="संस्कृत टीका यहाँ डालें..." />
                      </div>
                      <div>
                        <label className="text-xs text-teal-400 block mb-1">टीका का हिंदी अर्थ (Tika Translation)</label>
                        <textarea className="w-full bg-teal-950/20 border border-teal-900/50 rounded p-3 text-teal-100 text-sm outline-none focus:border-teal-500 transition-colors custom-scrollbar" value={editFormData.tikaHindi || ""} onChange={(e) => setEditFormData({...editFormData, tikaHindi: e.target.value})} rows={4} placeholder="टीका का हिंदी भावार्थ यहाँ डालें..." />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <label className="text-xs text-gray-400 block mb-1">विमर्श (Clinical Vimarsh)</label>
                      <textarea className="w-full bg-black/80 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-blue-500 transition-colors custom-scrollbar" value={editFormData.vimarsh || ""} onChange={(e) => setEditFormData({...editFormData, vimarsh: e.target.value})} rows={3} placeholder="विमर्श यहाँ डालें..." />
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                      <button onClick={() => saveEdits(shloka._id)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all">Save All Changes</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-6 py-2.5 rounded-lg text-sm font-bold transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl md:text-2xl font-semibold text-blue-50 mb-6 whitespace-pre-wrap leading-loose tracking-wide font-serif text-center md:text-left">
                      {shloka.originalShloka}
                    </p>

                    <div className="bg-black/40 rounded-xl p-5 mb-5 border border-gray-800/50 border-l-4 border-l-blue-500 shadow-inner">
                      <h4 className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-3">मूल श्लोक का अर्थ</h4>
                      <p className="text-base text-gray-200 whitespace-pre-wrap leading-relaxed font-medium">
                        {shloka.translationHindi}
                      </p>
                    </div>

                    <AnimatePresence>
                      {expandedShlokas[shloka._id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: "auto" }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 mb-6 overflow-hidden"
                        >
                          {shloka.tikaSanskrit && (
                            <div className="bg-teal-950/20 rounded-xl p-6 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.05)] mt-4">
                              <div className="flex items-center gap-2 mb-4 border-b border-teal-900/50 pb-3">
                                <Sparkles className="w-5 h-5 text-teal-400" />
                                <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest">संस्कृत टीका (चक्रपाणि / डल्हण)</h4>
                                {shloka.tantraYukti && (
                                  <span className="ml-auto bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-500/30 shadow-sm">
                                    तंत्र युक्ति: {shloka.tantraYukti}
                                  </span>
                                )}
                              </div>

                              <p className="text-lg text-teal-50 font-medium mb-5 whitespace-pre-wrap leading-loose font-serif">
                                {shloka.tikaSanskrit}
                              </p>

                              {shloka.tikaHindi && (
                                <div className="bg-black/60 p-4 rounded-lg border border-gray-800 border-l-2 border-l-teal-500">
                                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">टीका का हिंदी भावार्थ</h4>
                                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{shloka.tikaHindi}</p>
                                </div>
                              )}

                              {shloka.grammarNotes && shloka.grammarNotes.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-teal-900/50">
                                  <h4 className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mb-3">व्याकरण एवं संधि नियम</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {shloka.grammarNotes.map((note: string, i: number) => (
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                                        key={i} 
                                        className="bg-teal-900/40 border border-teal-700/50 text-teal-200 text-xs px-3 py-1.5 rounded-md font-medium"
                                      >
                                        {note}
                                      </motion.span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {shloka.vimarsh && (
                             <div className="bg-black/40 rounded-xl p-5 border border-gray-800">
                               <h4 className="text-xs text-gray-400 font-bold mb-2">विमर्श (Vimarsh)</h4>
                               <p className="text-sm text-gray-300 leading-relaxed">{shloka.vimarsh}</p>
                             </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button onClick={() => toggleExpand(shloka._id)} className="w-full py-3 bg-gray-900/40 hover:bg-gray-800/80 rounded-xl flex justify-center items-center gap-2 text-xs font-bold text-gray-400 mb-5 transition-colors border border-gray-800">
                      {expandedShlokas[shloka._id] ? <><ChevronUp className="w-4 h-4"/> Hide Details</> : <><ChevronDown className="w-4 h-4"/> Read Tika & Full Details</>}
                    </button>

                    <div className="flex flex-wrap gap-3">
                      {/* 🔥 NEW: Added initial mapping of array to string for edit form */}
                      <button onClick={() => { 
                        setEditingId(shloka._id); 
                        setEditFormData({
                          ...shloka,
                          containedShlokas_raw: shloka.containedShlokas?.join(", ") || ""
                        }); 
                      }} className="flex-1 bg-blue-900/30 text-blue-400 border border-blue-500/50 hover:bg-blue-900/50 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                        <Edit3 className="w-4 h-4" /> Edit Content
                      </button>
                      <button onClick={() => handleDelete(shloka._id)} className="px-5 bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50 py-2.5 rounded-xl flex items-center justify-center transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-black/40 p-6 rounded-2xl border border-gray-800 shadow-md">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h2 className="text-3xl font-black text-blue-400 mb-1">Live Database</h2>
          <p className="text-sm text-gray-400 font-medium">All approved sections (Live on the Student App).</p>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-3">
          <button 
            onClick={fetchLiveShlokas} 
            className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-bold border border-gray-700 hover:bg-gray-700 transition-colors shadow-sm"
          >
            Refresh Database
          </button>
          
          <button
            onClick={generateEmbeddings}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isGenerating
                ? "bg-purple-900/50 text-purple-300 border border-purple-800 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            }`}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {isGenerating ? "Training AI..." : "Generate AI Embeddings"}
          </button>
        </div>
      </div>

      {statusMsg.type && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-medium text-sm ${
            statusMsg.type === "success" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800" :
            statusMsg.type === "error" ? "bg-red-950/40 text-red-400 border border-red-800" :
            "bg-blue-950/40 text-blue-400 border border-blue-800"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {statusMsg.text}
        </motion.div>
      )}

      {isLoading ? <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /></div> : renderShlokasList(liveShlokas)}
    </motion.div>
  );
}