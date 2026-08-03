"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FAQFooter() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  
  const faqs = [
    { q: "What is the 5-Day 100% Refund Policy?", a: "We offer a strict 'No Questions Asked' 5-day money-back guarantee. If the platform does not align with your academic expectations, you may cancel your subscription within five days of enrollment for a full, unconditional refund." },
    { q: "How accurate is the Samhita AI? Can it hallucinate?", a: "Our Samhita AI operates on a highly constrained RAG architecture. It extracts answers exclusively from authenticated classical texts and NCISM-approved curricula. It is programmed to state 'Data Unavailable' rather than hallucinate, ensuring absolute clinical safety." },
    { q: "What is included in the ₹599 Annual Membership?", a: "The membership grants comprehensive access to the AI Samhita Reader (Padacheda, Anvaya, Translations, Vimarsh), expert video lectures, PDF notes, chapter-wise clinical quizzes, and our smart performance-tracking dashboard." },
    { q: "When will other clinical subjects be launched?", a: "Foundational and clinical subjects across all Profs are currently undergoing rigorous academic review. You may utilize our Early Bird Registration form to secure priority access and an exclusive 50% grant upon their official launch." }
  ];

  return (
    <>
      <section id="faq" className="py-16 md:py-24 px-4 md:px-6 max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Academic <span className="text-emerald-400">Inquiries</span></h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors">
              <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 md:p-6 text-left">
                <span className="font-bold text-gray-200 text-sm md:text-base pr-4 leading-snug">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 transition-transform shrink-0 ${activeFaq === i ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="p-5 md:p-6 pt-0 text-sm md:text-base text-gray-400 leading-relaxed border-t border-white/5 mt-2">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#010402] py-8 md:py-10 px-6 text-center text-xs md:text-sm font-medium text-gray-600 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} AyushGyaan Academy. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="#" className="hover:text-emerald-400 transition-colors">Refund Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </>
  );
}