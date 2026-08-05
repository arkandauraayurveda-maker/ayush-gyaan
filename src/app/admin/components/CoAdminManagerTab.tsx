"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, UserCheck, Shield, Search, Loader2, Save, Check, X, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";

const ALL_ADMIN_TABS = [
  { key: "SAMHITA", label: "Samhita Engine", desc: "Manage Shlokas, Sthana & Structure" },
  { key: "COURSES", label: "Manage Courses", desc: "Create & Edit BAMS Courses" },
  { key: "STUDENTS", label: "Students & Subscriptions", desc: "View Students & Edit Plans" },
  { key: "LEADS", label: "Early Bird Leads", desc: "Access Early Bird Subscriptions" },
  { key: "COUPONS", label: "Manage Coupons", desc: "Create & Edit Discount Coupons" },
  { key: "INSTITUTIONS", label: "Manage Institutions", desc: "College & B2B Registrations" },
  { key: "AI_CHAT_LOGS", label: "AI Chat Analytics", desc: "Monitor Student AI Queries & Tokens" },
  { key: "GLOBAL_SETTINGS", label: "Global Settings", desc: "System Pricing & Model Controls" },
];

export default function CoAdminManagerTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Selected user for editing modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch(`/api/admin/co-admins?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to fetch users for co-admin management", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const openEditor = (userDoc: any) => {
    setEditingUser(userDoc);
    setSelectedRole(userDoc.role || "user");
    setSelectedTabs(userDoc.allowedAdminTabs || []);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
  };

  const toggleTabPermission = (tabKey: string) => {
    setSelectedTabs(prev => 
      prev.includes(tabKey) ? prev.filter(k => k !== tabKey) : [...prev, tabKey]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/co-admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: editingUser._id,
          role: selectedRole,
          allowedAdminTabs: selectedTabs
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg("Co-Admin permissions updated successfully!");
        fetchUsers();
        setTimeout(() => setEditingUser(null), 1200);
      } else {
        setSaveErrorMsg(data.error || "Failed to update permissions");
      }
    } catch (e) {
      setSaveErrorMsg("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" /> Co-Admin Permission Portal
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Assign granular tab access permissions to registered Co-Admins. Restricted strictly to Main Admin (<span className="text-emerald-400 font-semibold">jkdewasi961096@gmail.com</span>).
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* USERS LIST TABLE */}
      <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-black/40 flex justify-between items-center">
          <h3 className="font-bold text-xs text-gray-300 uppercase tracking-widest">Registered Users & Admin Roles</h3>
          <button onClick={fetchUsers} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh List"}
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No registered users found.</div>
        ) : (
          <div className="divide-y divide-gray-800/60 overflow-x-auto">
            {users.map((u) => {
              const isMainAdmin = u.email === "jkdewasi961096@gmail.com";
              const isCoAdmin = u.role === "co-admin";

              return (
                <div key={u._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${isMainAdmin ? 'bg-amber-950/40 border-amber-500/50 text-amber-400' : isCoAdmin ? 'bg-purple-950/40 border-purple-500/50 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                      {isMainAdmin ? <Lock className="w-5 h-5" /> : isCoAdmin ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{u.name || "Ayush User"}</span>
                        {isMainAdmin && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Main Super Admin
                          </span>
                        )}
                        {isCoAdmin && (
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-500/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Co-Admin ({u.allowedAdminTabs?.length || 0} Tabs)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  {/* Allowed Tabs Preview & Edit Action */}
                  <div className="flex items-center gap-4">
                    {isCoAdmin && u.allowedAdminTabs && u.allowedAdminTabs.length > 0 && (
                      <div className="hidden lg:flex flex-wrap gap-1 max-w-xs">
                        {u.allowedAdminTabs.map((tKey: string) => (
                          <span key={tKey} className="text-[9px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800 px-1.5 py-0.5 rounded">
                            {tKey}
                          </span>
                        ))}
                      </div>
                    )}

                    {!isMainAdmin ? (
                      <button
                        onClick={() => openEditor(u)}
                        className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 font-bold text-xs rounded-xl transition-all shadow-md"
                      >
                        Manage Permissions
                      </button>
                    ) : (
                      <span className="text-xs text-amber-500/70 font-semibold italic">Full System Access</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔒 PERMISSION MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#070d0a] border border-emerald-900/60 p-6 sm:p-8 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" /> Edit Co-Admin Permissions
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{editingUser.email}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" /> {saveSuccessMsg}
                </div>
              )}
              {saveErrorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-500 text-red-400 text-xs rounded-xl font-bold">
                  ⚠️ {saveErrorMsg}
                </div>
              )}

              {/* ROLE SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">User Administrative Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    if (e.target.value === "co-admin" && selectedTabs.length === 0) {
                      setSelectedTabs(["SAMHITA"]);
                    }
                  }}
                  className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="user">Regular User (No Admin Portal Access)</option>
                  <option value="student">Student (Standard Dashboard Access)</option>
                  <option value="co-admin">Co-Admin (Granular Approved Tabs Only)</option>
                  <option value="admin">Full Admin (All Tabs Access)</option>
                </select>
              </div>

              {/* TABS PERMISSION CHECKBOXES (ONLY RELEVANT FOR CO-ADMIN) */}
              {selectedRole === "co-admin" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Approved Admin Tabs ({selectedTabs.length} Selected)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTabs(selectedTabs.length === ALL_ADMIN_TABS.length ? [] : ALL_ADMIN_TABS.map(t => t.key))}
                      className="text-[10px] text-gray-400 hover:text-white underline"
                    >
                      {selectedTabs.length === ALL_ADMIN_TABS.length ? "Deselect All" : "Select All Tabs"}
                    </button>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {ALL_ADMIN_TABS.map((tab) => {
                      const isChecked = selectedTabs.includes(tab.key);
                      return (
                        <div
                          key={tab.key}
                          onClick={() => toggleTabPermission(tab.key)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isChecked
                              ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
                              : "bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 accent-emerald-500"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{tab.label}</p>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{tab.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODAL ACTIONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-black/40 border border-gray-800 hover:bg-gray-800 text-gray-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Permissions
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
