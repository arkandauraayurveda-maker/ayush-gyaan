"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Brain, Sparkles, ArrowRight, CheckCircle2, 
  ShieldCheck, Mic, Camera, ChevronDown, 
  PlayCircle, BarChart3, Fingerprint, Lock, Menu, X, 
  Terminal, Flame, Tag, Calendar, Ticket
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 🧠 ULTRA-PREMIUM WIDE TYPEWRITER COMPONENT
// ==========================================
const AITypewriter = () => {
  const [displayedText, setDisplayedText] = useState("");

  const content = [
    { title: "॥ मूल श्लोक ॥", text: "हेतुलिङ्गौषधज्ञानं स्वस्थातुरपरायणम्।\nत्रिसूत्रं शाश्वतं पुण्यं बुबुधे यं पितामहः ॥२४॥\n\n" },
    { title: "॥ पदच्छेद (Padacheda) ॥", text: "हेतु-लिङ्ग-औषध-ज्ञानं स्वस्थ-आतुर-परायणम्।\nत्रिसूत्रं शाश्वतं पुण्यं बुबुधे यं पितामहः ॥२४॥\n\n" },
    { title: "॥ हिंदी भावार्थ ॥", text: "स्वस्थ व्यक्तियों के स्वास्थ्य की रक्षा करने वाला और आतुरों (रोगियों) के विकारों को शांत करने के लिए जो परम मार्ग (अयन) स्वरूप है; जिसमें हेतु (रोग के कारण), लिंग (रोग के लक्षण) और औषध (चिकित्सा) का ज्ञान समाहित है; जो सनातन (नित्य) और अत्यंत पुण्यकारी है; तथा जिसे सर्वप्रथम सृष्टि के रचयिता ब्रह्मा जी ने स्वयं जाना था, वही 'त्रिसूत्र' आयुर्वेद है।" }
  ];

  useEffect(() => {
    let charIndex = 0;
    let currentPhase = 0;
    let isPaused = false;
    let textAccumulator = "";
    let typeWriter: NodeJS.Timeout;

    const typeNextChar = () => {
      if (isPaused) return;

      if (currentPhase >= content.length) {
        isPaused = true;
        setTimeout(() => {
          setDisplayedText("");
          textAccumulator = "";
          charIndex = 0;
          currentPhase = 0;
          isPaused = false;
        }, 4000); 
        return;
      }

      const currentBlock = `${content[currentPhase].title}\n${content[currentPhase].text}`;

      if (charIndex < currentBlock.length) {
        setDisplayedText(textAccumulator + currentBlock.substring(0, charIndex + 1));
        charIndex++;
      } else {
        textAccumulator += currentBlock;
        currentPhase++;
        charIndex = 0;
        isPaused = true;
        
        setTimeout(() => {
          isPaused = false;
        }, 1000);
      }
    };

    typeWriter = setInterval(typeNextChar, 35); 
    return () => clearInterval(typeWriter);
  }, []);

  return (
    <div className="relative mt-4 h-[21rem] md:h-[22rem] rounded-3xl overflow-hidden p-[1px] group w-full">
      {/* Background Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 via-transparent to-teal-500/40 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Real Glassmorphism Container */}
      <div className="relative h-full w-full bg-[#030a07]/60 backdrop-blur-2xl rounded-3xl p-4 md:p-6 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.5)] border border-white/10">
        
        {/* Top Header */}
        <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-3 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Charak Samhita AI</h4>
            <p className="text-[9px] text-emerald-400 font-bold tracking-wider">Sutrasthana • Chapter 1</p>
          </div>
        </div>

        {/* Live Typing Content with Auto-Scroll Fix */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth pr-2">
          <div className="text-[13px] md:text-[15px] font-medium text-emerald-50/90 leading-[1.8] tracking-wide whitespace-pre-wrap transition-all">
            {displayedText}
            <motion.span 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 0.8 }} 
              className="inline-block w-2 md:w-2.5 h-4 md:h-4 bg-emerald-400 ml-1 align-middle shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 🚀 MAIN HOMEPAGE COMPONENT
// ==========================================
export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  const [formData, setFormData] = useState({ name: "", mobile: "", subject: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    fetch("/api/courses/public")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.courses.length > 0) {
          setCourses(data.courses);
        } else {
          setCourses([
            { 
              id: "sa1", title: "Samhita Adhyayan I", prof: "BAMS 1st Professional", status: "Available Now", 
              price: "₹599", originalPrice: "₹1999", discountText: "70% OFF", badge: "BESTSELLER 🔥",
              duration: "1-Year Access", syllabus: ["Charak Samhita: Sutra Sthana (Ch. 1-12)", "Ashtang Hridaya: Sutra Sthana (Ch. 1-15)"], highlight: true 
            },
            { 
              id: "sa2", title: "Samhita Adhyayan II", prof: "BAMS 2nd Professional", status: "Available Now", 
              price: "₹599", originalPrice: "₹1499", discountText: "60% OFF", badge: "HOT SALE", startDate: "Starts 15 Aug", couponCode: "BAMS50",
              duration: "1-Year Access", syllabus: ["Charak Samhita: Sutra Sthana (Ch. 15-30)", "Charak Samhita: Nidan Sthana (Complete)", "Viman, Sharir & Indriya Sthana (Complete)"], highlight: false 
            },
            { 
              id: "sa3", title: "Samhita Adhyayan III", prof: "BAMS 3rd Professional", status: "Coming Soon", 
              price: "Coming Soon", duration: "Pre-registration Open", syllabus: ["Charak Samhita: Chikitsa Sthana", "Charak Samhita: Kalpa Sthana", "Charak Samhita: Siddhi Sthana"], highlight: false 
            }
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingCourses(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEarlyBirdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/early-bird", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) {
        alert("Registration successful! You have secured priority access and a 50% Early Bird Grant.");
        setFormData({ name: "", mobile: "", subject: "" });
      } else { alert("Registration Error: " + data.error); }
    } catch (error) { alert("Network Error. Please try again later."); }
    setIsSubmitting(false);
  };

  const chartOpacities = [0.2, 0.5, 0.8, 0.3, 0.9, 0.4, 0.7, 0.6, 1.0, 0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 0.8];
  
  const faqs = [
    { q: "What is the 5-Day 100% Refund Policy?", a: "We offer a strict 'No Questions Asked' 5-day money-back guarantee. If the platform does not align with your academic expectations, you may cancel your subscription within five days of enrollment for a full, unconditional refund." },
    { q: "How accurate is the Samhita AI? Can it hallucinate?", a: "Our Samhita AI operates on a highly constrained RAG architecture. It extracts answers exclusively from authenticated classical texts and NCISM-approved curricula. It is programmed to state 'Data Unavailable' rather than hallucinate, ensuring absolute clinical safety." },
    { q: "What is included in the ₹599 Annual Membership?", a: "The membership grants comprehensive access to the AI Samhita Reader (Padacheda, Anvaya, Translations, Vimarsh), expert video lectures, PDF notes, chapter-wise clinical quizzes, and our smart performance-tracking dashboard." },
    { q: "When will other clinical subjects be launched?", a: "Foundational and clinical subjects across all Profs are currently undergoing rigorous academic review. You may utilize our Early Bird Registration form to secure priority access and an exclusive 50% grant upon their official launch." }
  ];

  return (
    <div className="min-h-screen bg-[#020604] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] bg-teal-600/10 rounded-full blur-[120px] md:blur-[150px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] bg-emerald-700/10 rounded-full blur-[150px] md:blur-[180px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      {/* ================= NAVBAR ================= */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "py-2 md:py-4" : "py-4 md:py-6"}`}>
        <div className={`max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between transition-all duration-500 ${isScrolled ? "bg-[#050B08]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:rounded-2xl py-3 px-4 md:px-6" : ""}`}>
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 md:p-2 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter">Ayush<span className="text-emerald-400">Gyaan</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors tracking-wide">Platform</a>
            <a href="#curriculum" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors tracking-wide">Curriculum</a>
            <Link href="/login" className="relative group ml-4">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative bg-[#020604] border border-white/10 px-6 py-2.5 rounded-full text-sm font-bold text-white group-hover:border-emerald-500/50 transition-colors flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" /> Access Portal
              </div>
            </Link>
          </div>

          <button className="md:hidden p-2 text-white z-50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-full left-0 w-full bg-[#050B08]/95 backdrop-blur-3xl border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl md:hidden">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-gray-200">Platform Features</a>
              <a href="#curriculum" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-gray-200">Academic Curriculum</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-gray-200">FAQs</a>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-emerald-600 text-white text-center py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-2">
                <Fingerprint className="w-5 h-5" /> Access Student Portal
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-4 md:px-6 flex flex-col items-center justify-center z-10 min-h-[90vh]">
        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-xl text-emerald-300 px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold mb-6 md:mb-8 shadow-xl uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> 100% NCISM Compliant Curriculum
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1] md:leading-[1.05]">
            Master BAMS with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600">Clinical Precision.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-base md:text-xl max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed px-2">
            India's first AI-powered academic ecosystem for Ayurvedic scholars. Decode Samhitas, track clinical proficiency, and study seamlessly without distractions.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 w-full sm:w-auto px-4">
            <a href="#curriculum" className="w-full sm:w-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-500 hidden sm:block"></div>
              <div className="relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 sm:bg-[#020604] border border-emerald-500/50 text-white px-8 py-4 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold flex items-center justify-center gap-3 transition-transform sm:group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 shadow-xl">
                Enroll in Academy <ArrowRight className="w-5 h-5" />
              </div>
            </a>
            <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-2 sm:mt-0">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> 5-Day Money-Back Guarantee
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full mt-16 md:mt-24 border-y border-white/5 bg-white/[0.01] py-4 md:py-6 flex overflow-hidden whitespace-nowrap mask-gradient">
          <div className="animate-marquee inline-flex gap-8 md:gap-16 items-center text-xs md:text-sm font-bold text-gray-600 uppercase tracking-widest px-4 md:px-8">
            <span>Trusted by Scholars from</span> • <span>NIA Jaipur</span> • <span>ITRA Jamnagar</span> • <span>BHU Varanasi</span> • <span>CBPACS New Delhi</span> • <span>AIIA Delhi</span> • <span>Trusted by Scholars from</span> • <span>NIA Jaipur</span> • <span>ITRA Jamnagar</span> • <span>BHU Varanasi</span>
          </div>
        </motion.div>
      </section>

      {/* ================= REFINED ZIG-ZAG BENTO GRID ================= */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">An Ecosystem <span className="text-teal-400">Engineered for Mastery</span></h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">Not just PDFs and Videos. We built a proprietary academic engine to accelerate your clinical understanding.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* ROW 1: AI Chat (Col 2) + Analytics (Col 1) */}
          <div className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-teal-500/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-teal-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3">
                <Brain className="w-3.5 h-3.5 md:w-4 md:h-4" /> Strictly Authenticated
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">The Samhita AI Assistant</h3>
              <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">Query complex Shlokas via Voice or Image. Powered by RAG architecture to guarantee zero hallucinations and absolute clinical accuracy.</p>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 backdrop-blur-md mt-6 max-w-lg shadow-2xl relative z-10 w-full">
              <div className="p-2.5 bg-white/5 rounded-xl"><Camera className="w-4 h-4 text-gray-400"/></div>
              <div className="flex-1 text-xs md:text-sm text-gray-500 pl-2 font-mono truncate">Ask about Charak Sutrasthana...</div>
              <div className="p-2.5 bg-teal-600 rounded-xl"><Mic className="w-4 h-4 text-white"/></div>
            </div>
          </div>

          <div className="md:col-span-1 bg-gradient-to-br from-emerald-900/20 to-black border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all min-h-[300px] flex flex-col justify-between">
            <div className="relative z-10">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">Performance Tracking</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Visualize your study streaks, subject mastery, and clinical quiz accuracy instantly.</p>
            </div>
            <div className="grid grid-cols-6 gap-1.5 mt-6 relative z-10">
              {chartOpacities.map((opacityValue, i) => (
                <div key={i} style={{ opacity: opacityValue }} className="h-4 md:h-6 rounded bg-emerald-500" />
              ))}
            </div>
          </div>

          {/* ROW 2: Smart Reader (Col 2) + Ecosystem (Col 1) */}
          <div className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all flex flex-col">
            <div className="relative z-10">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 mb-2" />
              <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">AI Smart Reader</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Experience real-time decoding with integrated Padacheda, Anvaya, and clinical Vimarsh.</p>
            </div>
            
            {/* 🔴 WIDE AI TYPEWRITER 🔴 */}
            <AITypewriter />
          </div>

          <div className="md:col-span-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/30 to-transparent opacity-60" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-white font-bold uppercase tracking-widest mb-4 text-[10px] md:text-xs">
                <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Complete Ecosystem
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 tracking-tight">Video Lectures, PDFs & Tests.</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">Everything you need to top your Prof exams and build a solid foundation, perfectly organized in one dashboard.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= DYNAMIC CURRICULUM PRICING ================= */}
      <section id="curriculum" className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest mb-4 text-[10px] md:text-xs bg-emerald-900/30 px-4 py-1.5 rounded-full border border-emerald-500/30">
            <Tag className="w-4 h-4" /> Limited Time Offers
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Academic <span className="text-emerald-400">Modules</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">Transparent pricing. No hidden fees. Cancel within 5 days for a full refund.</p>
        </div>

        {isLoadingCourses ? (
          <div className="flex justify-center p-10">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 items-start pt-4">
            {courses.map((course, i) => (
              <div key={course.id || i} className={`bg-white/[0.02] backdrop-blur-xl border ${course.highlight ? 'border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] md:-translate-y-2' : 'border-white/10'} rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col h-full relative transition-transform`}>
                
                {course.badge && (
                  <div className="absolute -top-3.5 left-6 md:left-8 bg-red-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center gap-1 border border-red-400">
                    <Flame className="w-3 h-3 md:w-4 md:h-4" /> {course.badge}
                  </div>
                )}
                
                {course.highlight && !course.badge && (
                  <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Recommended
                  </div>
                )}
                
                <span className={`${course.highlight ? 'text-emerald-400' : 'text-blue-400'} font-bold text-xs md:text-sm mb-2 uppercase tracking-wide mt-2`}>{course.prof}</span>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{course.title}</h3>
                
                {course.startDate && (
                  <div className="text-[10px] md:text-xs text-amber-400 font-bold mb-4 flex items-center gap-1.5 bg-amber-500/10 w-fit px-3 py-1.5 rounded-md border border-amber-500/20">
                    <Calendar className="w-3.5 h-3.5" /> {course.startDate}
                  </div>
                )}
                
                <div className="mb-6 md:mb-8 border-b border-white/5 pb-6">
                  {course.originalPrice && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm md:text-base text-gray-500 line-through font-semibold">{course.originalPrice}</span>
                      {course.discountText && (
                        <span className="text-[10px] md:text-xs font-black text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {course.discountText}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{course.price}</span>
                    <span className="text-xs md:text-sm text-gray-500 font-medium mb-1.5">/ {course.duration}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8 flex-1">
                  {course.syllabus?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
                      <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${course.highlight ? 'text-emerald-500' : 'text-blue-500'} shrink-0 mt-0.5`} /> 
                      {item}
                    </div>
                  ))}
                </div>

                {course.couponCode && (
                  <div className="mb-5 bg-white/5 border border-dashed border-emerald-500/50 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Use Code:</span>
                    </div>
                    <span className="text-sm font-black text-emerald-400 tracking-wider group-hover:scale-105 transition-transform">
                      {course.couponCode}
                    </span>
                  </div>
                )}
                
                {course.status === "Available Now" || course.status === "Available" ? (
                  <Link href={`/checkout/${course.courseId}`} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 text-sm md:text-base ${course.highlight ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                    Initialize Enrollment
                  </Link>
                ) : (
                  <a href="#early-bird" className="w-full py-4 rounded-xl font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all text-sm flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Early Register
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= EARLY BIRD REGISTRATION ================= */}
      <section id="early-bird" className="py-12 md:py-16 px-4 md:px-6 max-w-6xl mx-auto relative z-10 scroll-mt-24">
        <div className="bg-gradient-to-br from-blue-950/40 to-[#020604] border border-blue-500/20 rounded-3xl md:rounded-[2.5rem] p-6 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-[80px]" />
          
          <div className="flex-1 text-center md:text-left relative z-10 w-full">
            <h3 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 tracking-tight">Advance Reservation for <br className="hidden md:block"/><span className="text-blue-400">All NCISM Subjects</span></h3>
            <p className="text-gray-400 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Foundational & Clinical subjects across 1st, 2nd, and 3rd Prof are in high-quality production. Secure your spot at zero cost today and receive a guaranteed <strong className="text-white">50% Grant</strong> upon launch.
            </p>
          </div>
          
          <div className="w-full md:w-[420px] bg-black/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl relative z-10">
            <form className="space-y-4" onSubmit={handleEarlyBirdSubmit}>
              <input type="text" placeholder="Dr. / Scholar Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
              <input type="tel" placeholder="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
              
              <div className="relative">
                <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required className="w-full bg-[#0a100d] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-gray-300 focus:border-blue-500 outline-none transition-colors appearance-none">
                  <option value="" disabled>Select Academic Subject / Bundle</option>
                  
                  <optgroup label="BAMS 1st Professional" className="bg-[#020604] text-white font-bold">
                    <option value="1st_prof_complete" className="font-normal text-gray-300">Complete 1st Prof Bundle</option>
                    <option value="rachana_sharir" className="font-normal text-gray-300">Rachana Sharir (Anatomy)</option>
                    <option value="kriya_sharir" className="font-normal text-gray-300">Kriya Sharir (Physiology)</option>
                    <option value="padartha_vigyan" className="font-normal text-gray-300">Padartha Vigyan</option>
                    <option value="sanskrit" className="font-normal text-gray-300">Sanskrit</option>
                  </optgroup>
                  
                  <optgroup label="BAMS 2nd Professional" className="bg-[#020604] text-white font-bold mt-2">
                    <option value="2nd_prof_complete" className="font-normal text-gray-300">Complete 2nd Prof Bundle</option>
                    <option value="dravyaguna" className="font-normal text-gray-300">Dravyaguna Vigyan</option>
                    <option value="roga_nidan" className="font-normal text-gray-300">Roga Nidan evam Vikriti Vigyan</option>
                    <option value="rasashastra" className="font-normal text-gray-300">Rasashastra & Bhaishajya Kalpana</option>
                    <option value="agad_tantra" className="font-normal text-gray-300">Agad Tantra</option>
                  </optgroup>

                  <optgroup label="BAMS 3rd Professional" className="bg-[#020604] text-white font-bold mt-2">
                    <option value="3rd_prof_complete" className="font-normal text-gray-300">Complete 3rd Prof Bundle</option>
                    <option value="kayachikitsa" className="font-normal text-gray-300">Kayachikitsa</option>
                    <option value="panchakarma" className="font-normal text-gray-300">Panchakarma</option>
                    <option value="shalya_tantra" className="font-normal text-gray-300">Shalya Tantra</option>
                    <option value="shalakya_tantra" className="font-normal text-gray-300">Shalakya Tantra</option>
                    <option value="prasuti_stri_roga" className="font-normal text-gray-300">Prasuti Tantra & Stri Roga</option>
                    <option value="kaumarbhritya" className="font-normal text-gray-300">Kaumarbhritya</option>
                    <option value="swasthavritta" className="font-normal text-gray-300">Swasthavritta</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 md:py-4 rounded-xl transition-all mt-2 flex items-center justify-center gap-2 text-sm md:text-base">
                {isSubmitting ? "Registering..." : "Secure Priority Access"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================= FAQ & FOOTER ================= */}
      <section id="faq" className="py-16 md:py-24 px-4 md:px-6 max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Academic <span className="text-emerald-400">Inquiries</span></h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors">
              <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 md:p-6 text-left">
                <span className="font-bold text-gray-200 text-sm md:text-base pr-4 leading-snug">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 transition-transform shrink-0 ${activeFaq === i ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="p-5 md:p-6 pt-0 text-sm md:text-base text-gray-400 leading-relaxed border-t border-white/5 mt-2">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#010402] py-8 md:py-10 px-6 text-center text-xs md:text-sm font-medium text-gray-600 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} AyushGyaan Academy. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="#" className="hover:text-emerald-400 transition-colors">Refund Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}