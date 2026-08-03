"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // आपका Firebase Auth
import FloatingAIChat from "./home/FloatingAIChat"; // आपका चैटबॉट
import { usePathname } from "next/navigation";

export default function GlobalChatBot() {
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Firebase Auth Listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid); // यूज़र लॉगिन है तो उसका ID सेट करें
      } else {
        setUserId(null); // लॉगिन नहीं है तो null
      }
    });

    return () => unsubscribe();
  }, []);

  // 🛑 एडमिन पैनल पर चैटबॉट नहीं दिखाना है
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* अगर यूज़र लॉगिन है तो उसकी ID पास होगी, वरना 'guest_user' जाएगा (जो हमने FloatingAIChat में डिफ़ॉल्ट सेट किया था) */}
      <FloatingAIChat userId={userId || "guest_user"} />
    </>
  );
}