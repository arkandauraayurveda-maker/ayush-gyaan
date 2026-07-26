"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Sparkles, ArrowRight, Loader2, UserCircle, MapPin, GraduationCap, Building2, Phone } from "lucide-react";

// 🛠️ FALLBACK DATA (jab tak Admin API ready nahi hoti)
const FALLBACK_INSTITUTIONS = [
  {
    university: "Dr. Sarvepalli Radhakrishnan Rajasthan Ayurved University (DSRRAU)",
    colleges: [
      "University College of Ayurveda, Jodhpur",
      "MMM Govt Ayurved College, Udaipur",
      "Govt Ayurved College, Jaipur",
      "Govt Ayurved College, Bikaner",
      "Govt Ayurved College, Kekri",
      "Govt Ayurved College, Bharatpur",
      "Govt Ayurved College, Kota",
      "Govt Ayurved College, Sikar"
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 🏫 Dynamic Lists States
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  
  // 🎛️ Manual Entry Toggle States
  const [isManualUni, setIsManualUni] = useState(false);
  const [isManualCollege, setIsManualCollege] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    collegeName: "",
    university: "",
    course: "BAMS",
    batchYear: "",
    address: ""
  });

  // 1. Auth Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email || "");
      } else {
        router.push("/login"); // Security check
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Institutions List (Admin Controlled)
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await fetch('/api/institutions');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setInstitutions(data.data);
        } else {
          setInstitutions(FALLBACK_INSTITUTIONS);
        }
      } catch (error) {
        // Fallback agar API abhi nahi bani hai
        setInstitutions(FALLBACK_INSTITUTIONS);
      }
    };
    fetchInstitutions();
  }, []);

  // 3. Normal Input Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. Smart University Selection Logic
  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    
    if (selectedUni === "OTHER") {
      setIsManualUni(true);
      setIsManualCollege(true); // Custom Uni = Custom College naturally
      setAvailableColleges([]);
      setFormData({ ...formData, university: "", collegeName: "" });
    } else {
      setIsManualUni(false);
      setIsManualCollege(false);
      
      // Find colleges for this university
      const found = institutions.find(inst => inst.university === selectedUni);
      if (found) {
        setAvailableColleges(found.colleges);
      } else {
        setAvailableColleges([]);
      }
      
      setFormData({ ...formData, university: selectedUni, collegeName: "" });
    }
  };

  // 5. Smart College Selection Logic
  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCol = e.target.value;
    if (selectedCol === "OTHER") {
      setIsManualCollege(true);
      setFormData({ ...formData, collegeName: "" });
    } else {
      setIsManualCollege(false);
      setFormData({ ...formData, collegeName: selectedCol });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.university || !formData.collegeName) {
      return alert("Please select or enter your University and College.");
    }
    
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      // API Call to save user details (Next Step me banayenge)
      /*
      await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, ...formData, isOnboarded: true })
      });
      */
      
      console.log("Data Submitted:", formData);
      await new Promise(res => setTimeout(res, 1500)); // Simulating delay
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save data:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030705] text-white font-sans selection:bg-emerald-500/30 px-4 py-8 md:py-12 overflow-y-auto">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      <div className="max-w-xl mx-auto relative z-10">
        
        <div className="mb-8 text-center mt-4">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/30 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Complete Your Profile</h1>
          <p className="text-sm text-gray-400">Let's personalize your AyushGyaan experience.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#050B08]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Auto-filled Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Email Address (Auto)</label>
              <input type="email" value={userEmail} disabled className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-base text-gray-500 cursor-not-allowed" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex text-xs font-medium text-gray-400 mb-1.5 pl-1 items-center gap-1"><UserCircle className="w-3 h-3"/> Full Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600" placeholder="Dr. Ayush Sharma" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Mobile Number</label>
                <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600" placeholder="+91 99999 00000" />
              </div>
            </div>

            {/* 🔥 DYNAMIC UNIVERSITY SELECTION 🔥 */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-xs font-medium text-emerald-400 mb-1.5 pl-1 flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Select University</label>
                {!isManualUni ? (
                  <select onChange={handleUniversityChange} required className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all">
                    <option value="">-- Choose your University --</option>
                    {institutions.map((inst, idx) => (
                      <option key={idx} value={inst.university}>{inst.university}</option>
                    ))}
                    <option value="OTHER" className="text-emerald-400 font-bold">Other (Type Manually)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" name="university" required value={formData.university} onChange={handleChange} autoFocus className="flex-1 bg-black/50 border border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" placeholder="Enter University Name" />
                    <button type="button" onClick={() => setIsManualUni(false)} className="px-3 bg-white/10 rounded-xl text-xs hover:bg-white/20 transition-colors">Cancel</button>
                  </div>
                )}
              </div>

              {/* 🔥 DYNAMIC COLLEGE SELECTION 🔥 */}
              <div>
                <label className="block text-xs font-medium text-emerald-400 mb-1.5 pl-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> Select College</label>
                {!isManualCollege ? (
                  <select onChange={handleCollegeChange} required disabled={!formData.university} className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50">
                    <option value="">-- Choose your College --</option>
                    {availableColleges.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                    <option value="OTHER" className="text-emerald-400 font-bold">Other (Type Manually)</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" name="collegeName" required value={formData.collegeName} onChange={handleChange} autoFocus className="flex-1 bg-black/50 border border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" placeholder="Enter College Name" />
                    <button type="button" onClick={() => { setIsManualCollege(false); setFormData({...formData, collegeName: ""}); }} className="px-3 bg-white/10 rounded-xl text-xs hover:bg-white/20 transition-colors">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Course</label>
                <select name="course" value={formData.course} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all">
                  <option value="BAMS">BAMS</option>
                  <option value="MD/MS (Ayurveda)">MD/MS (Ayurveda)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Batch Year</label>
                <input type="number" name="batchYear" required value={formData.batchYear} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-gray-600" placeholder="e.g. 2023" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Full Address (City, State)</label>
              <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-gray-600" placeholder="Jaipur, Rajasthan" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl mt-6 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Save & Go to Dashboard <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

          </form>
        </motion.div>
        
        <div className="h-10"></div>
      </div>
    </div>
  );
}