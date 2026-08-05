"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Plus, Pencil, Save, Trash2, Loader2, X, ShieldCheck } from "lucide-react";

export default function CouponManagerTab() {
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 0,
    isActive: true,
    expiryDate: "",
    courseId: "", 
    userId: "",   
    maxUses: 50
  });

  useEffect(() => {
    fetchCouponsList();
  }, []);

  const fetchCouponsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) setCouponsList(data.coupons);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCouponId ? "PUT" : "POST";
    const payload = { ...couponFormData, _id: editingCouponId };

    try {
      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Coupon ${editingCouponId ? "Updated" : "Created"} Successfully!`);
        setIsCouponModalOpen(false);
        fetchCouponsList();
      } else {
        const errData = await res.json();
        alert("Error: " + errData.error);
      }
    } catch (error) { console.error(error); }
  };

  const handleCouponEdit = (coupon: any) => {
    setCouponFormData({
      code: coupon.code,
      discountType: coupon.discountType || "PERCENTAGE",
      discountValue: coupon.discountValue || coupon.discountPercentage || 15,
      minOrderAmount: coupon.minOrderAmount || 0,
      isActive: coupon.isActive,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
      courseId: coupon.courseId || "",
      userId: coupon.userId || "",
      maxUses: coupon.maxUses || 50
    });
    setEditingCouponId(coupon._id);
    setIsCouponModalOpen(true);
  };

  const handleCouponDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      fetchCouponsList();
    }
  };

  const toggleCouponStatus = async (coupon: any) => {
    try {
      await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: coupon._id, isActive: !coupon.isActive })
      });
      fetchCouponsList();
    } catch (error) { console.error(error); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400">Discount Coupons & Limits Engine</h2>
          <p className="text-sm text-gray-400">Create promotional codes with strict usage caps, minimum order rules, and expiry dates.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCouponId(null);
            setCouponFormData({ code: "", discountType: "PERCENTAGE", discountValue: 15, minOrderAmount: 0, isActive: true, expiryDate: "", courseId: "", userId: "", maxUses: 50 });
            setIsCouponModalOpen(true);
          }} 
          className="px-4 py-2 bg-emerald-900/30 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Fixed Coupon
        </button>
      </div>

      {isLoading && couponsList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : couponsList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No coupons created yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {couponsList.map((coupon) => (
            <div key={coupon._id} className={`glass-panel p-6 border relative flex flex-col ${coupon.isActive ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-red-500/30 bg-red-950/10'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xl font-black text-emerald-400 tracking-wider bg-black/40 px-3 py-1 rounded-lg border border-emerald-500/20">{coupon.code}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleCouponEdit(coupon)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleCouponDelete(coupon._id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>

              <div className="text-3xl font-black text-white my-3 flex items-baseline gap-1">
                {coupon.discountType === "FLAT" ? `₹${coupon.discountValue || coupon.discountPercentage}` : `${coupon.discountValue || coupon.discountPercentage}%`} 
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">OFF ({coupon.discountType || "PERCENTAGE"})</span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-400 mb-6 bg-black/30 p-3 rounded-xl border border-gray-800">
                <div className="flex justify-between">
                  <span>Min Order Required:</span> <span className="text-emerald-400 font-bold">₹{coupon.minOrderAmount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fixed Usage Cap:</span> <span className="text-amber-400 font-bold">{coupon.usageCount || 0} / {coupon.maxUses} Uses</span>
                </div>
                <div className="flex justify-between">
                  <span>Course Target:</span> <span className="text-white font-mono">{coupon.courseId || "All Courses"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span> <span className="text-amber-400">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "Never"}</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-800">
                <span className={coupon.isActive ? "text-emerald-400 font-bold text-xs" : "text-red-400 font-bold text-xs"}>
                  {coupon.isActive ? "● Active" : "○ Inactive"}
                </span>
                <button 
                  onClick={() => toggleCouponStatus(coupon)}
                  className="text-xs text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors font-medium"
                >
                  {coupon.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ================= COUPON CREATION / EDIT MODAL ================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-emerald-500/30 rounded-3xl p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-emerald-400">{editingCouponId ? "Edit Fixed Coupon" : "Create Fixed Coupon"}</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Coupon Code</label>
                  <input required value={couponFormData.code} onChange={e => setCouponFormData({...couponFormData, code: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-emerald-400 font-mono uppercase outline-none focus:border-emerald-500" placeholder="e.g. AYUSH50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Discount Type</label>
                  <select value={couponFormData.discountType} onChange={e => setCouponFormData({...couponFormData, discountType: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500">
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FLAT">Flat INR (₹) OFF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Discount Value ({couponFormData.discountType === "FLAT" ? "₹" : "%"})</label>
                  <input required type="number" min="1" value={couponFormData.discountValue} onChange={e => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. 50 or 200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Min Order Amount (₹)</label>
                  <input required type="number" min="0" value={couponFormData.minOrderAmount} onChange={e => setCouponFormData({...couponFormData, minOrderAmount: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. 499 (0 for no limit)" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Fixed Max Uses Limit</label>
                  <input required type="number" min="1" value={couponFormData.maxUses} onChange={e => setCouponFormData({...couponFormData, maxUses: Number(e.target.value)})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. 50 uses" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Specific Course ID (Optional)</label>
                  <input value={couponFormData.courseId} onChange={e => setCouponFormData({...couponFormData, courseId: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. sa1 (leave blank for all)" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Expiry Date (Optional)</label>
                <input type="date" value={couponFormData.expiryDate} onChange={e => setCouponFormData({...couponFormData, expiryDate: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
              </div>

              <div className="pt-2 bg-black/30 p-4 rounded-xl border border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={couponFormData.isActive} onChange={e => setCouponFormData({...couponFormData, isActive: e.target.checked})} className="accent-emerald-500 w-5 h-5" />
                  <span className="text-emerald-400">Is Coupon Active Right Now?</span>
                </label>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg transition-all">
                <Save className="w-5 h-5"/> {editingCouponId ? "Update Coupon" : "Save & Publish Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}