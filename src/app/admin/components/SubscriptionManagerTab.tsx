"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Edit, Crown, Shield, User, Loader2, Save, X, Calendar, Zap } from "lucide-react";

export default function SubscriptionManagerTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 🔄 डेटाबेस से यूज़र्स लाएँ (GET API)
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || data.users); // Handling both possible API responses
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 💾 यूज़र अपडेट सेव करें (आपकी पुरानी Action API का इस्तेमाल करके)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 🔥 Yahan POST method aur nayi Action API URL lagayi hai
      const res = await fetch("/api/admin/users/action", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.uid, // Mongoose update ke liye ID
          action: "UPDATE_ACCESS", // Server ko batane ke liye
          role: editingUser.role,
          tier: editingUser.aiPlan?.tier,
          tokens: editingUser.aiPlan?.tokens,
          validityMonths: editingUser.validityMonths 
        })
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        // टेबल में तुरंत अपडेट करें (बिना रिफ्रेश किए)
        setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, ...data.user } : u));
        setEditingUser(null);
        alert("✅ User access updated successfully!");
      } else {
        alert("⚠️ Update successful, please refresh to see changes.");
        setEditingUser(null);
        fetchUsers(); // Fallback refresh
      }
    } catch (error) {
      alert("⚠️ Network error while saving.");
    }
    setIsSaving(false);
  };

  // 🔍 सर्च फ़िल्टर
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <Users className="w-6 h-6" /> User & Subscription Management
        </h2>
        <p className="text-sm text-gray-400 mt-1">Manage AI access, tokens, and roles for all registered students.</p>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
      </div>

      {/* USERS TABLE */}
      <div className="glass-panel border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/60 border-b border-gray-800 text-xs uppercase tracking-widest text-gray-500">
              <tr>
                <th className="p-5 font-bold">User</th>
                <th className="p-5 font-bold">Role</th>
                <th className="p-5 font-bold">AI Plan</th>
                <th className="p-5 font-bold">Remaining Tokens</th>
                <th className="p-5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-gray-200">{user.name || "Unknown User"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="p-5">
                      <span className={`flex w-max items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        user.role === 'admin' ? "bg-red-950/30 text-red-400 border-red-500/30" : "bg-gray-900/50 text-gray-400 border-gray-700"
                      }`}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3"/> : <User className="w-3 h-3"/>} {user.role || 'USER'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`flex w-max items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        user.aiPlan?.tier === 'pro' ? "bg-amber-950/30 text-amber-400 border-amber-500/30" :
                        user.aiPlan?.tier === 'plus' ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30" :
                        "bg-blue-950/30 text-blue-400 border-blue-500/30"
                      }`}>
                        {user.aiPlan?.tier === 'pro' ? <Crown className="w-3 h-3"/> : <Zap className="w-3 h-3"/>} 
                        {user.aiPlan?.tier || 'basic'}
                      </span>
                    </td>
                    <td className="p-5 font-black text-gray-300">
                      {user.aiPlan?.tokens ?? 0}
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => setEditingUser({ ...user, validityMonths: "0" })}
                        className="bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white p-2 rounded-lg transition-colors border border-gray-700 hover:border-blue-500 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛠️ EDIT USER MODAL (POPUP) */}
      <AnimatePresence>
        {editingUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0A1410] border border-emerald-900/50 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-gray-800 bg-black/40 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2"><Edit className="w-4 h-4 text-emerald-400"/> Edit User Access</h3>
                  <p className="text-xs text-gray-400 mt-1">{editingUser.email}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-full transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* ROLE SELECTION */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-gray-800">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">System Role</label>
                    <select 
                      value={editingUser.role || "user"} 
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="user">Student (User)</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>

                  {/* PLAN SELECTION */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-gray-800">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">AI Tier</label>
                    <select 
                      value={editingUser.aiPlan?.tier || "basic"} 
                      onChange={(e) => setEditingUser({...editingUser, aiPlan: {...(editingUser.aiPlan || {}), tier: e.target.value}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="basic">Basic (Free)</option>
                      <option value="plus">Plus (₹199)</option>
                      <option value="pro">Pro (₹499)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* TOKENS OVERRIDE */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-gray-800">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Available Tokens</label>
                    <input 
                      type="number" min="0" required
                      value={editingUser.aiPlan?.tokens ?? 0} 
                      onChange={(e) => setEditingUser({...editingUser, aiPlan: {...(editingUser.aiPlan || {}), tokens: Number(e.target.value)}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* VALIDITY (ONLY IF UPGRADING) */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-gray-800">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3"/> Add Validity</label>
                    <select 
                      value={editingUser.validityMonths || "0"} 
                      onChange={(e) => setEditingUser({...editingUser, validityMonths: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="0">No Change</option>
                      <option value="1">1 Month</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                  {isSaving ? "Applying Changes..." : "Confirm & Apply"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}