"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Pencil, Save, Trash2, Loader2, X, GraduationCap, LayoutList } from "lucide-react";

type ModalMode = "BULK_UNI" | "BULK_COLLEGE" | "EDIT" | null;

export default function InstitutionManagerTab() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [selectedUniId, setSelectedUniId] = useState("");
  
  // For standard Edit mode
  const [editFormData, setEditFormData] = useState({ university: "", colleges: "" });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/institutions");
      const data = await res.json();
      if (data.success) setInstitutions(data.data);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  // 🚀 SMART SUBMIT LOGIC
  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (modalMode === "BULK_UNI") {
        // 1. Split by comma, trim spaces, remove empties
        const uniArray = bulkInput.split(",").map(u => u.trim()).filter(Boolean);
        // 2. Remove duplicates & Sort Alphabetically (A to Z)
        const uniqueSortedUnis = [...new Set(uniArray)].sort((a, b) => a.localeCompare(b));
        
        // 3. Prepare payload for API
        const payload = uniqueSortedUnis.map(u => ({ university: u, colleges: [] }));

        await fetch("/api/institutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        alert("Universities added and sorted successfully!");

      } else if (modalMode === "BULK_COLLEGE") {
        if (!selectedUniId) return alert("Please select a university first.");
        
        const targetUni = institutions.find(i => i._id === selectedUniId);
        const existingColleges = targetUni?.colleges || [];
        
        // 1. Process new colleges (Split, Trim)
        const newColleges = bulkInput.split(",").map(c => c.trim()).filter(Boolean);
        
        // 2. Merge Old + New, Remove Duplicates, Sort A to Z
        const mergedColleges = [...new Set([...existingColleges, ...newColleges])].sort((a, b) => a.localeCompare(b));

        await fetch("/api/institutions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: selectedUniId, colleges: mergedColleges })
        });
        alert("Colleges added and merged alphabetically!");

      } else if (modalMode === "EDIT") {
        const colsArray = editFormData.colleges.split(",").map(c => c.trim()).filter(Boolean);
        const sortedCols = [...new Set(colsArray)].sort((a, b) => a.localeCompare(b));

        await fetch("/api/institutions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editingId, university: editFormData.university, colleges: sortedCols })
        });
        alert("Institution updated!");
      }

      setModalMode(null);
      setBulkInput("");
      fetchInstitutions();
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
    setIsLoading(false);
  };

  const handleEdit = (inst: any) => {
    setEditFormData({
      university: inst.university,
      colleges: inst.colleges.join(", ")
    });
    setEditingId(inst._id);
    setModalMode("EDIT");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this university and all its colleges?")) {
      await fetch(`/api/institutions?id=${id}`, { method: "DELETE" });
      fetchInstitutions();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">Manage Institutions</h2>
          <p className="text-sm text-gray-400">Add Universities and their affiliated colleges securely.</p>
        </div>
        
        {/* 🔥 TWO SMART BUTTONS 🔥 */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { setBulkInput(""); setModalMode("BULK_UNI"); }} 
            className="px-4 py-2 bg-blue-900/30 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/30 hover:bg-blue-900/50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Universities
          </button>
          
          <button 
            onClick={() => { setBulkInput(""); setSelectedUniId(""); setModalMode("BULK_COLLEGE"); }} 
            disabled={institutions.length === 0}
            className="px-4 py-2 bg-emerald-900/30 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <LayoutList className="w-4 h-4" /> Add Colleges
          </button>
        </div>
      </div>

      {isLoading && institutions.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : institutions.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No institutions found. Click 'Add Universities' to start.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {institutions.map((inst) => (
            <div key={inst._id} className="glass-panel p-6 border border-gray-800 relative flex flex-col">
              <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                <h3 className="font-bold text-lg text-white flex items-start gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /> 
                  {inst.university}
                </h3>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(inst)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(inst._id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Building2 className="w-4 h-4" /> Affiliated Colleges ({inst.colleges.length})
              </div>
              
              {/* Colleges are already sorted alphabetically by backend/frontend processing */}
              <div className="flex flex-wrap gap-2">
                {inst.colleges.map((col: string, idx: number) => (
                  <span key={idx} className="bg-black/50 border border-gray-700 text-xs px-2.5 py-1.5 rounded-lg text-gray-300">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= SMART MODALS ================= */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel border border-blue-500/30 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <h3 className="text-2xl font-black text-blue-400">
                  {modalMode === "BULK_UNI" ? "Add Multiple Universities" : modalMode === "BULK_COLLEGE" ? "Add Colleges to University" : "Edit Institution"}
                </h3>
                <button onClick={() => setModalMode(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
              </div>

              <form onSubmit={handleSmartSubmit} className="space-y-5">
                
                {/* 🟢 MODE 1: BULK UNIVERSITIES */}
                {modalMode === "BULK_UNI" && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">University Names (Comma Separated)</label>
                    <textarea required autoFocus value={bulkInput} onChange={e => setBulkInput(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 h-40 resize-none" placeholder="University 1, University 2, University 3..."></textarea>
                    <p className="text-[10px] text-gray-500 mt-2">Duplicates will be removed & list will be sorted alphabetically (A-Z) automatically.</p>
                  </div>
                )}

                {/* 🟡 MODE 2: BULK COLLEGES */}
                {modalMode === "BULK_COLLEGE" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Select Target University</label>
                      <select required value={selectedUniId} onChange={e => setSelectedUniId(e.target.value)} className="w-full bg-black/80 border border-gray-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option value="">-- Choose a University --</option>
                        {institutions.map(inst => (
                          <option key={inst._id} value={inst._id}>{inst.university}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">College Names (Comma Separated)</label>
                      <textarea required value={bulkInput} onChange={e => setBulkInput(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 h-32 resize-none" placeholder="College A, College B, College C..."></textarea>
                      <p className="text-[10px] text-gray-500 mt-2">Will be merged with existing colleges and sorted A-Z automatically.</p>
                    </div>
                  </>
                )}

                {/* 🟠 MODE 3: EDIT EXISTING */}
                {modalMode === "EDIT" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">University Name</label>
                      <input required value={editFormData.university} onChange={e => setEditFormData({...editFormData, university: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">All Affiliated Colleges (Comma Separated)</label>
                      <textarea required value={editFormData.colleges} onChange={e => setEditFormData({...editFormData, colleges: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 h-32 resize-none"></textarea>
                    </div>
                  </>
                )}

                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} 
                  {modalMode === "BULK_UNI" ? "Save Universities" : modalMode === "BULK_COLLEGE" ? "Merge & Save Colleges" : "Update Data"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}