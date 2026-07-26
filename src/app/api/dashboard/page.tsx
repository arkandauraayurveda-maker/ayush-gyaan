"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, BookOpen, Lock, Unlock, UserCircle } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login"); // Agar login nahi hai, toh wapas bhej do
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[150px] -z-10" />

      {/* Top Navigation Bar */}
      <nav className="glass-panel px-6 py-4 flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
            AyushGyaan Kaksha
          </h1>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-gray-300">
            <UserCircle className="w-5 h-5 text-accent" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-950/30 px-3 py-2 rounded-lg border border-red-900/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Prasthan (Logout)</span>
          </button>
        </div>
      </nav>

      {/* Courses Section */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">BAMS 1st Professional</h2>
          <p className="text-gray-400 text-sm">NCISM naye syllabus ke anusar aapke vishay.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Samhita Adhyayan Course Card */}
          <motion.div 
            whileHover={{ y: -5, boxShadow: "0 0 20px rgba(0, 255, 136, 0.2)" }}
            className="glass-panel p-6 flex flex-col h-full relative group overflow-hidden"
          >
            {/* Premium Gold Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent to-primary" />
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              {/* Paid Status Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-gray-700 text-xs text-gray-400">
                <Lock className="w-3 h-3 text-accent" />
                Locked (Paid)
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Samhita Adhyayan - I
            </h3>
            <p className="text-sm text-gray-400 mb-4 flex-1">
              Charak Samhita (Sutrasthana 1-12) aur Ashtang Hridaya (1-15). AI-powered shloka, padacheda, anvaya aur vimarsh ke sath.
            </p>

            <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-all flex justify-center items-center gap-2">
              Unlock Course
            </button>
          </motion.div>

          {/* Coming Soon Card Example */}
          <div className="glass-panel p-6 flex flex-col h-full opacity-60 border-dashed border-gray-600">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">
              Padartha Vigyan
            </h3>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              Ayurvedic fundamental principles and philosophy. (Coming Soon)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}