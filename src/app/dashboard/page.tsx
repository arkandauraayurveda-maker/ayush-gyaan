"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useSessionMonitor } from "@/hooks/useSessionMonitor"; // 🛡️ Security Hook Imported
import { 
  BookOpen, Brain, Sparkles, LogOut, LayoutDashboard, 
  Settings, PlayCircle, Lock, CheckCircle2, UserCircle 
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");
  const [isLoading, setIsLoading] = useState(true);

  // 🛡️ Activate Security Monitoring (Auto-logout on inactivity/offline)
  useSessionMonitor();

  // Authentication Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // In a real app, fetch user name and purchased courses from MongoDB here
        setUserName(user.displayName || user.email?.split("@")[0] || "Student");
        setIsLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Mock Data: Purchased vs Locked Courses (Will come from DB later)
  const myCourses = [
    {
      id: "course_1",
      title: "Charak Samhita (Sutrasthana)",
      progress: 45,
      isPurchased: true,
      color: "from-emerald-500/20 to-emerald-900/20",
    },
    {
      id: "course_2",
      title: "BAMS 1st Prof. Notes Masterclass",
      progress: 12,
      isPurchased: true,
      color: "from-blue-500/20 to-blue-900/20",
    },
    {
      id: "course_3",
      title: "Rachana Sharir 3D Anatomy",
      progress: 0,
      isPurchased: false,
      color: "from-amber-500/20 to-amber-900/20",
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030705] flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030705] text-white flex flex-col md:flex-row font-sans selection:bg-emerald-500/30">
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-72 bg-[#050B08]/80 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Link href="/" className="flex items-center gap-2 mb-12 group">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">Ayush<span className="text-emerald-400">Gyaan</span></span>
        </Link>

        <nav className="flex flex-col gap-2 flex-1">
          <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold transition-all">
            <LayoutDashboard className="w-5 h-5" /> My Study Room
          </button>
          <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-all">
            <Brain className="w-5 h-5" /> AI Shloka Decoder
          </button>
          <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-all">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
              <UserCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white capitalize">{userName}</p>
              <p className="text-xs text-gray-500">Premium Scholar</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-all text-sm">
            <LogOut className="w-4 h-4" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 md:p-10 pb-28 md:pb-10 overflow-y-auto z-10 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Ayush<span className="text-emerald-400">Gyaan</span></span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
            <UserCircle className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Welcome back, <span className="text-emerald-400 capitalize">{userName}</span></h1>
          <p className="text-gray-400 mb-10">Continue your Ayurvedic journey from where you left off.</p>
        </motion.div>

        {/* AI Quick Action Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="w-full bg-gradient-to-r from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-[2rem] p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-emerald-500/30">
              <Brain className="w-3.5 h-3.5" /> Powered by AI
            </div>
            <h2 className="text-2xl font-bold mb-2">Stuck on a Shloka?</h2>
            <p className="text-sm text-gray-300 max-w-md">Open the AI Decoder to instantly get Padacheda, Anvaya, and translations for any Samhita.</p>
          </div>
          <button className="relative z-10 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 w-full md:w-auto justify-center">
            <Sparkles className="w-4 h-4" /> Launch Decoder
          </button>
        </motion.div>

        {/* Courses Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Courses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myCourses.map((course, i) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
              className={`relative bg-[#050B08]/80 backdrop-blur-md border rounded-[2rem] p-2 overflow-hidden flex flex-col transition-all duration-300 ${
                course.isPurchased ? "border-white/10 hover:border-emerald-500/30 group cursor-pointer" : "border-white/5 opacity-80 grayscale-[30%]"
              }`}
            >
              {/* Image Placeholder */}
              <div className={`w-full h-40 rounded-[1.5rem] bg-gradient-to-br ${course.color} relative flex items-center justify-center mb-4`}>
                {!course.isPurchased && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-[1.5rem] flex items-center justify-center z-10">
                    <div className="bg-black/60 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                      <Lock className="w-4 h-4 text-gray-300" /> <span className="text-xs font-bold text-gray-300">Locked</span>
                    </div>
                  </div>
                )}
                <BookOpen className={`w-12 h-12 ${course.isPurchased ? 'text-white/30 group-hover:scale-110 transition-transform duration-500' : 'text-white/10'}`} />
              </div>

              {/* Content */}
              <div className="px-4 pb-4 flex flex-col flex-1">
                <h3 className={`text-lg font-bold mb-4 line-clamp-2 ${course.isPurchased ? 'text-white group-hover:text-emerald-400 transition-colors' : 'text-gray-400'}`}>
                  {course.title}
                </h3>
                
                <div className="mt-auto">
                  {course.isPurchased ? (
                    <div>
                      <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-emerald-400">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <button className="w-full mt-5 bg-white/10 group-hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                        <PlayCircle className="w-4 h-4" /> Continue Reading
                      </button>
                    </div>
                  ) : (
                    <button className="w-full mt-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      Unlock Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#030705]/95 backdrop-blur-xl border-t border-white/10 z-50 px-6 py-4 flex justify-between items-center pb-safe">
        <button className="flex flex-col items-center gap-1 text-emerald-400">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
          <Brain className="w-6 h-6" />
          <span className="text-[10px] font-medium">AI Decoder</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-500/80 hover:text-red-400 transition-colors">
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

    </div>
  );
}