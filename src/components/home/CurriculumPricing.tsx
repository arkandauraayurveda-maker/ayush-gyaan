"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Flame, Calendar, CheckCircle2, Ticket, Sparkles, Bot } from "lucide-react"; // 🔥 Bot icon imported

export default function CurriculumPricing() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    fetch("/api/courses/public")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.courses.length > 0) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingCourses(false));
  }, []);

  return (
    <section id="curriculum" className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-10 md:mb-16">
        <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest mb-4 text-[10px] md:text-xs bg-emerald-900/30 px-4 py-1.5 rounded-full border border-emerald-500/30">
          <Tag className="w-4 h-4" /> Limited Time Offers
        </div>
        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Academic <span className="text-emerald-400">Modules</span></h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">Transparent pricing. No hidden fees. Cancel within 5 days for a full refund.</p>
      </div>

      {isLoadingCourses ? (
        <div className="flex justify-center p-10">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 items-start pt-4">
          {courses.map((course, i) => (
            <div key={course.id || i} className={`bg-white/[0.02] backdrop-blur-xl border ${course.highlight ? 'border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.15)] md:-translate-y-2' : 'border-white/10'} rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col h-full relative transition-transform`}>
              
              {/* SALE BADGE */}
              {course.badge && (
                <div className="absolute -top-3.5 left-6 md:left-8 bg-red-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center gap-1 border border-red-400">
                  <Flame className="w-3 h-3 md:w-4 md:h-4" /> {course.badge}
                </div>
              )}

              {/* RECOMMENDED BADGE */}
              {course.highlight && !course.badge && (
                <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Recommended
                </div>
              )}

              {/* 🤖 🔥 NEW: AI ENABLED BADGE */}
              {course.aiSettings?.isAiEnabled && (
                 <div className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                   <Bot className="w-3.5 h-3.5" /> AI Integrated
                 </div>
              )}

              <span className={`${course.highlight ? 'text-emerald-400' : 'text-blue-400'} font-bold text-xs md:text-sm mb-2 uppercase tracking-wide mt-2`}>{course.prof}</span>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{course.title}</h3>
              
              {course.startDate && (
                <div className="text-[10px] md:text-xs text-amber-400 font-bold mb-4 flex items-center gap-1.5 bg-amber-500/10 w-fit px-3 py-1.5 rounded-md border border-amber-500/20">
                  <Calendar className="w-3.5 h-3.5" /> {course.startDate}
                </div>
              )}

              <div className="mb-6 md:mb-8 border-b border-white/5 pb-6">
                {course.originalPrice && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm md:text-base text-gray-500 line-through font-semibold">{course.originalPrice}</span>
                    {course.discountText && (
                      <span className="text-[10px] md:text-xs font-black text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        {course.discountText}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <span className="text-xl md:text-2xl text-gray-400 font-bold mb-1">Starts at</span>
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{course.price}</span>
                  <span className="text-xs md:text-sm text-gray-500 font-medium mb-1.5">/ {course.duration}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {course.syllabus?.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
                    <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${course.highlight ? 'text-emerald-500' : 'text-blue-500'} shrink-0 mt-0.5`} /> 
                    {item}
                  </div>
                ))}
              </div>

              {course.couponCode && (
                <div className="mb-5 bg-white/5 border border-dashed border-emerald-500/50 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Use Code:</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400 tracking-wider group-hover:scale-105 transition-transform">
                    {course.couponCode}
                  </span>
                </div>
              )}

              {course.status === "Available Now" || course.status === "Available" ? (
                <Link href={`/checkout/${course.courseId || course._id}`} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 text-sm md:text-base ${course.highlight ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                  Initialize Enrollment
                </Link>
              ) : (
                <a href="#early-bird" className="w-full py-4 rounded-xl font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Early Register
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}