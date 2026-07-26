"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function useSessionMonitor() {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Minutes in milliseconds

    const handleLogout = async (reason: string) => {
      console.log(`Security Protocol Triggered: Logging out due to ${reason}`);
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    // Reset timer on any user activity
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleLogout("30 Minutes of Inactivity"), INACTIVITY_LIMIT);
    };

    // Trigger logout on network disconnect
    const handleOffline = () => {
      handleLogout("Network Disconnect");
    };

    // Listen for User Activities (Desktop & Mobile)
    const activityEvents = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));
    window.addEventListener("offline", handleOffline);

    // Initialize timer
    resetTimer();

    // Cleanup listeners on unmount
    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);
}