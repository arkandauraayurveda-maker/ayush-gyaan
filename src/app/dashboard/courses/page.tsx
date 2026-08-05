"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { BookOpen, GraduationCap, ArrowRight, Sparkles, Loader2, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setNetworkError(false);

      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      let token = "";
      try {
        token = await user.getIdToken(false);
      } catch (authErr) {
        console.warn("Firebase token fetch network warning:", authErr);
      }

      const res = await fetch("/api/user/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCourses(data.user.courses || []);
      } else {
        if (!data.success && data.isNetworkError) {
          setNetworkError(true);
        }
      }
    } catch (err) {
      console.error("Failed to load courses", err);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/80 text-xs font-semibold tracking-widest uppercase">Loading Enrolled Courses...</p>
      </div>
    );
  }

  const activeCourses = courses.filter((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-900/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            My Enrolled Courses & Samhita Modules
          </h1>
          <p className="text-sm text-gray-400 mt-1">Access your NCISM BAMS Professional Year modules, Shloka reader, and study notes.</p>
        </div>

        {networkError && (
          <button
            onClick={fetchCourses}
            className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 rounded-xl font-semibold hover:bg-emerald-900/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Network Retry
          </button>
        )}
      </div>

      {/* ENROLLED COURSES SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-400" /> Active Subscriptions ({activeCourses.length})
        </h2>

        {activeCourses.length === 0 ? (
          <div className="glass-panel border border-emerald-900/30 bg-[#050B08]/80 p-8 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Active Course Enrolled</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">Explore our NCISM BAMS 1st, 2nd, and 3rd Professional year courses to unlock shloka decoders and video lectures.</p>
            </div>
            <Link 
              href="/#curriculum"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
            >
              Explore Course Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.map((c: any) => (
              <div key={c.courseId} className="glass-panel border border-emerald-900/40 bg-gradient-to-br from-[#0A1410] to-[#030806] p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active Access
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" /> Granted by {c.grantedBy || "SYSTEM"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors uppercase mb-2">
                    {c.courseId} Module
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 line-clamp-2">
                    Complete NCISM BAMS Syllabus, Charak Samhita, Ashtang Hridaya Shloka Decoder with AI assistance.
                  </p>
                </div>

                <Link
                  href={`/samhita?course=${c.courseId}`}
                  className="w-full py-3 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Open Samhita Reader <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACADEMIC NAVIGATION MODULES */}
      <div className="pt-6 border-t border-emerald-900/30">
        <h2 className="text-lg font-bold text-gray-200 mb-4">Quick Study Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/samhita?course=sa1" className="p-5 bg-black/40 border border-gray-800 hover:border-emerald-500/40 rounded-2xl transition-all group">
            <h4 className="font-bold text-white text-sm group-hover:text-emerald-400">Charak Samhita Sutrasthana</h4>
            <p className="text-xs text-gray-400 mt-1">Read, search and listen to shlokas with Padacheda & Vimarsh.</p>
          </Link>
          <Link href="/samhita?course=sa2" className="p-5 bg-black/40 border border-gray-800 hover:border-emerald-500/40 rounded-2xl transition-all group">
            <h4 className="font-bold text-white text-sm group-hover:text-emerald-400">Ashtang Hridaya Reader</h4>
            <p className="text-xs text-gray-400 mt-1">Master basic principles, Sthanas, and Chapters.</p>
          </Link>
          <Link href="/dashboard" className="p-5 bg-black/40 border border-gray-800 hover:border-purple-500/40 rounded-2xl transition-all group">
            <h4 className="font-bold text-white text-sm group-hover:text-purple-400">AI Medical Simulator</h4>
            <p className="text-xs text-gray-400 mt-1">Ask questions, upload clinical case notes & exam papers.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
