"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SamhitaReader() {
  const [shlokas, setShlokas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Track which word is clicked { shlokaId: wordIndex }
  const [activeWord, setActiveWord] = useState<{ shlokaId: string; wordIndex: number } | null>(null);

  useEffect(() => {
    fetchApprovedShlokas();
  }, []);

  const fetchApprovedShlokas = async () => {
    try {
      const res = await fetch("/api/shlokas/approved");
      const json = await res.json();
      if (json.success) {
        setShlokas(json.data);
      }
    } catch (error) {
      console.error("Failed to load shlokas", error);
    }
    setLoading(false);
  };

  const handleWordClick = (shlokaId: string, wordIndex: number) => {
    // Toggle logic: agar wahi word dubara click kiya toh band kar do, warna open karo
    if (activeWord?.shlokaId === shlokaId && activeWord?.wordIndex === wordIndex) {
      setActiveWord(null);
    } else {
      setActiveWord({ shlokaId, wordIndex });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 relative overflow-hidden pb-32">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[150px] -z-10" />

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10 mt-4 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full bg-black/40 border border-gray-800 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-primary w-8 h-8" />
            Samhita Adhyayan
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI-Powered Interactive Reader</p>
        </div>
      </div>

      {/* Shlokas List */}
      <div className="max-w-4xl mx-auto space-y-16">
        {shlokas.length === 0 ? (
          <div className="glass-panel p-10 text-center text-gray-400">
            Abhi tak koi shloka available nahi hai. Admin dwara approve hone ki pratiksha karein.
          </div>
        ) : (
          shlokas.map((shloka) => (
            <div key={shloka._id} className="glass-panel p-8 md:p-12 relative">
              
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-8">
                <span className="text-accent font-bold uppercase tracking-widest text-sm">
                  {shloka.samhitaName} • {shloka.sthana}
                </span>
                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
                  Shloka {shloka.shlokaNumber}
                </span>
              </div>

              {/* INTERACTIVE SHLOKA (Word by Word) */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-10 text-xl md:text-2xl font-bold text-white mb-10 leading-relaxed text-center">
                {shloka.words?.map((word: any, index: number) => {
                  const isActive = activeWord?.shlokaId === shloka._id && activeWord?.wordIndex === index;
                  
                  return (
                    <div key={index} className="relative inline-block">
                      {/* Clickable Word Button */}
                      <button
                        onClick={() => handleWordClick(shloka._id, index)}
                        className={`cursor-pointer transition-all duration-300 px-1 rounded-md ${
                          isActive ? "text-accent bg-accent/10" : "text-gray-200 hover:text-primary"
                        }`}
                      >
                        {word.text}
                      </button>

                      {/* Floating Transparent Box (Glassmorphism Popup) */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 glass-panel bg-black/90 p-4 z-50 pointer-events-none"
                          >
                            {/* Sandhi Vichhed (If available) */}
                            {word.hasSandhi && word.sandhiComponents?.length > 0 && (
                              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 pb-3 border-b border-gray-700">
                                {word.sandhiComponents.map((comp: string, i: number) => (
                                  <span key={i} className="flex items-center text-primary font-bold text-base md:text-lg">
                                    {comp}
                                    {i < word.sandhiComponents.length - 1 && (
                                      <Plus className="w-3 h-3 mx-1 text-gray-500" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Hindi & English Meanings */}
                            <div className="space-y-1.5 text-center">
                              <p className="text-white text-sm font-medium">{word.meaningHindi}</p>
                              <p className="text-accent text-xs italic">{word.meaningEnglish}</p>
                            </div>
                            
                            {/* Little pointer arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-black/90"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Anvaya Section */}
              {shloka.anvaya && (
                <div className="bg-black/30 border border-gray-800 rounded-lg p-5 mb-6">
                  <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Anvaya (Logical Sequence)</h4>
                  <p className="text-gray-300 text-sm md:text-base">{shloka.anvaya}</p>
                </div>
              )}

              {/* Hindi Translation Section */}
              <div className="bg-black/30 border border-gray-800 rounded-lg p-5 mb-6">
                <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Anuwad (Translation)</h4>
                <p className="text-gray-200 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                  {shloka.translationHindi}
                </p>
              </div>

              {/* Vimarsh Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                <h4 className="text-xs text-primary uppercase tracking-widest mb-2 font-bold">Vimarsh (Commentary)</h4>
                <p className="text-gray-300 text-sm md:text-base whitespace-pre-wrap leading-relaxed text-justify">
                  {shloka.vimarsh}
                </p>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}