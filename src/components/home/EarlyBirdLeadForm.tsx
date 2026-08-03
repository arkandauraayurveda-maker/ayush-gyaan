"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function EarlyBirdLeadForm() {
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEarlyBirdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pre-register", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (data.success) {
        alert("Registration successful! You have secured priority access and will receive an email shortly.");
        setFormData({ name: "", email: "", mobile: "" });
      } else { 
        alert("Registration Error: " + data.error); 
      }
    } catch (error) { 
      alert("Network Error. Please try again later."); 
    }
    setIsSubmitting(false);
  };

  return (
    <section id="early-bird" className="py-12 md:py-16 px-4 md:px-6 max-w-6xl mx-auto relative z-10 scroll-mt-24">
      <div className="bg-gradient-to-br from-blue-950/40 to-[#020604] border border-blue-500/20 rounded-3xl md:rounded-[2.5rem] p-6 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        
        <div className="flex-1 text-center md:text-left relative z-10 w-full">
          <h3 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 tracking-tight">Advance Reservation for <br className="hidden md:block"/><span className="text-blue-400">All NCISM Subjects</span></h3>
          <p className="text-gray-400 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
            Foundational & Clinical subjects across 1st, 2nd, and 3rd Prof are in high-quality production. Secure your spot at zero cost today and receive a guaranteed <strong className="text-white">50% Discount Coupon</strong> upon launch directly in your inbox.
          </p>
        </div>
        
        <div className="w-full md:w-[420px] bg-black/60 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl relative z-10">
          <form className="space-y-4" onSubmit={handleEarlyBirdSubmit}>
            <input type="text" placeholder="Dr. / Scholar Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
            <input type="email" placeholder="Email Address (For Discount Coupons)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
            <input type="tel" placeholder="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 md:py-4 rounded-xl transition-all mt-2 flex items-center justify-center gap-2 text-sm md:text-base">
              {isSubmitting ? "Registering..." : "Secure Priority Access"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}