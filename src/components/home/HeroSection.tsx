"use client";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import AIChatSimulator from "./AIChatSimulator"; // 🔥 Naya AI Simulator Import kiya

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-32 px-4 md:px-6 flex flex-col items-center justify-center z-10 min-h-[95vh]">
      
      {/* Top Layout: Text on Left, Simulator on Right (for Desktop) */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10 w-full">
        
        {/* Left Side: Main Headline */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-xl text-emerald-300 px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold mb-6 md:mb-8 shadow-xl uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> 100% NCISM Compliant Curriculum
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1] md:leading-[1.05] text-white">
            Master BAMS with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600">Clinical Precision.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto lg:mx-0 mb-10 md:mb-12 leading-relaxed">
            India&apos;s first AI-powered academic ecosystem for Ayurvedic scholars. Decode Samhitas, track clinical proficiency, and study seamlessly without distractions.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-5 w-full sm:w-auto">
            <a href="#curriculum" className="w-full sm:w-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-500 hidden sm:block"></div>
              <div className="relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 sm:bg-[#020604] border border-emerald-500/50 text-white px-8 py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold flex items-center justify-center gap-3 transition-transform sm:group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 shadow-xl">
                Enroll in Academy <ArrowRight className="w-5 h-5" />
              </div>
            </a>
            <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-2 sm:mt-0">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> 5-Day Money-Back Guarantee
            </div>
          </motion.div>
        </div>

        {/* Right Side: Our new AI Chat Simulator */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="flex-1 w-full max-w-md lg:max-w-none flex justify-center lg:justify-end">
          <AIChatSimulator />
        </motion.div>
      </div>

      {/* Marquee Scroller */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full mt-16 md:mt-24 border-y border-white/5 bg-white/[0.01] py-4 md:py-6 flex overflow-hidden whitespace-nowrap mask-gradient">
        <div className="animate-marquee inline-flex gap-8 md:gap-16 items-center text-xs md:text-sm font-bold text-gray-600 uppercase tracking-widest px-4 md:px-8">
          <span>Trusted by Scholars from</span> • <span>NIA Jaipur</span> • <span>ITRA Jamnagar</span> • <span>BHU Varanasi</span> • <span>CBPACS New Delhi</span> • <span>AIIA Delhi</span> • <span>Trusted by Scholars from</span> • <span>NIA Jaipur</span> • <span>ITRA Jamnagar</span> • <span>BHU Varanasi</span>
        </div>
      </motion.div>
    </section>
  );
}