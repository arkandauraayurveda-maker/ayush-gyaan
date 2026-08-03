"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Pencil, Save, Eye, EyeOff, Trash2, Calendar, Ticket, Loader2, X, Bot, Sparkles, CheckSquare } from "lucide-react";

// 🧠 1. MASTER SAMHITA DATABASE (No more manual typing!)
const SAMHITA_DATA: Record<string, Record<string, number>> = {
  "Charak Samhita": {
    "Sutra Sthana": 30,
    "Nidan Sthana": 8,
    "Viman Sthana": 8,
    "Sharir Sthana": 8,
    "Indriya Sthana": 12,
    "Chikitsa Sthana": 30,
    "Kalpa Sthana": 12,
    "Siddhi Sthana": 12
  },
  "Sushruta Samhita": {
    "Sutra Sthana": 46,
    "Nidan Sthana": 16,
    "Sharir Sthana": 10,
    "Chikitsa Sthana": 40,
    "Kalpa Sthana": 8,
    "Uttara Tantra": 66
  },
  "Ashtanga Hridaya": {
    "Sutra Sthana": 30,
    "Sharir Sthana": 6,
    "Nidan Sthana": 16,
    "Chikitsa Sthana": 22,
    "Kalpa Sthana": 6,
    "Uttara Sthana": 40
  }
};

export default function CourseManagerTab() {
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  const [courseFormData, setCourseFormData] = useState({
    courseId: "", title: "", prof: "", status: "Available Now", 
    price: "", originalPrice: "", discountText: "", badge: "",
    priceBasic: "", pricePlus: "", pricePro: "",
    startDate: "", couponCode: "", duration: "1-Year Access", syllabus: "", highlight: false, isActive: true,
    isSamhitaCourse: false,
    allowedChapters: [] as { sthana: string; chapters: string }[], 
    aiSettings: { isAiEnabled: false, allowedSamhitas: [] as string[], allowedChapters: [] as string[] }
  });

  // 🎛️ SMART CASCADING STATES
  const [selectedSamhita, setSelectedSamhita] = useState("");
  const [selectedSthana, setSelectedSthana] = useState("");
  const [selectedChaptersArray, setSelectedChaptersArray] = useState<number[]>([]);
  
  // AI Settings states
  const [aiSelectedSamhita, setAiSelectedSamhita] = useState("");

  useEffect(() => {
    fetchCoursesList();
  }, []);

  const fetchCoursesList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) setCoursesList(data.courses);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCourseId ? "PUT" : "POST";
    const payload = {
      ...courseFormData,
      _id: editingCourseId,
      syllabus: courseFormData.syllabus.split(",").map(s => s.trim()) 
    };

    try {
      const res = await fetch("/api/courses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert(`Course ${editingCourseId ? "Updated" : "Created"} Successfully!`);
        setIsCourseModalOpen(false);
        fetchCoursesList();
      }
    } catch (error) { console.error(error); }
  };

  const handleCourseEdit = (course: any) => {
    setCourseFormData({
      ...course,
      syllabus: course.syllabus ? course.syllabus.join(", ") : "",
      isSamhitaCourse: course.isSamhitaCourse || false,
      allowedChapters: course.allowedChapters || [],
      priceBasic: course.priceBasic || "", pricePlus: course.pricePlus || "", pricePro: course.pricePro || "",
      aiSettings: course.aiSettings || { isAiEnabled: false, allowedSamhitas: [], allowedChapters: [] }
    });
    setEditingCourseId(course._id);
    setIsCourseModalOpen(true);
  };

  const handleCourseDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this course completely?")) {
      await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
      fetchCoursesList();
    }
  };

  // 📖 2. SMART MAPPING LOGIC
  const toggleChapterSelection = (ch: number) => {
    if (selectedChaptersArray.includes(ch)) {
      setSelectedChaptersArray(selectedChaptersArray.filter(c => c !== ch));
    } else {
      setSelectedChaptersArray([...selectedChaptersArray, ch].sort((a, b) => a - b));
    }
  };

  const selectAllChapters = (total: number) => {
    setSelectedChaptersArray(Array.from({ length: total }, (_, i) => i + 1));
  };

  const addSmartSthanaMapping = () => {
    if (!selectedSamhita || !selectedSthana || selectedChaptersArray.length === 0) return;
    
    // Convert array [1,2,3] to string "1, 2, 3"
    const chaptersStr = selectedChaptersArray.join(", ");
    const fullSthanaName = `${selectedSamhita} - ${selectedSthana}`;

    setCourseFormData(prev => ({ 
      ...prev, 
      allowedChapters: [...prev.allowedChapters, { sthana: fullSthanaName, chapters: chaptersStr }] 
    }));
    
    // Reset selections after adding
    setSelectedSthana("");
    setSelectedChaptersArray([]);
  };

  const removeSthanaMapping = (index: number) => {
    setCourseFormData(prev => ({ ...prev, allowedChapters: prev.allowedChapters.filter((_, i) => i !== index) }));
  };

  // 🤖 SMART AI MAPPING LOGIC
  const addAiSamhita = () => {
    if (!aiSelectedSamhita) return;
    setCourseFormData(prev => ({ ...prev, aiSettings: { ...prev.aiSettings, allowedSamhitas: [...prev.aiSettings.allowedSamhitas, aiSelectedSamhita] } }));
    setAiSelectedSamhita("");
  };
  const removeAiSamhita = (index: number) => {
    setCourseFormData(prev => ({ ...prev, aiSettings: { ...prev.aiSettings, allowedSamhitas: prev.aiSettings.allowedSamhitas.filter((_, i) => i !== index) } }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* HEADER & COURSE LIST REMAIN UNCHANGED (Kept for brevity, fully retained in real file) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-400">Manage Website Courses</h2>
          <p className="text-sm text-gray-400">Create or edit the academic modules visible on the homepage.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCourseId(null);
            setCourseFormData({ 
              courseId: "", title: "", prof: "", status: "Available Now", price: "", originalPrice: "", discountText: "", badge: "", startDate: "", couponCode: "", duration: "1-Year Access", syllabus: "", highlight: false, isActive: true, isSamhitaCourse: false, allowedChapters: [], 
              priceBasic: "", pricePlus: "", pricePro: "", 
              aiSettings: { isAiEnabled: false, allowedSamhitas: [], allowedChapters: [] } 
            });
            setIsCourseModalOpen(true);
          }} 
          className="px-4 py-2 bg-amber-900/30 text-amber-400 rounded-lg text-sm font-bold border border-amber-500/30 hover:bg-amber-900/50 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Course
        </button>
      </div>

      {isLoading && coursesList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : coursesList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No courses currently exist in the database.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesList.map((course) => (
            <div key={course._id} className={`glass-panel p-6 border relative flex flex-col ${course.isActive ? 'border-amber-500/20' : 'border-red-500/30 bg-red-950/10'}`}>
              {course.badge && <span className="absolute -top-3 left-6 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{course.badge}</span>}
              {course.aiSettings?.isAiEnabled && (
                <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 font-bold">
                  <Bot className="w-3 h-3"/> AI ENABLED
                </span>
              )}
              <div className="flex justify-between items-start mb-2 mt-2">
                <h3 className="font-bold text-lg text-white">{course.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleCourseEdit(course)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleCourseDelete(course._id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{course.prof} | {course.courseId}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black text-amber-400">{course.price}</span>
              </div>
              
              {(course.priceBasic || course.pricePlus || course.pricePro) && (
                <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4 text-[10px] font-bold">
                  {course.priceBasic && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Basic: {course.priceBasic}</span>}
                  {course.pricePlus && <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Plus: {course.pricePlus}</span>}
                  {course.pricePro && <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">Pro: {course.pricePro}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= COURSE CREATION MODAL ================= */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-amber-500/30 rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-amber-400">{editingCourseId ? "Edit Course Data" : "Create New Course"}</h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-6">
              {/* BASIC DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Course ID (Unique)</label>
                  <input required value={courseFormData.courseId} onChange={e => setCourseFormData({...courseFormData, courseId: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. sa1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Course Title</label>
                  <input required value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. Samhita Adhyayan I" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Prof / Category</label>
                  <input required value={courseFormData.prof} onChange={e => setCourseFormData({...courseFormData, prof: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. BAMS 1st Professional" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Action Status</label>
                  <input required value={courseFormData.status} onChange={e => setCourseFormData({...courseFormData, status: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. Available Now" />
                </div>
              </div>

              {/* PRICING & AI TIERS SECTION */}
              <div className="bg-black/30 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4"/> Pricing & AI Subscription Tiers
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold mb-1 block uppercase">Course Only Price</label>
                    <input required value={courseFormData.price} onChange={e => setCourseFormData({...courseFormData, price: e.target.value})} className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. ₹999" />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold mb-1 block uppercase">Price with AI Basic</label>
                    <input value={courseFormData.priceBasic} onChange={e => setCourseFormData({...courseFormData, priceBasic: e.target.value})} className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. ₹1199" />
                  </div>
                  <div>
                    <label className="text-[10px] text-blue-400 font-bold mb-1 block uppercase">Price with AI Plus</label>
                    <input value={courseFormData.pricePlus} onChange={e => setCourseFormData({...courseFormData, pricePlus: e.target.value})} className="w-full bg-blue-950/20 border border-blue-500/30 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500" placeholder="e.g. ₹1499" />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400 font-bold mb-1 block uppercase">Price with AI Pro</label>
                    <input value={courseFormData.pricePro} onChange={e => setCourseFormData({...courseFormData, pricePro: e.target.value})} className="w-full bg-purple-950/20 border border-purple-500/30 rounded-lg p-3 text-sm text-white outline-none focus:border-purple-500" placeholder="e.g. ₹1999" />
                  </div>
                </div>
              </div>

              {/* 📖 3. NEW SMART SAMHITA TOGGLE & MAPPING SECTION */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={courseFormData.isSamhitaCourse} 
                    onChange={e => setCourseFormData({...courseFormData, isSamhitaCourse: e.target.checked})} 
                    className="accent-emerald-500 w-5 h-5" 
                  />
                  <span className="text-emerald-400 font-bold text-sm">Enable Smart Samhita Reader (No Manual Typing)</span>
                </label>

                {courseFormData.isSamhitaCourse && (
                  <div className="space-y-4 pt-3 border-t border-emerald-500/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step 1: Select Samhita */}
                      <select 
                        value={selectedSamhita} 
                        onChange={e => { setSelectedSamhita(e.target.value); setSelectedSthana(""); setSelectedChaptersArray([]); }}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                      >
                        <option value="">1. Select Samhita...</option>
                        {Object.keys(SAMHITA_DATA).map(samhita => <option key={samhita} value={samhita}>{samhita}</option>)}
                      </select>

                      {/* Step 2: Select Sthana (Auto-populated) */}
                      <select 
                        value={selectedSthana} 
                        onChange={e => { setSelectedSthana(e.target.value); setSelectedChaptersArray([]); }}
                        disabled={!selectedSamhita}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="">2. Select Sthana...</option>
                        {selectedSamhita && Object.keys(SAMHITA_DATA[selectedSamhita]).map(sthana => (
                          <option key={sthana} value={sthana}>{sthana}</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Smart Chapter Checkboxes */}
                    {selectedSthana && (
                      <div className="bg-black/40 p-4 rounded-xl border border-emerald-900/50">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs text-emerald-400 font-bold uppercase tracking-widest">3. Select Chapters to include</label>
                          <button type="button" onClick={() => selectAllChapters(SAMHITA_DATA[selectedSamhita][selectedSthana])} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">Select All</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: SAMHITA_DATA[selectedSamhita][selectedSthana] }, (_, i) => i + 1).map(ch => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => toggleChapterSelection(ch)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${selectedChaptersArray.includes(ch) ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black border-gray-700 text-gray-400 hover:border-emerald-500'}`}
                            >
                              {ch}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button type="button" onClick={addSmartSthanaMapping} disabled={selectedChaptersArray.length === 0} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2">
                            <CheckSquare className="w-4 h-4"/> Add Selected Chapters
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Display Added Mappings */}
                    <div className="space-y-2 mt-4">
                      {courseFormData.allowedChapters.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 text-sm">
                          <span><strong className="text-emerald-400">{item.sthana}</strong> <br/><span className="text-xs text-gray-400">Chapters Included: [{item.chapters}]</span></span>
                          <button type="button" onClick={() => removeSthanaMapping(index)} className="text-red-400 hover:text-red-300 bg-red-500/10 p-2 rounded-lg font-bold text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 🤖 SMART AI CHAT SETTINGS SECTION */}
              <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={courseFormData.aiSettings.isAiEnabled} onChange={e => setCourseFormData({...courseFormData, aiSettings: { ...courseFormData.aiSettings, isAiEnabled: e.target.checked }})} className="accent-blue-500 w-5 h-5" />
                  <span className="text-blue-400 font-bold text-sm flex items-center gap-2"><Bot className="w-4 h-4"/> Enable AI Access for this Course?</span>
                </label>

                {courseFormData.aiSettings.isAiEnabled && (
                  <div className="space-y-4 pt-3 border-t border-blue-500/20">
                    <p className="text-xs text-gray-400">Select which Samhitas the AI is allowed to reference for this course context:</p>
                    <div className="flex gap-2">
                      {/* Smart Dropdown for AI Samhita */}
                      <select 
                        value={aiSelectedSamhita} onChange={e => setAiSelectedSamhita(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      >
                        <option value="">Select Samhita for AI...</option>
                        {Object.keys(SAMHITA_DATA).map(samhita => <option key={samhita} value={samhita}>{samhita}</option>)}
                      </select>
                      <button type="button" onClick={addAiSamhita} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs">Allow Samhita</button>
                    </div>
                    {/* Display allowed Samhitas */}
                    {courseFormData.aiSettings.allowedSamhitas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {courseFormData.aiSettings.allowedSamhitas.map((samhita, idx) => (
                          <span key={idx} className="bg-blue-900/50 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2">
                            {samhita} <button type="button" onClick={() => removeAiSamhita(idx)} className="text-red-400 hover:text-red-300">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SAVE BUTTON */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Syllabus Details (Comma Separated)</label>
                <textarea required value={courseFormData.syllabus} onChange={e => setCourseFormData({...courseFormData, syllabus: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-sm text-white outline-none focus:border-amber-500 h-28 resize-none" placeholder="Charak Sutrasthana (Ch 1-12)..."></textarea>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-2 bg-black/30 p-4 rounded-xl border border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={courseFormData.highlight} onChange={e => setCourseFormData({...courseFormData, highlight: e.target.checked})} className="accent-amber-500 w-5 h-5" />
                  <span className="text-amber-400">Highlight as Recommended?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={courseFormData.isActive} onChange={e => setCourseFormData({...courseFormData, isActive: e.target.checked})} className="accent-emerald-500 w-5 h-5" />
                  <span className="text-emerald-400">Make Course Live on Website?</span>
                </label>
              </div>

              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                <Save className="w-5 h-5"/> {editingCourseId ? "Update Course Data" : "Publish New Course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}