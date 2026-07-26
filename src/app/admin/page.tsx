"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// 🧩 Components Import
import Sidebar from "./components/Sidebar";
import AutoPilotTab from "./components/AutoPilotTab";
import PendingReviewTab from "./components/PendingReviewTab";
import LiveDatabaseTab from "./components/LiveDatabaseTab";
import CourseManagerTab from "./components/CourseManagerTab";
import LeadsManagerTab from "./components/LeadsManagerTab";
import StudentManagerTab from "./components/StudentManagerTab";
import CouponManagerTab from "./components/CouponManagerTab";
import InstitutionManagerTab from "./components/InstitutionManagerTab";

export default function AdminDashboard() {
  const router = useRouter();
  
  // States
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"EXTRACT" | "REVIEW" | "DATABASE" | "STUDENTS" | "COURSES" | "LEADS" | "COUPONS" | "INSTITUTIONS">("EXTRACT");
  // 🔒 Security Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === "jkdewasi961096@gmail.com") {
        setIsAdminAuthorized(true);
      } else {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#030705] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // 🎨 Main Shell UI
  return (
    <div className="min-h-screen p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row gap-6">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 blur-[150px] -z-10" />

      {/* 🧩 1. The Extracted Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 🧩 2. Dynamic Content Area (The Switcher) */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto pr-2 no-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === "EXTRACT" && <AutoPilotTab key="extract" />}
          {activeTab === "REVIEW" && <PendingReviewTab key="review" />}
          {activeTab === "DATABASE" && <LiveDatabaseTab key="database" />}
          {activeTab === "COURSES" && <CourseManagerTab key="courses" />}
          {activeTab === "LEADS" && <LeadsManagerTab key="leads" />}
          {activeTab === "STUDENTS" && <StudentManagerTab key="students" />}
          {activeTab === "COUPONS" && <CouponManagerTab key="coupons" />}
          {activeTab === "INSTITUTIONS" && <InstitutionManagerTab key="institutions" />}

        </AnimatePresence>
      </main>
    </div>
  );
}