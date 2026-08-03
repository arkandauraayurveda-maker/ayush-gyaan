"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Database, CheckCheck, Trash, AlertTriangle, CheckCircle, Edit3, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function PendingReviewTab() {
  const [pendingShlokas, setPendingShlokas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [expandedShlokas, setExpandedShlokas] = useState<Record<string, boolean>>({});
  const [repromptingId, setRepromptingId] = useState<string | null>(null);
  const [repromptInstruction, setRepromptInstruction] = useState("");
  const [isReprompting, setIsReprompting] = useState(false);

  useEffect(() => {
    fetchPendingShlokas();
  }, []);

  const fetchPendingShlokas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shlokas/pending");
      const json = await res.json();
      if (json.success) setPendingShlokas(json.data);
    } catch (error) { console.error("Failed to fetch pending reviews", error); }
    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/shlokas/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" })
      });
      setPendingShlokas(prev => prev.filter(s => s._id !== id));
      alert("Section approved and moved to the Live Database!");
    } catch (error) { console.error("Approve failed", error); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this section?")) return;
    try {
      await fetch(`/api/shlokas/${id}`, { method: "DELETE" });
      setPendingShlokas(prev => prev.filter(s => s._id !== id));
    } catch (error) { console.error("Delete failed", error); }
  };

  const saveEdits = async (id: string) => {
    try {
      // 🔥 NEW LOGIC: Convert string (26, 27) back to array ["26", "27"] safely
      const finalShlokas = editFormData.containedShlokas_raw !== undefined
        ? editFormData.containedShlokas_raw.split(",").map((s: string) => s.trim()).filter(Boolean)
        : editFormData.containedShlokas;

      const updatedData = { ...editFormData, containedShlokas: finalShlokas };
      delete updatedData.containedShlokas_raw;

      await fetch(`/api/shlokas/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedData)
      });
      setEditingId(null);
      fetchPendingShlokas();
    } catch (error) { console.error("Update failed", error); }
  };

  const handleBulkApprove = async (shlokasList: any[]) => {
    if(!confirm(`Are you sure you want to approve these ${shlokasList.length} sections at once?`)) return;
    await Promise.all(shlokasList.map(s => 
      fetch(`/api/shlokas/${s._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) })
    ));
    fetchPendingShlokas();
  };

  const handleBulkDelete = async (shlokasList: any[]) => {
    if(!confirm(`ATTENTION! Are you sure you want to permanently DELETE these ${shlokasList.length} sections?`)) return;
    await Promise.all(shlokasList.map(s => fetch(`/api/shlokas/${s._id}`, { method: "DELETE" })));
    fetchPendingShlokas();
  };

  const handleReprompt = async (shlokaId: string) => {
    if (!repromptInstruction.trim()) return alert("Please provide an instruction for the AI.");
    setIsReprompting(true);
    try {
      const response = await fetch(`/api/shlokas/${shlokaId}/reprompt`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instruction: repromptInstruction })
      });
      const result = await response.json();
      if (result.success) {
        alert("AI has successfully updated the section!");
        setRepromptingId(null);
        setRepromptInstruction("");
        fetchPendingShlokas();
      }
    } catch (error) { console.error("Reprompt failed", error); }
    setIsReprompting(false);
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
            <Database className="w-5 h-5 text-accent" /> {chapterName}
            /* 🔥 FIX 1: Added Type Casting for length */
            <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full text-gray-300 ml-2">{(shlokasList as any[]).length} Items</span>
          </h3>
          <div className="flex gap-2">
            /* 🔥 FIX 2: Added Type Casting for handleBulkApprove */
            <button onClick={() => handleBulkApprove(shlokasList as any[])} className="px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded text-xs font-bold border border-green-500/30 flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Approve All
            </button>
            
            <button onClick={() => handleBulkDelete(shlokasList as any[])} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs font-bold border border-red-500/30 flex items-center gap-1">
              <Trash className="w-3 h-3" /> Delete All
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
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
              
                
                {!isDuplicate && <span className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 text-xs px-3 py-1 rounded-full font-bold">PENDING</span>}
                
                {isDuplicate && (
                  <span className="absolute top-4 right-4 bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full font-bold border border-red-500/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> DUPLICATE DRAFT
                  </span>
                )}

                <h4 className={`text-sm tracking-widest uppercase font-black mb-6 ${isDuplicate ? "text-red-400" : "text-emerald-500"}`}>
                  Section {shloka.shlokaNumber}
                </h4>

                {editingId === shloka._id ? (
                  <div className="space-y-4 bg-black/40 p-5 rounded-xl border border-gray-800">
                    {/* 🔥 NEW: 3 Columns Grid with RAG Search Numbers Input */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Display Shloka Number</label>
                        <input className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors" value={editFormData.shlokaNumber || ""} onChange={(e) => setEditFormData({...editFormData, shlokaNumber: e.target.value})} placeholder="e.g. 5-6" />
                      </div>
                      <div>
                        <label className="text-xs text-emerald-400 font-bold block mb-1">RAG Search Numbers</label>
                        <input className="w-full bg-black/50 border border-emerald-900/50 rounded p-3 text-emerald-100 text-sm outline-none focus:border-emerald-500 transition-colors" value={editFormData.containedShlokas_raw ?? ""} onChange={(e) => setEditFormData({...editFormData, containedShlokas_raw: e.target.value})} placeholder="e.g. 5, 6" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Tantra Yukti</label>
                        <input className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors" value={editFormData.tantraYukti || ""} onChange={(e) => setEditFormData({...editFormData, tantraYukti: e.target.value})} placeholder="Leave blank if none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Main Shloka</label>
                      <textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors custom-scrollbar" value={editFormData.originalShloka || ""} onChange={(e) => setEditFormData({...editFormData, originalShloka: e.target.value})} rows={3} />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Translation (Hindi)</label>
                      <textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors custom-scrollbar" value={editFormData.translationHindi || ""} onChange={(e) => setEditFormData({...editFormData, translationHindi: e.target.value})} rows={3} />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Vimarsh (Commentary/Analysis)</label>
                      <textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors custom-scrollbar" value={editFormData.vimarsh || ""} onChange={(e) => setEditFormData({...editFormData, vimarsh: e.target.value})} rows={3} placeholder="Leave blank if none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Tika (Sanskrit)</label>
                        <textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-teal-500 transition-colors custom-scrollbar" value={editFormData.tikaSanskrit || ""} onChange={(e) => setEditFormData({...editFormData, tikaSanskrit: e.target.value})} rows={4} placeholder="Sanskrit Commentary..." />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Tika (Hindi Meaning)</label>
                        <textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-teal-500 transition-colors custom-scrollbar" value={editFormData.tikaHindi || ""} onChange={(e) => setEditFormData({...editFormData, tikaHindi: e.target.value})} rows={4} placeholder="Hindi Translation of Tika..." />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-5 pt-4 border-t border-gray-800">
                      <button onClick={() => saveEdits(shloka._id)} className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-transform hover:scale-[1.02]">Save All Changes</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl md:text-2xl font-semibold text-emerald-50 mb-6 whitespace-pre-wrap leading-loose tracking-wide font-serif text-center md:text-left">
                      {shloka.originalShloka}
                    </p>

                    <div className="bg-black/40 rounded-xl p-5 mb-5 border border-gray-800/50 border-l-4 border-l-emerald-500 shadow-inner">
                      <h4 className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-3">मूल श्लोक का अर्थ</h4>
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
                      {/* 🔥 NEW: Map containedShlokas to string for the input box when Edit is clicked */}
                      <button onClick={() => { 
                        setEditingId(shloka._id); 
                        setEditFormData({
                          ...shloka,
                          containedShlokas_raw: shloka.containedShlokas?.join(", ") || ""
                        }); 
                      }} className="flex-1 bg-blue-900/30 text-blue-400 border border-blue-500/50 hover:bg-blue-900/50 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                        <Edit3 className="w-4 h-4" /> Edit All Details
                      </button>
                      <button onClick={() => handleDelete(shloka._id)} className="px-4 bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50 py-2.5 rounded-xl flex items-center justify-center transition-all">
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
      <div className="flex justify-between items-center mb-8 bg-black/40 p-6 rounded-2xl border border-gray-800 shadow-md">
        <div>
          <h2 className="text-3xl font-black text-white mb-1">Pending Reviews</h2>
          <p className="text-sm text-gray-400 font-medium">Review AI extracted drafts (Mool Shloka + Tika) before pushing them live.</p>
        </div>
        <button onClick={fetchPendingShlokas} className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors shadow-sm">Refresh Drafts</button>
      </div>
      {isLoading ? <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div> : renderShlokasList(pendingShlokas)}
    </motion.div>
  );
}