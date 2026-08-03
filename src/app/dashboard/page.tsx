"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PlanOverview from "@/components/dashboard/PlanOverview";
import UpgradeSection from "@/components/dashboard/UpgradeSection";
import CourseHub from "@/components/dashboard/CourseHub";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      // Force token refresh to prevent expired token issues
      const token = await user.getIdToken(true);
      
      const response = await fetch("/api/user/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
      } else {
        if (response.status === 401) {
          router.push("/login");
        } else {
          setError(data.error || "Failed to load dashboard data.");
        }
      }
    } catch (err) {
      setError("Network connection error. Please check your internet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDashboardData();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#020604]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/80 text-xs font-semibold tracking-widest uppercase">
          Securing Workspace...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-white font-bold text-lg mb-1">Unable to Load Dashboard</h3>
        <p className="text-gray-400 text-xs max-w-sm mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* 1. Header Component */}
      <DashboardHeader name={userData?.name} tier={userData?.aiPlan?.tier} />

      {/* 2. Plan Overview & Upgrade Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PlanOverview aiPlan={userData?.aiPlan} />
        </div>
        <div className="lg:col-span-2">
          <UpgradeSection currentTier={userData?.aiPlan?.tier} />
        </div>
      </div>

      {/* 3. Course Hub (Enrolled & Explore) */}
      <div className="pt-4 border-t border-emerald-900/30">
        <CourseHub enrolledCourses={userData?.courses || []} />
      </div>
    </div>
  );
}