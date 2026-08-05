"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User, Phone, MapPin, Building, GraduationCap, Mail, Save, Loader2, CheckCircle2, Shield, Crown, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [course, setCourse] = useState("BAMS 1st Prof");
  const [batchYear, setBatchYear] = useState("");
  
  // Address States
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Plan info
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [role, setRole] = useState("user");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }
      let token = "";
      try {
        token = await user.getIdToken(false);
      } catch (authErr) {
        console.warn("Firebase token refresh network warning:", authErr);
      }

      const res = await fetch("/api/user/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setMobile(u.mobile || "");
        setCollegeName(u.collegeName || "");
        setCourse(u.course || "BAMS 1st Prof");
        setBatchYear(u.batchYear || "");
        
        if (u.addressDetails) {
          setStreet(u.addressDetails.street || "");
          setCity(u.addressDetails.city || "");
          setState(u.addressDetails.state || "");
          setPincode(u.addressDetails.pincode || "");
        }
        setAiPlan(u.aiPlan);
        setRole(u.role);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          mobile,
          collegeName,
          course,
          batchYear,
          addressDetails: { street, city, state, pincode }
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "✅ Your profile and address details updated successfully!" });
      } else {
        setMessage({ type: "error", text: "⚠️ " + (data.error || "Failed to update profile.") });
      }
    } catch (err) {
      setMessage({ type: "error", text: "⚠️ Network error while saving profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400/80 text-xs font-semibold tracking-widest uppercase">Loading Profile Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-900/30">
            <User className="w-6 h-6 text-white" />
          </div>
          Scholar Profile & Account Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your personal details, academic institution, and contact address.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" 
            : "bg-red-950/40 border-red-500/50 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* ACCOUNT & SUBSCRIPTION OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel border border-emerald-900/30 bg-[#050B08]/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-lg">
            {name ? name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Account Role</div>
            <div className="font-bold text-white text-base capitalize flex items-center gap-2">
              {name || "Ayurvedic Scholar"}
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold uppercase">
                {role}
              </span>
            </div>
            <div className="text-xs text-gray-400">{email}</div>
          </div>
        </div>

        <div className="glass-panel border border-emerald-900/30 bg-[#050B08]/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold text-lg">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Active AI Plan</div>
            <div className="font-bold text-white text-base capitalize flex items-center gap-2">
              Ayush {aiPlan?.tier || "basic"}
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-semibold uppercase">
                {aiPlan?.tokens ?? 10} Tokens
              </span>
            </div>
            <div className="text-xs text-gray-400">Resets daily or updates upon upgrade</div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE & ADDRESS FORM */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* PERSONAL & ACADEMIC DETAILS */}
        <div className="glass-panel border border-gray-800 bg-[#050B08]/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <GraduationCap className="w-5 h-5 text-emerald-400" /> Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Email Address (Read Only)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  disabled 
                  value={email} 
                  className="w-full bg-black/40 border border-gray-800 text-gray-400 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none cursor-not-allowed" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="tel" 
                  placeholder="+91 9876543210" 
                  value={mobile} 
                  onChange={(e) => setMobile(e.target.value)} 
                  className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Ayurvedic College Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="e.g. Government Ayurvedic Medical College" 
                  value={collegeName} 
                  onChange={(e) => setCollegeName(e.target.value)} 
                  className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Course / Prof Year</label>
              <select 
                value={course} 
                onChange={(e) => setCourse(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="BAMS 1st Prof">BAMS 1st Professional</option>
                <option value="BAMS 2nd Prof">BAMS 2nd Professional</option>
                <option value="BAMS 3rd Prof">BAMS 3rd Professional</option>
                <option value="PG / Practitioner">PG Scholar / Practitioner</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Batch / Admission Year</label>
              <input 
                type="text" 
                placeholder="e.g. 2024-2025" 
                value={batchYear} 
                onChange={(e) => setBatchYear(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500" 
              />
            </div>
          </div>
        </div>

        {/* ADDRESS DETAILS SECTION */}
        <div className="glass-panel border border-gray-800 bg-[#050B08]/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <MapPin className="w-5 h-5 text-emerald-400" /> Communication & Dispatch Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Street / House Address</label>
              <input 
                type="text" 
                placeholder="House No., Street Name, Area..." 
                value={street} 
                onChange={(e) => setStreet(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">City</label>
              <input 
                type="text" 
                placeholder="e.g. Jaipur" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">State</label>
              <input 
                type="text" 
                placeholder="e.g. Rajasthan" 
                value={state} 
                onChange={(e) => setState(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Pincode</label>
              <input 
                type="text" 
                placeholder="e.g. 302001" 
                value={pincode} 
                onChange={(e) => setPincode(e.target.value)} 
                className="w-full bg-black/60 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:bg-gray-800 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-sm transition-all"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving Details..." : "Save Profile & Address"}
          </button>
        </div>

      </form>

    </div>
  );
}
