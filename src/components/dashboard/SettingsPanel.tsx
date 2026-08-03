"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User, Mail, Shield } from "lucide-react";

export default function SettingsPanel() {
  const [userProfile, setUserProfile] = useState({ name: "", email: "" });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserProfile({ name: user.displayName || "Scholar", email: user.email || "" });
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your AyushGyaan profile and preferences.</p>
      </div>

      <div className="bg-[#0A1410] border border-emerald-900/30 rounded-3xl p-8 space-y-8">
        
        {/* Profile Section */}
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald-400" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
              <div className="px-4 py-3 bg-[#050B08] border border-emerald-900/20 rounded-xl text-gray-200">
                {userProfile.name}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <div className="px-4 py-3 bg-[#050B08] border border-emerald-900/20 rounded-xl text-gray-400 cursor-not-allowed">
                {userProfile.email}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-emerald-900/20"></div>

        {/* Security Section */}
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" /> Security
          </h2>
          <div className="flex items-center justify-between p-4 bg-[#050B08] border border-emerald-900/20 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Password Authentication</p>
              <p className="text-xs text-gray-500 mt-1">Managed securely by Firebase.</p>
            </div>
            <button className="px-4 py-2 bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold hover:bg-emerald-900/50 transition-colors">
              Reset Password
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}