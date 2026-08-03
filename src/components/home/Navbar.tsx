"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Fingerprint, Menu, X, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase"; // 🔥 Firebase Auth import kiya

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // 🔥 User state

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 Check if user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 Smart Routing Logic
  const portalLink = currentUser 
    ? (currentUser.email === "jkdewasi961096@gmail.com" ? "/admin" : "/dashboard") 
    : "/login";
    
  const portalText = currentUser ? "Go to Dashboard" : "Access Portal";

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "py-2 md:py-4" : "py-4 md:py-6"}`}>
      <div className={`max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between transition-all duration-500 ${isScrolled ? "bg-[#050B08]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:rounded-2xl py-3 px-4 md:px-6" : ""}`}>
        <Link href="/" className="flex items-center gap-2 group z-50">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 md:p-2 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-white">Ayush<span className="text-emerald-400">Gyaan</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors tracking-wide">Platform</a>
          <a href="#curriculum" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors tracking-wide">Curriculum</a>
          
          {/* 🔥 DYNAMIC DESKTOP BUTTON */}
          <Link href={portalLink} className="relative group ml-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
            <div className="relative bg-[#020604] border border-white/10 px-6 py-2.5 rounded-full text-sm font-bold text-white group-hover:border-emerald-500/50 transition-colors flex items-center gap-2">
              {currentUser ? <LayoutDashboard className="w-4 h-4 text-emerald-400" /> : <Fingerprint className="w-4 h-4 text-emerald-400" />} 
              {portalText}
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
            
            {/* 🔥 DYNAMIC MOBILE BUTTON */}
            <Link href={portalLink} onClick={() => setIsMobileMenuOpen(false)} className="bg-emerald-600 text-white text-center py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-2">
              {currentUser ? <LayoutDashboard className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />} 
              {portalText}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}