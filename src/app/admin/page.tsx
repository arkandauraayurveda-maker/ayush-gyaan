"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// 🧩 Components Import
import Sidebar from "./components/Sidebar";
import SamhitaManagerTab from "./components/SamhitaManagerTab"; 
import CourseManagerTab from "./components/CourseManagerTab";
import LeadsManagerTab from "./components/LeadsManagerTab";
import StudentSubscriptionManagerTab from "./components/StudentSubscriptionManagerTab";
import CouponManagerTab from "./components/CouponManagerTab";
import InstitutionManagerTab from "./components/InstitutionManagerTab";
// 🔥 AI TABS IMPORTED
import ChatAnalyticsTab from "./components/ChatAnalyticsTab";
import GlobalSettingsTab from "./components/GlobalSettingsTab";

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"SAMHITA" | "STUDENTS" | "COURSES" | "LEADS" | "COUPONS" | "INSTITUTIONS" | "AI_CHAT_LOGS" | "GLOBAL_SETTINGS" | "SUBSCRIPTIONS">("SAMHITA");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // 🔒 CURRENT SECURITY: Only your specific email can access this page
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
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row gap-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/10 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-900/10 blur-[150px] -z-10" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto pr-2 no-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === "SAMHITA" && <SamhitaManagerTab key="samhita" />}
          {activeTab === "COURSES" && <CourseManagerTab key="courses" />}
          {activeTab === "LEADS" && <LeadsManagerTab key="leads" />}
          {(activeTab === "STUDENTS" || activeTab === "SUBSCRIPTIONS") && <StudentSubscriptionManagerTab key="students_sub" />}
          {activeTab === "COUPONS" && <CouponManagerTab key="coupons" />}
          {activeTab === "INSTITUTIONS" && <InstitutionManagerTab key="institutions" />}
          
          {/* 🔥 AI TABS RENDER LOGIC */}
          {activeTab === "AI_CHAT_LOGS" && <ChatAnalyticsTab key="ai_logs" />}
          {activeTab === "GLOBAL_SETTINGS" && <GlobalSettingsTab key="global_settings" />}
        </AnimatePresence>
      </main>
    </div>
  );
}