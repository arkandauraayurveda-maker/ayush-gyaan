"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Pencil, Save, Eye, EyeOff, Trash2, Calendar, Ticket, Loader2, X } from "lucide-react";

export default function CourseManagerTab() {
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    courseId: "", title: "", prof: "", status: "Available Now", 
    price: "", originalPrice: "", discountText: "", badge: "",
    startDate: "", couponCode: "",
    duration: "1-Year Access", syllabus: "", highlight: false, isActive: true
  });

  useEffect(() => {
    fetchCoursesList();
  }, []);

  const fetchCoursesList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.success) setCoursesList(data.courses);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCourseId ? "PUT" : "POST";
    const payload = {
      ...courseFormData,
      _id: editingCourseId,
      syllabus: courseFormData.syllabus.split(",").map(s => s.trim()) 
    };

    try {
      const res = await fetch("/api/courses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Course ${editingCourseId ? "Updated" : "Created"} Successfully!`);
        setIsCourseModalOpen(false);
        fetchCoursesList();
      }
    } catch (error) { console.error(error); }
  };

  const handleCourseEdit = (course: any) => {
    setCourseFormData({
      ...course,
      syllabus: course.syllabus.join(", ")
    });
    setEditingCourseId(course._id);
    setIsCourseModalOpen(true);
  };

  const handleCourseDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this course completely?")) {
      await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
      fetchCoursesList();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-400">Manage Website Courses</h2>
          <p className="text-sm text-gray-400">Create or edit the academic modules visible on the homepage.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCourseId(null);
            setCourseFormData({ courseId: "", title: "", prof: "", status: "Available Now", price: "", originalPrice: "", discountText: "", badge: "", startDate: "", couponCode: "", duration: "1-Year Access", syllabus: "", highlight: false, isActive: true });
            setIsCourseModalOpen(true);
          }} 
          className="px-4 py-2 bg-amber-900/30 text-amber-400 rounded-lg text-sm font-bold border border-amber-500/30 hover:bg-amber-900/50 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Course
        </button>
      </div>

      {isLoading && coursesList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : coursesList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No courses currently exist in the database.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesList.map((course) => (
            <div key={course._id} className={`glass-panel p-6 border relative flex flex-col ${course.isActive ? 'border-amber-500/20' : 'border-red-500/30 bg-red-950/10'}`}>
              {course.badge && <span className="absolute -top-3 left-6 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{course.badge}</span>}
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white">{course.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleCourseEdit(course)} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleCourseDelete(course._id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{course.prof} | {course.courseId}</p>
              
              <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                <span className="text-2xl font-black text-amber-400">{course.price}</span>
                {course.originalPrice && <span className="text-xs line-through text-gray-500">{course.originalPrice}</span>}
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold bg-black/40 p-3 rounded-lg border border-gray-800">
                  <span className={course.isActive ? "text-emerald-400 flex items-center gap-1.5" : "text-red-400 flex items-center gap-1.5"}>
                    {course.isActive ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>} 
                    {course.isActive ? "Live on Website" : "Hidden"}
                  </span>
                  {course.highlight && <span className="text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded">Recommended</span>}
                </div>
                <div className="flex gap-2">
                  {course.startDate && <span className="flex-1 text-[10px] text-center bg-black/40 border border-gray-800 p-2 rounded-lg text-gray-400 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> {course.startDate}</span>}
                  {course.couponCode && <span className="flex-1 text-[10px] text-center bg-emerald-900/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1"><Ticket className="w-3 h-3"/> {course.couponCode}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= COURSE CREATION MODAL ================= */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-amber-500/30 rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-amber-400">{editingCourseId ? "Edit Course Data" : "Create New Course"}</h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Course ID (Unique)</label>
                  <input required value={courseFormData.courseId} onChange={e => setCourseFormData({...courseFormData, courseId: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. sa1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Course Title</label>
                  <input required value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. Samhita Adhyayan I" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Prof / Category</label>
                  <input required value={courseFormData.prof} onChange={e => setCourseFormData({...courseFormData, prof: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. BAMS 1st Professional" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Action Status</label>
                  <input required value={courseFormData.status} onChange={e => setCourseFormData({...courseFormData, status: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. Available Now, Coming Soon" />
                </div>
              </div>

              <div className="bg-black/30 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4">Pricing & Marketing Info</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-1 block">Sale Price</label>
                    <input required value={courseFormData.price} onChange={e => setCourseFormData({...courseFormData, price: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. ₹599" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-1 block">Original Price</label>
                    <input value={courseFormData.originalPrice} onChange={e => setCourseFormData({...courseFormData, originalPrice: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. ₹1999" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold mb-1 block">Sales Badge</label>
                    <input value={courseFormData.badge} onChange={e => setCourseFormData({...courseFormData, badge: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. HOT 🔥" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-blue-400 font-bold mb-1 block">Start Date (Optional)</label>
                    <input value={courseFormData.startDate} onChange={e => setCourseFormData({...courseFormData, startDate: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-sm text-white outline-none focus:border-blue-500" placeholder="e.g. Starts 15 Aug" />
                  </div>
                  <div>
                    <label className="text-xs text-emerald-400 font-bold mb-1 block">Discount Coupon (Optional)</label>
                    <input value={courseFormData.couponCode} onChange={e => setCourseFormData({...courseFormData, couponCode: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. BAMS50" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Syllabus Details (Comma Separated)</label>
                <textarea required value={courseFormData.syllabus} onChange={e => setCourseFormData({...courseFormData, syllabus: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-sm text-white outline-none focus:border-amber-500 h-28 resize-none" placeholder="Charak Sutrasthana (Ch 1-12), Ashtang Hridaya (Ch 1-15)..."></textarea>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-2 bg-black/30 p-4 rounded-xl border border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={courseFormData.highlight} onChange={e => setCourseFormData({...courseFormData, highlight: e.target.checked})} className="accent-amber-500 w-5 h-5" />
                  <span className="text-amber-400">Highlight as Recommended?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={courseFormData.isActive} onChange={e => setCourseFormData({...courseFormData, isActive: e.target.checked})} className="accent-emerald-500 w-5 h-5" />
                  <span className="text-emerald-400">Make Course Live on Website?</span>
                </label>
              </div>

              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black py-4 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                <Save className="w-5 h-5"/> {editingCourseId ? "Update Course Data" : "Publish New Course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}