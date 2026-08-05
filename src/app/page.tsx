"use client";
import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesBento from "@/components/home/FeaturesBento";
import CurriculumPricing from "@/components/home/CurriculumPricing";
import EarlyBirdLeadForm from "@/components/home/EarlyBirdLeadForm";
import FAQFooter from "@/components/home/FAQFooter";
import GalaxyBackground from "@/components/home/GalaxyBackground";
import WhatsAppButton from "@/components/home/WhatsAppButton";
import FloatingAIChat from "@/components/home/FloatingAIChat";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020604] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      
      {/* 🌌 3D STAR & GALAXY BACKGROUND */}
      <GalaxyBackground />

      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] bg-teal-600/10 rounded-full blur-[120px] md:blur-[150px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] bg-emerald-700/10 rounded-full blur-[150px] md:blur-[180px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      {/* ================= COMPONENT ASSEMBLY ================= */}
      <Navbar />
      <HeroSection />
      <FeaturesBento />
      <CurriculumPricing />
      <EarlyBirdLeadForm />
      <FAQFooter />

      {/* 🟢 FLOATING WHATSAPP SUPPORT (+91-9772852668) */}
      <WhatsAppButton />

      {/* 🚀 FLOATING AI CHATBOT UI */}
      <FloatingAIChat />

    </div>
  );
}