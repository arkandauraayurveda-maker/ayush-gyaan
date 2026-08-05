"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Edit, Crown, Shield, User, Loader2, Save, X, 
  GraduationCap, Phone, Mail, MapPin, CheckCircle2, XCircle, CreditCard, 
  Gift, Ban, Undo2, Bot, Sparkles, RefreshCw, Zap 
} from "lucide-react";
import { auth } from "@/lib/firebase";

export default function StudentSubscriptionManagerTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Selected Student Modal & Action States
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [courseToGrant, setCourseToGrant] = useState("");
  const [selectedAiPlan, setSelectedAiPlan] = useState("basic");

  // Subscription Edit Sub-Modal States
  const [editingSubUser, setEditingSubUser] = useState<any>(null);
  const [isSavingSub, setIsSavingSub] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchCoursesList();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
    setIsLoading(false);
  };

  const fetchCoursesList = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) {
        setCoursesList(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  // Filter Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile?.includes(searchTerm) ||
      s.collegeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
    const matchesTier = tierFilter === "ALL" || s.aiPlan?.tier === tierFilter;

    return matchesSearch && matchesRole && matchesTier;
  });

  // Course Admin Actions (GRANT, REVOKE, REFUND)
  const handleCourseAction = async (action: "GRANT" | "REVOKE" | "REFUND", courseId: string) => {
    if (!confirm(`Are you sure you want to ${action} course for this student?`)) return;
    
    setIsActionLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          userId: selectedStudent.uid || selectedStudent._id, 
          email: selectedStudent.email,
          action: action.toLowerCase(), 
          courseId,
          aiPlan: action === "GRANT" ? selectedAiPlan : undefined 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`✅ Course ${action} completed successfully!`);
        fetchStudents();
        setSelectedStudent(null);
        setCourseToGrant("");
      } else {
        alert("⚠️ Error: " + data.error);
      }
    } catch (error) {
      alert("⚠️ Something went wrong!");
    }
    setIsActionLoading(false);
  };

  // Subscription / Role / Token Save Action
  const handleSaveSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubUser) return;
    setIsSavingSub(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/users/action", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          userId: editingSubUser.uid || editingSubUser._id, 
          action: "update_access",
          role: editingSubUser.role,
          tier: editingSubUser.aiPlan?.tier,
          tokens: editingSubUser.aiPlan?.tokens,
          validityMonths: editingSubUser.validityMonths || 1
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("✅ User access and subscription updated successfully!");
        setEditingSubUser(null);
        fetchStudents();
      } else {
        alert("⚠️ Update failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("⚠️ Network error while saving.");
    }
    setIsSavingSub(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-12">
      
      {/* HEADER & REFRESH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-900/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            Student & Subscription Management Hub
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage student profiles, course access, AI plan tiers, and role authorizations in one place.</p>
        </div>

        <button 
          onClick={fetchStudents}
          className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/40 hover:bg-emerald-800/40 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Students Data
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by student name, email, mobile, or college..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
        </div>

        <div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="student">Student</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <select 
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="ALL">All AI Tiers</option>
            <option value="basic">Basic (Free)</option>
            <option value="plus">Plus Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* STUDENTS LIST TABLE */}
      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/60 text-xs font-bold text-gray-400 uppercase border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="p-4">Student Profile</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Enrolled Courses</th>
                  <th className="p-4">AI Plan & Tokens</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">No matching students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const activeCoursesCount = s.purchasedCourses?.filter((c: any) => c.status === "ACTIVE").length || 0;
                    const tier = s.aiPlan?.tier || "basic";
                    
                    return (
                      <tr key={s._id || s.uid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md">
                              {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {s.name || "Ayurvedic Student"}
                              </div>
                              <div className="text-xs text-gray-400">{s.collegeName || "Ayurvedic College"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-xs">
                          <div className="text-gray-300">{s.email}</div>
                          <div className="text-gray-500">{s.mobile || "N/A"}</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            s.role === "admin" 
                              ? "bg-red-950/60 text-red-400 border border-red-800" 
                              : s.role === "doctor"
                              ? "bg-cyan-950/60 text-cyan-400 border border-cyan-800"
                              : "bg-gray-800 text-gray-300 border border-gray-700"
                          }`}>
                            {s.role || "student"}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-white">{activeCoursesCount} Active</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              tier === "pro" 
                                ? "bg-purple-950/60 text-purple-300 border border-purple-800" 
                                : tier === "plus"
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                                : "bg-gray-800 text-gray-400 border border-gray-700"
                            }`}>
                              {tier}
                            </span>
                            <span className="text-xs text-gray-400">({s.aiPlan?.tokens ?? 0} tokens)</span>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-medium transition-all"
                            >
                              360° Profile
                            </button>
                            <button
                              onClick={() => setEditingSubUser(s)}
                              className="px-3 py-1.5 bg-purple-950/50 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Edit Sub
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° STUDENT & COURSE ACTION MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0f0d] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" /> Student Profile: {selectedStudent.name || "Ayurvedic Scholar"}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GRANT NEW COURSE SECTION */}
              <div className="bg-emerald-950/20 border border-emerald-900/50 p-5 rounded-2xl mb-6">
                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" /> Grant Course Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select 
                    value={courseToGrant} 
                    onChange={(e) => setCourseToGrant(e.target.value)}
                    className="sm:col-span-2 bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Course to Grant...</option>
                    {coursesList.map((c) => (
                      <option key={c.courseId} value={c.courseId}>{c.title} ({c.courseId})</option>
                    ))}
                  </select>
                  <button 
                    disabled={!courseToGrant || isActionLoading}
                    onClick={() => handleCourseAction("GRANT", courseToGrant)}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Grant Access"}
                  </button>
                </div>
              </div>

              {/* ENROLLED COURSES TABLE */}
              <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Active Enrolled Courses
              </h4>
              <div className="border border-gray-800 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase border-b border-gray-800">
                    <tr>
                      <th className="p-3">Course ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Revoke / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {(!selectedStudent.purchasedCourses || selectedStudent.purchasedCourses.length === 0) ? (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-500">No courses purchased or granted yet.</td></tr>
                    ) : (
                      selectedStudent.purchasedCourses.map((pc: any) => (
                        <tr key={pc.courseId}>
                          <td className="p-3 font-semibold text-white">{pc.courseId}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pc.status === "ACTIVE" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                              {pc.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {pc.status === "ACTIVE" && (
                              <button 
                                onClick={() => handleCourseAction("REVOKE", pc.courseId)}
                                className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-[10px] transition-colors"
                              >
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SUBSCRIPTION & TOKENS SUB-MODAL */}
      <AnimatePresence>
        {editingSubUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0f0d] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" /> Edit Subscription & Role
                  </h3>
                  <p className="text-xs text-gray-400">{editingSubUser.name} ({editingSubUser.email})</p>
                </div>
                <button onClick={() => setEditingSubUser(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubUser} className="space-y-4 text-sm">
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">User Role</label>
                  <select 
                    value={editingSubUser.role || "student"}
                    onChange={(e) => setEditingSubUser({ ...editingSubUser, role: e.target.value })}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500"
                  >
                    <option value="student">Student</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">AI Plan Tier</label>
                  <select 
                    value={editingSubUser.aiPlan?.tier || "basic"}
                    onChange={(e) => setEditingSubUser({ 
                      ...editingSubUser, 
                      aiPlan: { ...editingSubUser.aiPlan, tier: e.target.value } 
                    })}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500"
                  >
                    <option value="basic">Basic (Free)</option>
                    <option value="plus">Plus Plan</option>
                    <option value="pro">Pro Plan (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Daily Token Allocation</label>
                  <input 
                    type="number"
                    min="0"
                    value={editingSubUser.aiPlan?.tokens ?? 10}
                    onChange={(e) => setEditingSubUser({ 
                      ...editingSubUser, 
                      aiPlan: { ...editingSubUser.aiPlan, tokens: Number(e.target.value) } 
                    })}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Validity Extension (Months)</label>
                  <input 
                    type="number"
                    min="1"
                    max="36"
                    value={editingSubUser.validityMonths || 1}
                    onChange={(e) => setEditingSubUser({ ...editingSubUser, validityMonths: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingSubUser(null)} 
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingSub}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                  >
                    {isSavingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Access Rules
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
