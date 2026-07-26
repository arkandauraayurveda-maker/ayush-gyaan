"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Database, Trash, AlertTriangle, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function LiveDatabaseTab() {
  const [liveShlokas, setLiveShlokas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [expandedShlokas, setExpandedShlokas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLiveShlokas();
  }, []);

  const fetchLiveShlokas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shlokas/approved");
      const json = await res.json();
      if (json.success) setLiveShlokas(json.data);
    } catch (error) { console.error("Failed to fetch live database", error); }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this section?")) return;
    try {
      await fetch(`/api/shlokas/${id}`, { method: "DELETE" });
      setLiveShlokas(prev => prev.filter(s => s._id !== id));
    } catch (error) { console.error("Delete failed", error); }
  };

  const saveEdits = async (id: string) => {
    try {
      await fetch(`/api/shlokas/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editFormData)
      });
      setEditingId(null);
      fetchLiveShlokas();
    } catch (error) { console.error("Update failed", error); }
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
      const numA = parseInt(a.shlokaNumber.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.shlokaNumber.match(/\d+/)?.[0] || "0");
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
      <div key={chapterName} className="border border-gray-800 bg-black/20 rounded-xl overflow-hidden mb-6">
        <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" /> {chapterName}
            <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full text-gray-300 ml-2">{shlokasList.length} Items</span>
          </h3>
          <button onClick={() => handleBulkDelete(shlokasList)} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs font-bold border border-red-500/30 flex items-center gap-1">
            <Trash className="w-3 h-3" /> Delete All
          </button>
        </div>

        <div className="p-4 space-y-6">
          {shlokasList.map((shloka) => {
            const isDuplicate = textCounts.get(shloka.originalShloka) > 1 || numCounts.get(shloka.shlokaNumber) > 1;

            return (
              <div key={shloka._id} className={`glass-panel p-6 border relative transition-colors ${isDuplicate ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/10" : "border-gray-800"}`}>
                
                {isDuplicate && (
                  <span className="absolute top-4 right-4 bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full font-bold border border-red-500/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> DUPLICATE
                  </span>
                )}

                <h4 className={`text-md font-bold mb-4 ${isDuplicate ? "text-red-400" : "text-accent"}`}>
                  Section: {shloka.shlokaNumber}
                </h4>

                {editingId === shloka._id ? (
                  <div className="space-y-4">
                    <div><label className="text-xs text-gray-400 block mb-1">Main Shloka</label><textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-primary" value={editFormData.originalShloka} onChange={(e) => setEditFormData({...editFormData, originalShloka: e.target.value})} rows={3} /></div>
                    <div><label className="text-xs text-primary font-bold block mb-1">Easy to Read Shloka</label><textarea className="w-full bg-primary/10 border border-primary/50 rounded p-3 text-white text-sm outline-none focus:border-primary" value={editFormData.easyToReadShloka || ""} onChange={(e) => setEditFormData({...editFormData, easyToReadShloka: e.target.value})} rows={2} /></div>
                    <div><label className="text-xs text-gray-400 block mb-1">Anvaya</label><textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-primary" value={editFormData.anvaya} onChange={(e) => setEditFormData({...editFormData, anvaya: e.target.value})} rows={2} /></div>
                    <div><label className="text-xs text-gray-400 block mb-1">Translation (Hindi)</label><textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-primary" value={editFormData.translationHindi} onChange={(e) => setEditFormData({...editFormData, translationHindi: e.target.value})} rows={3} /></div>
                    <div><label className="text-xs text-gray-400 block mb-1">Commentary (Vimarsh)</label><textarea className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm outline-none focus:border-primary" value={editFormData.vimarsh} onChange={(e) => setEditFormData({...editFormData, vimarsh: e.target.value})} rows={5} /></div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => saveEdits(shloka._id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">Save Changes</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-white mb-4 whitespace-pre-wrap">{shloka.originalShloka}</p>
                    <div className="bg-black/40 rounded p-4 mb-3 border border-gray-800">
                      <h4 className="text-xs text-gray-400 font-bold mb-1">Translation (Hindi)</h4>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{shloka.translationHindi}</p>
                    </div>
                    {expandedShlokas[shloka._id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 mb-4">
                        {shloka.easyToReadShloka && (
                          <div className="bg-primary/5 rounded p-4 border border-primary/20">
                            <h4 className="text-xs text-primary font-bold mb-1">Easy to Read Shloka</h4>
                            <p className="text-sm text-primary font-medium">{shloka.easyToReadShloka}</p>
                          </div>
                        )}
                        <div className="bg-black/40 rounded p-4 border border-gray-800">
                          <h4 className="text-xs text-gray-400 font-bold mb-1">Anvaya</h4>
                          <p className="text-sm text-gray-200">{shloka.anvaya || "N/A"}</p>
                        </div>
                        <div className="bg-black/40 rounded p-4 border border-gray-800">
                          <h4 className="text-xs text-gray-400 font-bold mb-2">Word Meanings</h4>
                          <div className="flex flex-wrap gap-2">
                            {shloka.words?.map((w:any, i:number) => (
                              <span key={i} className="bg-gray-900 border border-gray-700 text-xs px-2 py-1 rounded">
                                <span className="text-primary font-bold">{w.text}</span>: {w.meaningHindi}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-black/40 rounded p-4 border border-gray-800">
                          <h4 className="text-xs text-gray-400 font-bold mb-1">Full Commentary (Vimarsh)</h4>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">{shloka.vimarsh}</p>
                        </div>
                      </motion.div>
                    )}
                    <button onClick={() => toggleExpand(shloka._id)} className="w-full py-2 bg-gray-900/50 hover:bg-gray-800 rounded flex justify-center items-center gap-2 text-xs text-gray-400 mb-4 transition-colors">
                      {expandedShlokas[shloka._id] ? <><ChevronUp className="w-4 h-4"/> Hide Details</> : <><ChevronDown className="w-4 h-4"/> Show Full Details</>}
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setEditingId(shloka._id); setEditFormData(shloka); }} className="flex-1 bg-blue-900/30 text-blue-400 border border-blue-500/50 hover:bg-blue-900/50 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium">
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(shloka._id)} className="bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50 px-4 py-2 rounded flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-400">Live Database</h2>
          <p className="text-sm text-gray-400">All approved sections (Live on the Student App).</p>
        </div>
        <button onClick={fetchLiveShlokas} className="px-4 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm border border-green-500/30 hover:bg-green-900/50 transition-colors">Refresh List</button>
      </div>
      {isLoading ? <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-green-400 animate-spin" /></div> : renderShlokasList(liveShlokas)}
    </motion.div>
  );
}