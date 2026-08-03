"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Loader2, ShieldAlert, GraduationCap, Phone, Mail, MapPin, CheckCircle2, XCircle, CreditCard, Gift, Ban, Undo2, X, UserCircle, Bot } from "lucide-react";

export default function StudentManagerTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]); // 🔥 NEW: Dynamic Courses List
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 360° Profile Modal States
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // 🔥 NEW: Grant Access States
  const [courseToGrant, setCourseToGrant] = useState("");
  const [selectedAiPlan, setSelectedAiPlan] = useState("none"); // none, basic, plus, pro

  useEffect(() => {
    fetchStudents();
    fetchCoursesList(); // 🔥 NEW: Fetch courses on load
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  // 🔥 NEW: Fetch Courses for Dropdown
  const fetchCoursesList = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) {
        setCoursesList(data.courses);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 🔍 Filter Logic
  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mobile?.includes(searchTerm) ||
    s.collegeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🛠️ ADMIN ACTIONS (Grant, Revoke, Refund)
  const handleAdminAction = async (action: "GRANT" | "REVOKE" | "REFUND", courseId: string) => {
    if (!confirm(`Are you sure you want to ${action} course ${courseId} for this student?`)) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent.uid || selectedStudent._id, 
          email: selectedStudent.email,
          action: action.toLowerCase(), 
          courseId,
          // 🔥 NEW: Send AI Plan to backend when granting
          aiPlan: action === "GRANT" ? selectedAiPlan : undefined 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Action ${action} completed successfully!`);
        fetchStudents();
        setSelectedStudent(null);
        setCourseToGrant("");
        setSelectedAiPlan("none");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Something went wrong!");
    }
    setIsActionLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-10">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">360° Student CRM</h2>
          <p className="text-sm text-gray-400">Manage access, AI plans, refunds, and monitor drop-offs.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search name, email, phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Scholar Info</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Institution</th>
                <th className="px-6 py-4 font-semibold">AI Tier</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto"/></td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No students found</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.uid || student._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                          <span className="font-bold text-blue-400">{student.name?.charAt(0) || "U"}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white">{student.name || "Unknown User"}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            {student.purchasedCourses?.length > 0 ? (
                              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Enrolled</span>
                            ) : student.checkoutIntent?.length > 0 ? (
                              <span className="text-orange-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Hot Lead</span>
                            ) : (
                              <span className="text-gray-500 flex items-center gap-1"><XCircle className="w-3 h-3"/> Not Enrolled</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs"><Mail className="w-3 h-3"/> {student.email}</span>
                        {student.mobile && <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3"/> {student.mobile}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.collegeName ? (
                        <div className="text-xs">
                          <p className="text-gray-300 font-medium truncate max-w-[200px]">{student.collegeName}</p>
                          <p className="text-gray-600 truncate max-w-[200px]">{student.university}</p>
                        </div>
                      ) : <span className="text-xs text-gray-600 italic">Profile Incomplete</span>}
                    </td>
                    <td className="px-6 py-4">
                      {/* 🔥 DISPLAY USER'S AI PLAN */}
                      {student.aiPlan?.tier === 'pro' ? (
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold tracking-widest uppercase">Pro</span>
                      ) : student.aiPlan?.tier === 'plus' ? (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-widest uppercase">Plus</span>
                      ) : student.aiPlan?.tier === 'basic' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase">Basic</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-bold tracking-widest uppercase">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        View 360° Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔮 360° PROFILE MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050B08] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStudent.name || "Unknown"}</h3>
                    <p className="text-xs text-gray-500 tracking-widest uppercase">{selectedStudent.uid}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-gray-800 rounded-2xl p-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Contact Info</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500"/> {selectedStudent.email}</p>
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500"/> {selectedStudent.mobile || "N/A"}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500"/> {selectedStudent.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-gray-800 rounded-2xl p-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Academic Info</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p className="flex items-start gap-2"><GraduationCap className="w-4 h-4 text-gray-500 shrink-0 mt-0.5"/> <span>{selectedStudent.collegeName || "N/A"}<br/><span className="text-xs text-gray-500">{selectedStudent.university}</span></span></p>
                      <p className="flex items-center gap-2 text-xs text-blue-400 font-bold mt-2 pt-2 border-t border-gray-800">Batch: {selectedStudent.batchYear || "N/A"} • {selectedStudent.course}</p>
                    </div>
                  </div>
                </div>

                {/* Purchased Courses */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4"/> Active & Past Subscriptions
                  </h4>
                  {!selectedStudent.purchasedCourses || selectedStudent.purchasedCourses.length === 0 ? (
                    <div className="p-4 bg-white/5 border border-dashed border-gray-700 rounded-xl text-center text-sm text-gray-500">No active subscriptions.</div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.purchasedCourses.map((course: any, idx: number) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/40 border border-gray-800 rounded-xl">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-emerald-400">{course.courseId}</p>
                              <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${course.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {course.status || 'ACTIVE'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Granted on: {new Date(course.purchaseDate).toLocaleDateString()} • Exp: {new Date(course.expiryDate).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">By: {course.grantedBy}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {course.status !== 'REVOKED' && (
                              <button onClick={() => handleAdminAction("REVOKE", course.courseId)} disabled={isActionLoading} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><Ban className="w-3 h-3"/> Revoke</button>
                            )}
                            <button onClick={() => handleAdminAction("REFUND", course.courseId)} disabled={isActionLoading} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><Undo2 className="w-3 h-3"/> Refund</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔥 NEW: Manual Course & AI Plan Granting */}
                <div className="p-5 bg-blue-950/20 border border-blue-500/30 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Gift className="w-4 h-4"/> Grant Manual Access & AI Plan</h4>
                  
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    
                    {/* Course Selection Dropdown */}
                    <div className="w-full md:w-1/3">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block">1. Select Course</label>
                      <select value={courseToGrant} onChange={(e) => setCourseToGrant(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option value="">Choose a course...</option>
                        {coursesList.map((c) => (
                          <option key={c.courseId} value={c.courseId}>{c.courseId} - {c.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* AI Plan Selection Dropdown */}
                    <div className="w-full md:w-1/3">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Bot className="w-3 h-3"/> 2. Select AI Tier</label>
                      <select value={selectedAiPlan} onChange={(e) => setSelectedAiPlan(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                        <option value="none">No AI Access</option>
                        <option value="basic">AyushGyaan Basic (Flash-Lite)</option>
                        <option value="plus">AyushGyaan Plus (Flash)</option>
                        <option value="pro">AyushGyaan Pro (Live Audio/Vision)</option>
                      </select>
                    </div>

                    {/* Submit Button */}
                    <div className="w-full md:w-1/3">
                      <button 
                        onClick={() => handleAdminAction("GRANT", courseToGrant)}
                        disabled={!courseToGrant || isActionLoading}
                        className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                      >
                        {isActionLoading ? "Processing..." : "Grant Access"}
                      </button>
                    </div>
                  </div>
                  
                  {selectedAiPlan !== 'none' && (
                    <p className="text-[10px] text-emerald-400 mt-3 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      💡 <strong>Note:</strong> Granting this course will also upgrade the user's AI Plan to <strong>{selectedAiPlan.toUpperCase()}</strong> and refill their monthly tokens.
                    </p>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}