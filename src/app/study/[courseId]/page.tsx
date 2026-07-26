"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlayCircle, FileText, Brain, HelpCircle, 
  Menu, X, Maximize, Minimize, ChevronLeft, 
  Sparkles, ShieldAlert, CheckCircle2, Lock
} from "lucide-react";
import Link from "next/link";

export default function StudyRoomPage({ params }: { params: { courseId: string } }) {
  // ==========================================
  // 1. STATES
  // ==========================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"VIDEO" | "NOTES" | "QUIZ">("NOTES");
  
  // Anti-Piracy User Details (Will come from DB/Auth later)
  const studentDetails = "jkdewasi961096@gmail.com | +91 9772852668";
  
  const containerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 2. SECURITY HOOKS (Anti-Piracy)
  // ==========================================
  useEffect(() => {
    // Disable Right Click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    // Disable Copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("⚠️ Security Alert: Copying content is strictly prohibited.");
    };
    // Disable Keyboard Shortcuts (Ctrl+P, Ctrl+S, Ctrl+C)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        alert("⚠️ Security Alert: This action is disabled.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ==========================================
  // 3. FULLSCREEN LOGIC
  // ==========================================
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ==========================================
  // 4. MOCK DATA
  // ==========================================
  const syllabus = [
    { title: "Chapter 1: Dirghanjivitiya Adhyaya", duration: "2h 15m", isCompleted: true },
    { title: "Chapter 2: Apamarga Tanduliya", duration: "1h 45m", isCompleted: false },
    { title: "Chapter 3: Aragvadhiya Adhyaya", duration: "2h 30m", isCompleted: false, isLocked: true },
  ];

  // ==========================================
  // 5. UI RENDER
  // ==========================================
  return (
    <div ref={containerRef} className="h-screen w-full bg-[#030705] text-white font-sans flex overflow-hidden select-none">
      
      {/* 🔴 DYNAMIC WATERMARK (ANTI-PIRACY) 🔴 */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden flex items-center justify-center opacity-[0.04] mix-blend-overlay">
        <motion.div 
          animate={{ x: ["-100vw", "100vw"], y: ["-100vh", "100vh"] }} 
          transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          className="text-4xl md:text-6xl font-black whitespace-nowrap rotate-45 text-white"
        >
          {studentDetails} • {studentDetails}
        </motion.div>
      </div>

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className={`hidden md:flex flex-col w-80 bg-[#050B08]/90 backdrop-blur-xl border-r border-white/5 h-full transition-all duration-300 z-40 ${isFullscreen ? '-ml-80' : 'ml-0'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <div className="bg-emerald-900/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/30">
            BAMS 1st Prof
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6 text-white">Charak Samhita (Sutrasthana)</h2>
          
          <div className="space-y-4">
            {syllabus.map((chap, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${i === 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'} transition-all cursor-pointer relative overflow-hidden group`}>
                <h3 className={`font-bold text-sm mb-1 ${i === 0 ? 'text-emerald-400' : 'text-gray-200'}`}>{chap.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3"/> {chap.duration}</span>
                  {chap.isCompleted && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                </div>
                {chap.isLocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR OVERLAY ================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="md:hidden fixed inset-y-0 left-0 w-[85vw] bg-[#050B08] border-r border-white/10 z-50 flex flex-col shadow-2xl">
              {/* Same Sidebar Content as Desktop */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <span className="font-bold text-emerald-400">Course Index</span>
                <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-gray-400"/></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {syllabus.map((chap, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                      <h3 className={`font-bold text-sm mb-1 ${i === 0 ? 'text-emerald-400' : 'text-gray-300'}`}>{chap.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col h-full relative z-10 bg-[#030705]">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#050B08]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-300" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md">1. Dirghanjivitiya Adhyaya</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Type Switcher */}
        <div className="flex p-4 md:p-6 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: "VIDEO", icon: PlayCircle, label: "Video Lecture" },
            { id: "NOTES", icon: FileText, label: "AI Shloka Reader" },
            { id: "QUIZ", icon: Brain, label: "Practice Quiz" }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Display Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            
            {/* 🎬 IF VIDEO IS ACTIVE */}
            {activeTab === "VIDEO" && (
              <div className="w-full aspect-video bg-black rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                <PlayCircle className="w-16 h-16 text-emerald-500/50" />
                <div className="absolute bottom-4 left-4 text-xs font-bold text-gray-500">Video Player UI Placeholder</div>
              </div>
            )}

            {/* 📝 IF NOTES (AI READER) IS ACTIVE */}
            {activeTab === "NOTES" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Single Shloka Block (Mocked from Admin Data) */}
                <div className="bg-[#050B08] border border-emerald-900/30 rounded-3xl p-6 md:p-10 relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 text-xs font-black px-3 py-1 rounded-full backdrop-blur-md">
                    SECTION: 1-2
                  </div>

                  {/* Original Shloka */}
                  <h3 className="text-xl md:text-2xl font-bold text-center text-amber-100 mb-8 leading-loose tracking-wide">
                    अथातो दीर्घञ्जीवितीयमध्यायं व्याख्यास्यामः ||१|| <br/>
                    इति ह स्माह भगवान्मात्रेयः ||२||
                  </h3>

                  {/* Hindi Translation */}
                  <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/5">
                    <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">Translation</h4>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                      अब हम दीर्घञ्जीवितीय अध्याय की व्याख्या करेंगे। ऐसा भगवान आत्रेय ने कहा।
                    </p>
                  </div>

                  {/* Vimarsh (Notes) */}
                  <div className="bg-emerald-900/10 rounded-2xl p-6 border border-emerald-500/10">
                    <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">AI Expert Notes (Vimarsh)</h4>
                    <ul className="list-disc list-outside ml-4 text-sm md:text-base text-gray-300 space-y-3 leading-relaxed">
                      <li><strong className="text-emerald-300">दीर्घञ्जीवितीय:</strong> यह शब्द आयुर्वेद के मूल उद्देश्य (लम्बी और स्वस्थ आयु) को दर्शाता है।</li>
                      <li>सूत्रस्थान का यह पहला अध्याय है, जो पूरे ग्रंथ का आधार (Foundation) तय करता है।</li>
                    </ul>
                  </div>

                </div>

                {/* Second Shloka Block */}
                <div className="bg-[#050B08] border border-white/5 rounded-3xl p-6 md:p-10 relative">
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-gray-900 border border-gray-700 text-gray-400 text-xs font-black px-3 py-1 rounded-full">
                    SECTION: 3
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-center text-gray-300 mb-8 leading-loose">
                    धर्मार्थकाममोक्षाणामारोग्यं मूलमुत्तमम् | <br/>
                    रोगास्तस्यापहर्तारः श्रेयसो जीवितस्य च ||३||
                  </h3>
                  <div className="bg-white/5 rounded-2xl p-6 mb-6">
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Translation</h4>
                    <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                      धर्म, अर्थ, काम और मोक्ष—इन चारों पुरुषार्थों की प्राप्ति का मुख्य साधन आरोग्य (उत्तम स्वास्थ्य) है। रोग इस आरोग्य और जीवन का नाश करने वाले हैं।
                    </p>
                  </div>
                </div>

              </motion.div>
            )}

            {/* 🧠 IF QUIZ IS ACTIVE */}
            {activeTab === "QUIZ" && (
              <div className="bg-[#050B08] border border-white/10 rounded-3xl p-8 text-center py-20">
                <Brain className="w-16 h-16 text-amber-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">Chapter 1 Quiz</h3>
                <p className="text-gray-400 mb-6">Test your knowledge on Dirghanjivitiya Adhyaya.</p>
                <button className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-full font-bold transition-colors">Start Test Now</button>
              </div>
            )}
          </div>
        </div>

        {/* ✨ FLOATING AI DOUBT BUTTON */}
        <button className="absolute bottom-6 right-6 md:bottom-10 md:right-10 group flex items-center justify-center z-50">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-30 group-hover:animate-ping duration-1000"></span>
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-sm">Ask AI Tutor</span>
          </div>
        </button>

      </main>
    </div>
  );
}