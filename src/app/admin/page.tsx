"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// 🧩 Admin Components Import
import Sidebar from "./components/Sidebar";
import SamhitaManagerTab from "./components/SamhitaManagerTab"; 
import CourseManagerTab from "./components/CourseManagerTab";
import LeadsManagerTab from "./components/LeadsManagerTab";
import StudentSubscriptionManagerTab from "./components/StudentSubscriptionManagerTab";
import CouponManagerTab from "./components/CouponManagerTab";
import InstitutionManagerTab from "./components/InstitutionManagerTab";
import ChatAnalyticsTab from "./components/ChatAnalyticsTab";
import GlobalSettingsTab from "./components/GlobalSettingsTab";
import CoAdminManagerTab from "./components/CoAdminManagerTab";
import AICostIntelligenceTab from "./components/AICostIntelligenceTab";

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>("SAMHITA");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace("/login?redirect=/admin");
        return;
      }

      // 🔒 1. MAIN SUPER ADMIN CHECK
      if (user.email === "jkdewasi961096@gmail.com") {
        setIsMainAdmin(true);
        setIsAdminAuthorized(true);
        return;
      }

      // 🔒 2. CO-ADMIN & REGULAR ADMIN CHECK FROM SERVER
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.user) {
          const role = data.user.role;
          const userAllowedTabs: string[] = data.user.allowedAdminTabs || [];

          if (role === "co-admin" || role === "admin") {
            setIsMainAdmin(false);
            setAllowedTabs(userAllowedTabs);
            setIsAdminAuthorized(true);

            // Set initial active tab to first allowed tab
            if (userAllowedTabs.length > 0 && !userAllowedTabs.includes(activeTab)) {
              setActiveTab(userAllowedTabs[0]);
            }
            return;
          }
        }
      } catch (e) {
        console.error("Failed to verify co-admin status", e);
      }

      // Unauthorized fallback -> redirect to student dashboard
      router.replace("/dashboard");
    });

    return () => unsubscribe();
  }, [router]);

  // Tab switcher wrapper with strict client-side permission enforcement
  const handleTabChange = (newTab: string) => {
    if (isMainAdmin) {
      setActiveTab(newTab);
      return;
    }

    if (allowedTabs.includes(newTab)) {
      setActiveTab(newTab);
    }
  };

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#030705] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">Verifying Admin Permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row gap-6 bg-[#020604] text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/10 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-900/10 blur-[150px] -z-10" />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        isMainAdmin={isMainAdmin}
        allowedTabs={allowedTabs}
      />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto pr-2 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          
          {/* Main Admin Only Tab */}
          {isMainAdmin && activeTab === "CO_ADMIN_MANAGER" && (
            <CoAdminManagerTab key="co_admin_manager" />
          )}

          {/* Granular Allowed Tabs */}
          {(isMainAdmin || allowedTabs.includes("SAMHITA")) && activeTab === "SAMHITA" && (
            <SamhitaManagerTab key="samhita" />
          )}

          {(isMainAdmin || allowedTabs.includes("COURSES")) && activeTab === "COURSES" && (
            <CourseManagerTab key="courses" />
          )}

          {(isMainAdmin || allowedTabs.includes("LEADS")) && activeTab === "LEADS" && (
            <LeadsManagerTab key="leads" />
          )}

          {(isMainAdmin || allowedTabs.includes("STUDENTS")) && (activeTab === "STUDENTS" || activeTab === "SUBSCRIPTIONS") && (
            <StudentSubscriptionManagerTab key="students_sub" />
          )}

          {(isMainAdmin || allowedTabs.includes("COUPONS")) && activeTab === "COUPONS" && (
            <CouponManagerTab key="coupons" />
          )}

          {(isMainAdmin || allowedTabs.includes("INSTITUTIONS")) && activeTab === "INSTITUTIONS" && (
            <InstitutionManagerTab key="institutions" />
          )}

          {(isMainAdmin || allowedTabs.includes("AI_CHAT_LOGS")) && activeTab === "AI_CHAT_LOGS" && (
            <ChatAnalyticsTab key="ai_logs" />
          )}

          {(isMainAdmin || allowedTabs.includes("AI_CHAT_LOGS")) && activeTab === "AI_COST_INTELLIGENCE" && (
            <AICostIntelligenceTab key="ai_cost_intelligence" />
          )}

          {(isMainAdmin || allowedTabs.includes("GLOBAL_SETTINGS")) && activeTab === "GLOBAL_SETTINGS" && (
            <GlobalSettingsTab key="global_settings" />
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}