"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BookOpen, Settings, LogOut, Sparkles, Loader2, Menu, X } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🛡️ Route Protection & Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login"); // Redirect unauthorized users
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const navLinks = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Courses", path: "/dashboard/courses", icon: BookOpen },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/70 text-sm tracking-widest uppercase font-semibold">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020604] text-white overflow-hidden">
      
      {/* 📱 Mobile Navbar (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-[#050B08]/90 backdrop-blur-xl border-b border-emerald-900/30 z-50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-lg tracking-wide text-gray-100">AyushGyaan</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 hover:text-emerald-400">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 🖥️ Desktop Sidebar / Mobile Dropdown Menu */}
      <AnimatePresence>
        {(isMobileMenuOpen || typeof window !== "undefined" && window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#050B08] border-r border-emerald-900/30 flex flex-col pt-20 md:pt-6"
          >
            <div className="hidden md:flex items-center gap-3 px-6 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AyushGyaan</span>
            </div>

            <nav className="flex-1 px-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link key={link.name} href={link.path} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:bg-gray-900/50 hover:text-gray-200"}`}>
                      <link.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-gray-500"}`} />
                      <span className="font-medium text-sm">{link.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-emerald-900/30">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 🚀 Main Content Area */}
      <main className="flex-1 flex flex-col relative pt-16 md:pt-0 max-h-screen overflow-y-auto custom-scrollbar">
        {/* Glow Effect behind content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-emerald-900/20 blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
}