"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "919772852668";
  const defaultMessage = encodeURIComponent("नमस्ते आयुष-ज्ञान टीम! मुझे BAMS कोर्स एवं AI स्टडी गाइडेंस के संबंध में जानकारी चाहिए।");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white px-4 py-3 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/30 group transition-all"
      aria-label="Contact Student Support on WhatsApp (+91-9772852668)"
      title="24/7 Student Help (+91-9772852668)"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[11px] font-bold tracking-tight leading-none text-white">Student Support</span>
        <span className="text-[9px] text-emerald-100 font-medium leading-tight opacity-90">+91-9772852668</span>
      </div>
    </motion.a>
  );
}
