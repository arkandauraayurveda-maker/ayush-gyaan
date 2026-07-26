"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, LayoutList, Languages, FileText, Menu, X, ChevronRight,
  Sparkles, ListTree, ChevronDown, Settings2
} from "lucide-react";

export default function SamhitaReader() {
  const [shlokas, setShlokas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation States
  const [selectedSamhita, setSelectedSamhita] = useState("Charak Samhita");
  const [selectedSthana, setSelectedSthana] = useState("Sutrasthana");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Interactive Local States
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "TRANSLATION" | "COMMENTARY">>({});
  const [showAnvaya, setShowAnvaya] = useState<Record<string, boolean>>({});
  const [showMeanings, setShowMeanings] = useState<Record<string, boolean>>({});
  
  // Global View States (Master Toggles)
  const [expandAllAnvaya, setExpandAllAnvaya] = useState(false);
  const [expandAllMeanings, setExpandAllMeanings] = useState(false);

  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLiveShlokas();
  }, []);

  // Click Outside Listener for Tooltips
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveWordId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLiveShlokas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shlokas/approved");
      const json = await res.json();
      if (json.success) {
        const sorted = json.data.sort((a: any, b: any) => {
          const numA = parseInt(a.shlokaNumber.match(/\d+/)?.[0] || "0");
          const numB = parseInt(b.shlokaNumber.match(/\d+/)?.[0] || "0");
          return numA - numB;
        });
        setShlokas(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch shlokas", error);
    }
    setIsLoading(false);
  };

  const currentChapterShlokas = shlokas.filter(
    (s) => s.samhitaName === selectedSamhita && s.sthana === selectedSthana && s.chapter === selectedChapter
  );

  const toggleTab = (shlokaId: string, tab: "TRANSLATION" | "COMMENTARY") => {
    setActiveTab(prev => ({
      ...prev,
      [shlokaId]: prev[shlokaId] === tab ? prev[shlokaId] : tab
    }));
  };

  const toggleAnvaya = (shlokaId: string) => {
    setShowAnvaya(prev => ({ ...prev, [shlokaId]: !prev[shlokaId] }));
  };

  const toggleMeanings = (shlokaId: string) => {
    setShowMeanings(prev => ({ ...prev, [shlokaId]: !prev[shlokaId] }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col md:flex-row">
      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent/5 blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4 sticky top-0 z-40 flex justify-between items-center">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="text-primary w-5 h-5" /> AyushGyaan
        </h1>
        <button onClick={() => setIsMobileNavOpen(true)} className="text-gray-300 hover:text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-72 bg-gray-900/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-r border-gray-800 p-6 z-50 transition-transform duration-300 overflow-y-auto ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <div className="hidden md:flex items-center gap-3">
            <BookOpen className="text-primary w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-white">AyushGyaan</h1>
              <p className="text-xs text-accent">Student Reader</p>
            </div>
          </div>
          <button onClick={() => setIsMobileNavOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <LayoutList className="w-4 h-4" /> Book Navigation
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Samhita</label>
            <select 
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
              value={selectedSamhita}
              onChange={(e) => setSelectedSamhita(e.target.value)}
            >
              <option value="Charak Samhita">Charak Samhita</option>
              <option value="Ashtang Hridaya">Ashtang Hridaya</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">Sthana</label>
            <select 
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
              value={selectedSthana}
              onChange={(e) => setSelectedSthana(e.target.value)}
            >
              <option value="Sutrasthana">Sutrasthana</option>
              <option value="Nidanasthana">Nidanasthana</option>
              <option value="Vimanasthana">Vimanasthana</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">Chapter</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => { setSelectedChapter(num); setIsMobileNavOpen(false); }}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedChapter === num 
                      ? "bg-primary/20 text-primary border border-primary/50" 
                      : "bg-black/30 text-gray-400 border border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileNavOpen(false)} />
      )}

      {/* ========================================== */}
      {/* 2. MAIN READING AREA */}
      {/* ========================================== */}
      <main className="flex-1 p-4 sm:p-8 md:p-12 h-screen overflow-y-auto w-full max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {selectedSamhita}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-sm md:text-base font-medium">
              <span>{selectedSthana}</span>
              <ChevronRight className="w-4 h-4 text-primary" />
              <span className="text-primary">Chapter {selectedChapter}</span>
            </div>
          </div>

          {/* GLOBAL VIEW CONTROLS */}
          {!isLoading && currentChapterShlokas.length > 0 && (
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center gap-5 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" /> Global Settings
              </span>
              <div className="flex gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={expandAllAnvaya} onChange={() => setExpandAllAnvaya(!expandAllAnvaya)} />
                  <div className="w-9 h-5 bg-black/50 border border-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary peer-checked:after:bg-white"></div>
                  <span className="ml-2 text-xs font-medium text-gray-300">Syntax</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={expandAllMeanings} onChange={() => setExpandAllMeanings(!expandAllMeanings)} />
                  <div className="w-9 h-5 bg-black/50 border border-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:border-accent peer-checked:after:bg-white"></div>
                  <span className="ml-2 text-xs font-medium text-gray-300">Meanings</span>
                </label>
              </div>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
          </div>
        ) : currentChapterShlokas.length === 0 ? (
          <div className="glass-panel p-10 text-center text-gray-500 border-dashed border-gray-700 flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 mb-4 opacity-20" />
            <p>No verses are available in the database for this chapter yet.</p>
          </div>
        ) : (
          <div className="space-y-16 pb-24">
            {currentChapterShlokas.map((shloka) => {
              const currentTab = activeTab[shloka._id] || "TRANSLATION";
              const isAnvayaOpen = expandAllAnvaya || showAnvaya[shloka._id] || false;
              const isMeaningsOpen = expandAllMeanings || showMeanings[shloka._id] || false;

              return (
                <motion.article 
                  key={shloka._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="relative group"
                >
                  {/* Number Badge */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-11 h-11 bg-gray-900 border border-primary/40 text-primary rounded-full flex items-center justify-center font-bold text-base shadow-[0_0_20px_rgba(var(--primary),0.2)] z-10">
                    {shloka.shlokaNumber}
                  </div>

                  <div className="glass-panel p-6 sm:p-10 pt-12 border border-gray-800/60 rounded-2xl bg-black/20 hover:bg-black/40 transition-colors">
                    
                    {/* VIEW 1: MOOL SHLOKA (Refined Typography) */}
                    <div className="text-center mb-8">
                      <h3 className="text-xl sm:text-2xl font-medium text-gray-100 whitespace-pre-wrap leading-loose font-serif">
                        {shloka.originalShloka}
                      </h3>
                      {shloka.easyToReadShloka && (
                        <p className="mt-3 text-accent/70 text-[15px] font-medium tracking-wide">
                          {shloka.easyToReadShloka}
                        </p>
                      )}
                    </div>

                    {/* INTERACTIVE TOGGLE BUTTONS */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                      {shloka.anvaya && (
                        <button 
                          onClick={() => toggleAnvaya(shloka._id)}
                          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-xs sm:text-sm font-semibold ${
                            isAnvayaOpen 
                              ? "bg-primary/20 border-primary/50 text-primary" 
                              : "bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                          }`}
                        >
                          <ListTree className="w-4 h-4" />
                          Syntax (Anvaya)
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isAnvayaOpen ? "rotate-180" : ""}`} />
                        </button>
                      )}
                      
                      {shloka.words && shloka.words.length > 0 && (
                        <button 
                          onClick={() => toggleMeanings(shloka._id)}
                          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-xs sm:text-sm font-semibold ${
                            isMeaningsOpen 
                              ? "bg-accent/20 border-accent/50 text-accent" 
                              : "bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          Word Breakdown
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMeaningsOpen ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* EXPANDABLE CONTENT: ANVAYA */}
                    <AnimatePresence>
                      {isAnvayaOpen && shloka.anvaya && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden w-full mb-6"
                        >
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
                            <p className="text-primary/90 text-sm sm:text-[15px] leading-relaxed">
                              {shloka.anvaya}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* EXPANDABLE CONTENT: WORD GRID (Chips) */}
                    <AnimatePresence>
                      {isMeaningsOpen && shloka.words && shloka.words.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden w-full mb-6"
                        >
                          <div className="bg-black/30 rounded-xl p-6 border border-gray-800/50">
                            <div className="flex flex-wrap gap-3 justify-center">
                              {shloka.words.map((word: any, i: number) => {
                                const uniqueId = `${shloka._id}-${i}`;
                                const isActive = activeWordId === uniqueId;
                                const displayWordText = word.hasSandhi && word.sandhiComponents?.length > 0
                                  ? word.sandhiComponents.join(" + ")
                                  : word.text;

                                return (
                                  <div key={uniqueId} className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveWordId(isActive ? null : uniqueId);
                                      }}
                                      className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 border shadow-sm ${
                                        isActive 
                                          ? "bg-accent/20 text-accent border-accent font-semibold" 
                                          : "bg-gray-900/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-500"
                                      }`}
                                    >
                                      {displayWordText}
                                    </button>

                                    <AnimatePresence>
                                      {isActive && (
                                        <motion.div
                                          ref={tooltipRef}
                                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                          className="absolute z-50 bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-max max-w-[220px] sm:max-w-[280px] p-4 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-accent/40 shadow-[0_15px_40px_rgba(0,0,0,0.9)] text-center pointer-events-auto"
                                        >
                                          <p className="text-[10px] text-accent uppercase tracking-wider font-bold mb-1">Meaning</p>
                                          <p className="text-sm text-white font-medium whitespace-pre-wrap leading-tight">
                                            {word.meaningHindi || "N/A"}
                                          </p>
                                          
                                          {word.meaningEnglish && (
                                            <p className="text-xs text-gray-400 mt-2 border-t border-gray-700/50 pt-2">
                                              {word.meaningEnglish}
                                            </p>
                                          )}

                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-accent/40" />
                                          <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-gray-900/95" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* VIEW 3: TABS FOR TRANSLATION & COMMENTARY */}
                    <div className="mt-4 border border-gray-800/80 rounded-xl overflow-hidden bg-gray-900/30">
                      <div className="flex border-b border-gray-800/80">
                        <button 
                          onClick={() => toggleTab(shloka._id, "TRANSLATION")}
                          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                            currentTab === "TRANSLATION" 
                              ? "bg-primary/10 text-primary border-b-2 border-primary" 
                              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                          }`}
                        >
                          <Languages className="w-4 h-4" /> Translation
                        </button>
                        {shloka.vimarsh && (
                          <button 
                            onClick={() => toggleTab(shloka._id, "COMMENTARY")}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                              currentTab === "COMMENTARY" 
                                ? "bg-accent/10 text-accent border-b-2 border-accent" 
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            }`}
                          >
                            <FileText className="w-4 h-4" /> Commentary
                          </button>
                        )}
                      </div>

                      <div className="p-5 sm:p-6">
                        <AnimatePresence mode="wait">
                          {currentTab === "TRANSLATION" ? (
                            <motion.div
                              key="translation"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="text-gray-300 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-medium"
                            >
                              {shloka.translationHindi}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="commentary"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap"
                            >
                              {shloka.vimarsh}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}