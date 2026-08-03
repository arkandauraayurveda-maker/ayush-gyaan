"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2, UserCircle, Phone, GraduationCap, Building2, ArrowRight, School, User } from "lucide-react";

// 🛠️ FIX: पूरा लॉजिक एक अलग कंपोनेंट (OnboardingContent) में डाल दिया गया है
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🏛️ Institutions Data State
  const [institutionsList, setInstitutionsList] = useState<any[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  // 📝 Dynamic Form States
  const [name, setName] = useState(""); // 🔥 NEW: Student Name State
  const [mobile, setMobile] = useState("");
  const [course, setCourse] = useState("BAMS");
  const [batchYear, setBatchYear] = useState("");
  
  // University & College States
  const [selectedUni, setSelectedUni] = useState("");
  const [otherUni, setOtherUni] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [otherCollege, setOtherCollege] = useState("");

  useEffect(() => {
    // 1. Firebase Auth & Sync Logic
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.replace(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login");
        return;
      }

      try {
        const userRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || "" })
        });
        const userData = await userRes.json();
        
        if (userData.success && userData.user.isOnboarded) {
          if (redirectUrl && redirectUrl !== "undefined" && redirectUrl !== "null") {
            router.replace(redirectUrl);
          } else {
            router.replace("/dashboard");
          }
          return;
        }
      } catch (error) {
        console.error("Sync error:", error);
      }

      setUser(currentUser);
      setName(currentUser.displayName || ""); // 🔥 NEW: Firebase से डिफ़ॉल्ट नाम सेट करना
      setLoading(false);
    });

    // 2. Fetch Institutions from Database
    const fetchInstitutions = async () => {
      try {
        const res = await fetch('/api/institutions'); 
        const data = await res.json();
        if (data.success) {
          setInstitutionsList(data.data); 
        }
      } catch (error) {
        console.error("Failed to fetch institutions:", error);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchInstitutions();

    return () => unsubscribe();
  }, [router, redirectUrl]);

  // Handle University Change
  const handleUniChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uni = e.target.value;
    setSelectedUni(uni);
    setSelectedCollege(""); 
    setOtherCollege("");
    if (uni !== "Other") {
      setOtherUni("");
    }
  };

  const availableColleges = institutionsList.find(inst => inst.university === selectedUni)?.colleges || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    const finalUniversity = selectedUni === "Other" ? otherUni : selectedUni;
    const finalCollege = selectedCollege === "Other" ? otherCollege : selectedCollege;

    if (!finalUniversity || !finalCollege) {
      alert("Please select or enter both University and College.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: name, // 🔥 NEW: अपडेटेड नाम डेटाबेस में सेव होगा
          mobile,
          university: finalUniversity,
          collegeName: finalCollege,
          course,
          batchYear,
          isOnboarded: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (redirectUrl && redirectUrl !== "undefined" && redirectUrl !== "null") {
          router.replace(redirectUrl);
        } else {
          router.replace("/dashboard");
        }
      } else {
        alert(data.error || "Failed to save profile.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong!");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-emerald-400 text-sm font-bold animate-pulse">Setting up your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020604] text-white flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[50vw] h-[50vw] bg-emerald-700/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <main className="relative z-10 w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl mt-10 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Complete Your Profile</h1>
          <p className="text-gray-400 text-sm">Tell us a bit about yourself to unlock the AyushGyaan clinical ecosystem.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 🔥 NEW: Student Name */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4"/> Full Name *
            </label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Enter your full name" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors" 
            />
          </div>

          {/* Email (Disabled) */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <UserCircle className="w-4 h-4"/> Email Address
            </label>
            <input type="text" value={user?.email || ""} disabled className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4"/> Mobile Number *
            </label>
            <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
          </div>

          {/* 🏛️ University Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <School className="w-4 h-4"/> Select University *
            </label>
            
            <select 
              required 
              value={selectedUni} 
              onChange={handleUniChange} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none appearance-none"
            >
              <option value="" disabled>-- Choose your University --</option>
              {loadingInstitutions ? <option disabled>Loading universities...</option> : null}
              {institutionsList.map((inst) => (
                <option key={inst._id} value={inst.university}>{inst.university}</option>
              ))}
              <option value="Other">Other (Not in list)</option>
            </select>

            {selectedUni === "Other" && (
              <input 
                type="text" 
                required 
                value={otherUni} 
                onChange={e => setOtherUni(e.target.value)} 
                placeholder="Enter your University Name" 
                className="w-full bg-emerald-900/20 border border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-400 outline-none transition-colors" 
              />
            )}
          </div>

          {/* 🏫 College Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-4 h-4"/> Select College *
            </label>
            
            <select 
              required 
              value={selectedCollege} 
              onChange={e => setSelectedCollege(e.target.value)} 
              disabled={!selectedUni}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none appearance-none disabled:opacity-50"
            >
              <option value="" disabled>-- Choose your College --</option>
              {availableColleges.map((collegeName: string, i: number) => (
                <option key={i} value={collegeName}>{collegeName}</option>
              ))}
              <option value="Other">Other (Not in list)</option>
            </select>

            {selectedCollege === "Other" && (
              <input 
                type="text" 
                required 
                value={otherCollege} 
                onChange={e => setOtherCollege(e.target.value)} 
                placeholder="Enter your College Name" 
                className="w-full bg-emerald-900/20 border border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-400 outline-none transition-colors" 
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Course */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4"/> Course
              </label>
              <select value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none appearance-none">
                <option value="BAMS">BAMS</option>
                <option value="BHMS">BHMS</option>
                <option value="BUMS">BUMS</option>
                <option value="Practitioner">Practitioner</option>
              </select>
            </div>

            {/* Batch Year */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">Batch Year</label>
              <input type="text" required value={batchYear} onChange={e => setBatchYear(e.target.value)} placeholder="e.g. 2021" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin"/> Updating Profile...</> : <>Get Started <ArrowRight className="w-5 h-5"/></>}
          </button>
        </form>
      </main>
    </div>
  );
}

// 🛠️ FIX: मुख्य पेज को Suspense के अंदर रैप किया गया है
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020604] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-emerald-400 text-sm font-bold animate-pulse">Loading setup...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}