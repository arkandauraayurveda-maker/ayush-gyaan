"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, LayoutList, Languages, FileText, Menu, X, ChevronRight,
  Sparkles, ListTree, ChevronDown, Settings2, ArrowLeft, Bot, Send, Loader2,
  Lock, GraduationCap, ShieldCheck, Zap
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

function SamhitaReaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth & Access Control States
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasCourseAccess, setHasCourseAccess] = useState(true);

  // Content & Navigation States
  const [shlokas, setShlokas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [structure, setStructure] = useState<Record<string, Record<string, number[]>>>({});
  
  const [selectedSamhita, setSelectedSamhita] = useState("Charak Samhita");
  const [selectedSthana, setSelectedSthana] = useState("Sutra Sthana");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Interactive Local States
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "TRANSLATION" | "COMMENTARY">>({});
  const [showAnvaya, setShowAnvaya] = useState<Record<string, boolean>>({});
  const [showMeanings, setShowMeanings] = useState<Record<string, boolean>>({});
  
  // Global View States
  const [expandAllAnvaya, setExpandAllAnvaya] = useState(false);
  const [expandAllMeanings, setExpandAllMeanings] = useState(false);

  // 🤖 Shloka-level AyushGyaan AI Drawer States
  const [selectedShlokaForAi, setSelectedShlokaForAi] = useState<any | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [aiInputText, setAiInputText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [userTokens, setUserTokens] = useState<number>(10);
  const [userAiTier, setUserAiTier] = useState<string>("basic");

  const tooltipRef = useRef<HTMLDivElement>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // 🛡️ 1. AUTH & COURSE ACCESS GUARD
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        try {
          const token = await user.getIdToken(false);
          const res = await fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setUserTokens(data.user.aiPlan?.tokens ?? 10);
            setUserAiTier((data.user.aiPlan?.tier || "basic").toLowerCase());

            const role = data.user.role || "user";
            const activeCourses = (data.user.courses || []).filter((c: any) => c.status === "ACTIVE");

            // Allow access if admin, or has any active course/purchased modules
            if (role === "admin" || activeCourses.length > 0) {
              setHasCourseAccess(true);
            } else {
              setHasCourseAccess(false);
            }
          }
        } catch (e) {
          console.error("Samhita Auth Guard Error:", e);
        } finally {
          setIsAuthLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (hasCourseAccess) {
      fetchStructureAndShlokas();
    }
  }, [hasCourseAccess]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiThinking]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveWordId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStructureAndShlokas = async () => {
    setIsLoading(true);
    try {
      const structRes = await fetch("/api/shlokas/samhita-structure");
      const structData = await structRes.json();
      if (structData.success && structData.structure) {
        setStructure(structData.structure);
        const firstSamhita = Object.keys(structData.structure)[0] || "Charak Samhita";
        const firstSthana = Object.keys(structData.structure[firstSamhita] || {})[0] || "Sutra Sthana";
        setSelectedSamhita(firstSamhita);
        setSelectedSthana(firstSthana);
      }

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
      console.error("Failed to fetch shlokas & structure", error);
    }
    setIsLoading(false);
  };

  // 🤖 OPEN SHLOKA AI DRAWER
  const handleOpenAiDrawer = (shloka: any) => {
    setSelectedShlokaForAi(shloka);
    setIsAiDrawerOpen(true);
    const scholarFirstName = currentUser?.name ? currentUser.name.split(" ")[0] : "Scholar";
    setAiMessages([
      {
        role: "assistant",
        content: `Hey ${scholarFirstName}! 👋 मैं **AyushGyaan AI** हूँ। आप ${shloka.samhitaName || 'संहिता'} (${shloka.sthana || ''}) Ch ${shloka.chapter} Shloka ${shloka.shlokaNumber} पढ़ रहे हैं:\n\n> ${shloka.originalShloka}\n\nइस श्लोक के बारे में क्या जानना चाहते हैं? बेझिझक पूछें!`
      }
    ]);
  };

  // 🤖 SEND QUESTION TO AYUSHGYAAN AI
  const handleSendAiMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiInputText;
    if (!textToSend.trim() || isAiThinking) return;

    if (userTokens <= 0 && userAiTier !== "pro") {
      alert("⚠️ आपके दैनिक AyushGyaan AI टोकन समाप्त हो गए हैं। कृपया अपने प्लान को अपग्रेड करें।");
      return;
    }

    const newMessages = [...aiMessages, { role: "user" as const, content: textToSend }];
    setAiMessages(newMessages);
    if (!customPrompt) setAiInputText("");
    setIsAiThinking(true);

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const contextPrompt = `[SHLOKA CONTEXT]\nSamhita: ${selectedShlokaForAi?.samhitaName || selectedSamhita}\nSthana: ${selectedShlokaForAi?.sthana || selectedSthana}\nChapter: ${selectedShlokaForAi?.chapter || selectedChapter}\nShloka No: ${selectedShlokaForAi?.shlokaNumber}\nText: ${selectedShlokaForAi?.originalShloka}\nMeaning: ${selectedShlokaForAi?.translationHindi}\nVimarsh: ${selectedShlokaForAi?.vimarsh || ''}\n\n[USER QUESTION]: ${textToSend}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: contextPrompt,
          history: newMessages.slice(1)
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setAiMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        if (data.remainingTokens !== undefined) {
          setUserTokens(data.remainingTokens);
        }
      } else {
        setAiMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${data.error || "AyushGyaan AI इंजन इस समय उपलब्ध नहीं है।"}` }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "⚠️ नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।" }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const normalizeString = (str: string) => (str || "").toLowerCase().replace(/[\s\-_]/g, "");

  const currentChapterShlokas = shlokas.filter(s => {
    const samhitaMatch = normalizeString(s.samhitaName) === normalizeString(selectedSamhita) ||
      normalizeString(s.samhitaName).includes(normalizeString(selectedSamhita).replace("samhita", "")) ||
      normalizeString(selectedSamhita).includes(normalizeString(s.samhitaName).replace("samhita", ""));
    const sthanaMatch = normalizeString(s.sthana) === normalizeString(selectedSthana);
    const chapterMatch = Number(s.chapter) === Number(selectedChapter);

    return (samhitaMatch && sthanaMatch && chapterMatch) || (chapterMatch && (samhitaMatch || sthanaMatch));
  });

  const availableSamhitas = Object.keys(structure).length > 0
    ? Object.keys(structure)
    : ["Charak Samhita", "Sushruta Samhita", "Ashtanga Hridaya"];

  const availableSthanas = structure[selectedSamhita]
    ? Object.keys(structure[selectedSamhita])
    : ["Sutra Sthana", "Nidan Sthana", "Viman Sthana", "Sharir Sthana", "Chikitsa Sthana"];

  const availableChapters = (structure[selectedSamhita] && structure[selectedSamhita][selectedSthana])
    ? structure[selectedSamhita][selectedSthana]
    : Array.from({ length: 30 }, (_, i) => i + 1);

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

  // LOADING GUARD
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/80 text-xs font-semibold tracking-widest uppercase">Authenticating Samhita Workspace...</p>
      </div>
    );
  }

  // 🛡️ AUTHORIZATION GUARD CARD
  if (!hasCourseAccess) {
    return (
      <div className="min-h-screen bg-[#020604] text-white flex flex-col items-center justify-center p-4">
        <div className="glass-panel border border-emerald-900/50 bg-[#050B08]/90 p-8 md:p-12 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
              Course Access Required
            </span>
            <h2 className="text-2xl font-bold text-white mt-4">Samhita Reader Access Restricted</h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              This Samhita module requires an active AyushGyaan Course Enrollment. Unlock Charak Samhita, Ashtang Hridaya & AI Shloka Decoders now.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link 
              href="/#curriculum" 
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <GraduationCap className="w-4 h-4" /> Explore Course Catalog & Enroll
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full py-3 bg-black/40 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col md:flex-row">
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-500/5 blur-[150px] -z-10 rounded-full" />

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" aria-label="Back to Dashboard" className="p-1.5 rounded-lg bg-black/40 border border-gray-800 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="text-emerald-400 w-5 h-5" /> AyushGyaan
          </h1>
        </div>
        <button onClick={() => setIsMobileNavOpen(true)} aria-label="Open Navigation Menu" className="text-gray-300 hover:text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-72 bg-gray-900/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-r border-gray-800 p-6 z-40 transition-transform duration-300 overflow-y-auto ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" aria-label="Back to Dashboard" className="p-2 rounded-xl bg-black/40 border border-gray-800 text-gray-400 hover:text-emerald-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">AyushGyaan</h1>
              <p className="text-xs text-emerald-400 font-semibold">Samhita Reader</p>
            </div>
          </div>
          <button onClick={() => setIsMobileNavOpen(false)} aria-label="Close Navigation" className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <LayoutList className="w-4 h-4" /> Book Navigation
          </h2>
          
          <div className="space-y-2">
            <label htmlFor="samhita-select" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Select Samhita</label>
            <select 
              id="samhita-select"
              aria-label="Select Samhita"
              className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
              value={selectedSamhita}
              onChange={(e) => {
                const newSam = e.target.value;
                setSelectedSamhita(newSam);
                const firstSthana = structure[newSam] ? Object.keys(structure[newSam])[0] : "Sutra Sthana";
                setSelectedSthana(firstSthana);
                setSelectedChapter(1);
              }}
            >
              {availableSamhitas.map(sam => (
                <option key={sam} value={sam}>{sam}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="sthana-select" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Select Sthana</label>
            <select 
              id="sthana-select"
              aria-label="Select Sthana"
              className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none"
              value={selectedSthana}
              onChange={(e) => {
                setSelectedSthana(e.target.value);
                setSelectedChapter(1);
              }}
            >
              {availableSthanas.map(sth => (
                <option key={sth} value={sth}>{sth}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Select Chapter</label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {availableChapters.map((num) => (
                <button
                  key={num}
                  onClick={() => { setSelectedChapter(num); setIsMobileNavOpen(false); }}
                  aria-label={`Select Chapter ${num}`}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedChapter === num 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-md" 
                      : "bg-black/30 text-gray-400 border border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  Ch {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsMobileNavOpen(false)} />
      )}

      {/* ========================================== */}
      {/* MAIN READING AREA */}
      {/* ========================================== */}
      <main className={`flex-1 p-4 sm:p-8 md:p-12 h-screen overflow-y-auto w-full max-w-4xl mx-auto custom-scrollbar transition-all duration-300 ${isAiDrawerOpen ? "lg:mr-[400px] xl:mr-[440px]" : ""}`}>
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {selectedSamhita}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-sm md:text-base font-medium">
              <span>{selectedSthana}</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Chapter {selectedChapter}</span>
            </div>
          </div>

          {/* GLOBAL VIEW CONTROLS */}
          {!isLoading && (
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center gap-5 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" /> Global Settings
              </span>
              <div className="flex gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" aria-label="Toggle all syntax" className="sr-only peer" checked={expandAllAnvaya} onChange={() => setExpandAllAnvaya(!expandAllAnvaya)} />
                  <div className="w-9 h-5 bg-black/50 border border-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:after:bg-white"></div>
                  <span className="ml-2 text-xs font-medium text-gray-300">Syntax</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" aria-label="Toggle all word meanings" className="sr-only peer" checked={expandAllMeanings} onChange={() => setExpandAllMeanings(!expandAllMeanings)} />
                  <div className="w-9 h-5 bg-black/50 border border-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:border-teal-500 peer-checked:after:bg-white"></div>
                  <span className="ml-2 text-xs font-medium text-gray-300">Meanings</span>
                </label>
              </div>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : currentChapterShlokas.length === 0 ? (
          <div className="glass-panel p-10 text-center text-gray-400 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 mb-4 text-emerald-500/30" />
            <p className="text-sm font-semibold">इस अध्याय के श्लोक वर्तमान में लोड हो रहे हैं या जल्द ही उपलब्ध होंगे।</p>
            <p className="text-xs text-gray-500 mt-2">कृपया sidebar से अन्य अध्याय या संहिता चुनें।</p>
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
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-11 h-11 bg-gray-900 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center font-bold text-base shadow-lg z-10">
                    {shloka.shlokaNumber}
                  </div>

                  <div className="glass-panel p-6 sm:p-10 pt-12 border border-gray-800/60 rounded-2xl bg-black/40 hover:bg-black/60 transition-colors shadow-2xl">
                    
                    {/* MOOL SHLOKA */}
                    <div className="text-center mb-8">
                      <blockquote className="text-xl sm:text-2xl font-medium text-gray-100 whitespace-pre-wrap leading-loose font-serif">
                        {shloka.originalShloka}
                      </blockquote>
                      {shloka.easyToReadShloka && (
                        <p className="mt-3 text-emerald-400/80 text-[15px] font-medium tracking-wide">
                          {shloka.easyToReadShloka}
                        </p>
                      )}
                    </div>

                    {/* INTERACTIVE TOGGLE BUTTONS & AI ASSISTANT BUTTON */}
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                      
                      {/* 🤖 ASK AYUSHGYAAN AI BUTTON */}
                      <button
                        onClick={() => handleOpenAiDrawer(shloka)}
                        className="flex items-center gap-2 px-5 py-2 rounded-full border border-purple-500/50 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 transition-all text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/20"
                      >
                        <Bot className="w-4 h-4 text-purple-400" />
                        Ask AyushGyaan AI
                      </button>

                      {shloka.anvaya && (
                        <button 
                          onClick={() => toggleAnvaya(shloka._id)}
                          aria-label="Toggle Syntax Anvaya"
                          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-xs sm:text-sm font-semibold ${
                            isAnvayaOpen 
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
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
                          aria-label="Toggle Word Breakdown"
                          className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-xs sm:text-sm font-semibold ${
                            isMeaningsOpen 
                              ? "bg-teal-500/20 border-teal-500/50 text-teal-300" 
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
                          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 text-center">
                            <p className="text-emerald-300 text-sm sm:text-[15px] leading-relaxed">
                              {shloka.anvaya}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* EXPANDABLE CONTENT: WORD GRID */}
                    <AnimatePresence>
                      {isMeaningsOpen && shloka.words && shloka.words.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden w-full mb-6"
                        >
                          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
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
                                      aria-label={`Word meaning for ${displayWordText}`}
                                      className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 border shadow-sm ${
                                        isActive 
                                          ? "bg-teal-500/20 text-teal-300 border-teal-500 font-semibold" 
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
                                          className="absolute z-50 bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-max max-w-[220px] sm:max-w-[280px] p-4 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-teal-500/40 shadow-2xl text-center pointer-events-auto"
                                        >
                                          <p className="text-[10px] text-teal-400 uppercase tracking-wider font-bold mb-1">Meaning</p>
                                          <p className="text-sm text-white font-medium whitespace-pre-wrap leading-tight">
                                            {word.meaningHindi || "N/A"}
                                          </p>
                                          
                                          {word.meaningEnglish && (
                                            <p className="text-xs text-gray-400 mt-2 border-t border-gray-700/50 pt-2">
                                              {word.meaningEnglish}
                                            </p>
                                          )}
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

                    {/* TRANSLATION & COMMENTARY TABS */}
                    <div className="mt-4 border border-gray-800 rounded-xl overflow-hidden bg-gray-900/40">
                      <div className="flex border-b border-gray-800">
                        <button 
                          onClick={() => toggleTab(shloka._id, "TRANSLATION")}
                          aria-label="View Hindi Translation"
                          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                            currentTab === "TRANSLATION" 
                              ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" 
                              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                          }`}
                        >
                          <Languages className="w-4 h-4" /> Translation (भावार्थ)
                        </button>
                        {shloka.vimarsh && (
                          <button 
                            onClick={() => toggleTab(shloka._id, "COMMENTARY")}
                            aria-label="View Commentary Vimarsh"
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                              currentTab === "COMMENTARY" 
                                ? "bg-teal-500/10 text-teal-300 border-b-2 border-teal-500" 
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            }`}
                          >
                            <FileText className="w-4 h-4" /> Commentary (विमर्श)
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
                              className="text-gray-200 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-medium"
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

      {/* ========================================================= */}
      {/* 🤖 RIGHT-SIDE SLIDE-OVER AYUSHGYAAN AI ASSISTANT DRAWER */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAiDrawerOpen && selectedShlokaForAi && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] md:w-[400px] lg:w-[420px] bg-[#070d0a] border-l border-purple-900/40 flex flex-col shadow-2xl transition-all"
            >
              {/* DRAWER HEADER */}
              <div className="p-4 border-b border-gray-800/80 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-950 border border-purple-800 rounded-xl text-purple-400 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      AyushGyaan AI Assistant
                    </h3>
                    <p className="text-[10px] text-purple-300 font-medium">
                      Plan: <span className="uppercase text-white font-bold">{userAiTier}</span> • Remaining Tokens: <span className="text-emerald-400 font-bold">{userTokens}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsAiDrawerOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CONTEXT BANNER */}
              <div className="p-3 bg-purple-950/20 border-b border-purple-900/30 text-xs text-purple-200">
                <span className="font-bold text-white">Shloka Context:</span> {selectedShlokaForAi.samhitaName} • Ch {selectedShlokaForAi.chapter} • Shloka {selectedShlokaForAi.shlokaNumber}
              </div>

              {/* CHAT MESSAGES BODY */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {aiMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                        msg.role === "user" 
                          ? "bg-emerald-600 text-white rounded-br-none" 
                          : "bg-black/60 border border-purple-900/40 text-gray-200 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-black/60 border border-purple-900/40 text-purple-300 rounded-2xl rounded-bl-none p-3.5 text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      AyushGyaan AI is analyzing shloka context...
                    </div>
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>

              {/* ONE-TAP QUICK PROMPT CHIPS */}
              <div className="p-3 bg-black/40 border-t border-gray-800/60 overflow-x-auto custom-scrollbar flex gap-2">
                <button
                  onClick={() => handleSendAiMessage("इस श्लोक का आयुर्वेदिक चिकित्सकीय महत्व और अनुप्रयोग (Clinical Application) विस्तार से समझाएं।")}
                  className="px-3 py-1.5 bg-purple-950/50 hover:bg-purple-900/80 border border-purple-800 text-purple-300 text-[11px] rounded-xl whitespace-nowrap font-medium transition-colors"
                >
                  💡 Clinical Application
                </button>
                <button
                  onClick={() => handleSendAiMessage("इस श्लोक का पदच्छेद (Grammatical Breakdown) और मुख्य शब्दों के अर्थ बताएं।")}
                  className="px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 text-[11px] rounded-xl whitespace-nowrap font-medium transition-colors"
                >
                  📝 Padacheda Breakdown
                </button>
                <button
                  onClick={() => handleSendAiMessage("BAMS परीक्षा के दृष्टिकोण से इस श्लोक पर कौन-से प्रश्न बन सकते हैं?")}
                  className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/80 border border-amber-800 text-amber-300 text-[11px] rounded-xl whitespace-nowrap font-medium transition-colors"
                >
                  🎓 Expected Exam Qs
                </button>
              </div>

              {/* CHAT INPUT FORM */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }} 
                className="p-3 border-t border-gray-800/80 bg-black/80 flex items-center gap-2"
              >
                <input 
                  type="text" 
                  placeholder="Ask AyushGyaan AI about this shloka..." 
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  className="flex-1 bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isAiThinking || !aiInputText.trim()}
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// 🛠️ FIX FOR VERCEL DEPLOYMENT: Wrap in Suspense boundary to allow static pre-rendering
export default function SamhitaReader() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/80 text-xs font-semibold tracking-widest uppercase">Loading Samhita Workspace...</p>
      </div>
    }>
      <SamhitaReaderContent />
    </Suspense>
  );
}