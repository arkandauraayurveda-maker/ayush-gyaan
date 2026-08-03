"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Camera, Mic, BarChart3, BookOpen, PlayCircle, Sparkles } from "lucide-react";

// 🧠 ULTRA-PREMIUM WIDE TYPEWRITER
const AITypewriter = () => {
  const [displayedText, setDisplayedText] = useState("");

  const content = [
    { title: "॥ मूल श्लोक ॥", text: "हेतुलिङ्गौषधज्ञानं स्वस्थातुरपरायणम्।\nत्रिसूत्रं शाश्वतं पुण्यं बुबुधे यं पितामहः ॥२४॥\n\n" },
    { title: "॥ पदच्छेद (Padacheda) ॥", text: "हेतु-लिङ्ग-औषध-ज्ञानं स्वस्थ-आतुर-परायणम्।\nत्रिसूत्रं शाश्वतं पुण्यं बुबुधे यं पितामहः ॥२४॥\n\n" },
    { title: "॥ हिंदी भावार्थ ॥", text: "स्वस्थ व्यक्तियों के स्वास्थ्य की रक्षा करने वाला और आतुरों (रोगियों) के विकारों को शांत करने के लिए जो परम मार्ग स्वरूप है; जिसमें हेतु, लिंग और औषध का ज्ञान समाहित है; जो सनातन और अत्यंत पुण्यकारी है; तथा जिसे सर्वप्रथम ब्रह्मा जी ने जाना था, वही 'त्रिसूत्र' आयुर्वेद है।" }
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
        setTimeout(() => { isPaused = false; }, 1000);
      }
    };

    typeWriter = setInterval(typeNextChar, 35); 
    return () => clearInterval(typeWriter);
  }, []);

  return (
    <div className="relative mt-4 h-[21rem] md:h-[22rem] rounded-3xl overflow-hidden p-[1px] group w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 via-transparent to-teal-500/40 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative h-full w-full bg-[#030a07]/60 backdrop-blur-2xl rounded-3xl p-4 md:p-6 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-3 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Charak Samhita AI</h4>
            <p className="text-[9px] text-emerald-400 font-bold tracking-wider">Sutrasthana • Chapter 1</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth pr-2">
          <div className="text-[13px] md:text-[15px] font-medium text-emerald-50/90 leading-[1.8] tracking-wide whitespace-pre-wrap transition-all">
            {displayedText}
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 md:w-2.5 h-4 md:h-4 bg-emerald-400 ml-1 align-middle shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturesBento() {
  const chartOpacities = [0.2, 0.5, 0.8, 0.3, 0.9, 0.4, 0.7, 0.6, 1.0, 0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 0.8];

  return (
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
  );
}