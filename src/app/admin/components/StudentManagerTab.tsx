"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

export default function StudentManagerTab() {
  const [studentList, setStudentList] = useState<any[]>([]);
  const [courseInputs, setCourseInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) setStudentList(json.data);
    } catch (error) { console.error("Failed to fetch students", error); }
    setIsLoading(false);
  };

  const updateCourseAccess = async (uid: string, courseId: string, action: "add" | "remove") => {
    if (!courseId || !courseId.trim()) return alert("Please enter a valid Course ID.");
    if (action === "remove" && !confirm(`Are you sure you want to remove access to '${courseId}'?`)) return;

    try {
      const res = await fetch("/api/admin/users/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, courseId: courseId.trim(), action })
      });
      const data = await res.json();

      if (data.success) {
        alert(`Course access successfully ${action}ed!`);
        fetchStudents(); 
        setCourseInputs(prev => ({ ...prev, [uid]: "" })); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Course Access Error:", error);
      alert("Failed to update course access.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">App Students</h2>
          <p className="text-sm text-gray-400">Manage users and grant/remove course access securely.</p>
        </div>
        <button onClick={fetchStudents} className="px-4 py-2 bg-blue-900/30 text-blue-400 rounded-lg text-sm border border-blue-500/30 hover:bg-blue-900/50 transition-colors flex items-center gap-2">
          <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'hidden'}`} /> Refresh List
        </button>
      </div>
      
      {isLoading && studentList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : studentList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No students found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentList.map((student) => (
            <div key={student.uid} className="glass-panel p-6 border border-gray-800 relative flex flex-col">
              
              {!student.isOnboarded && (
                <span className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded-full font-bold border border-yellow-500/30">Incomplete Profile</span>
              )}
              
              <h4 className="text-lg font-bold text-blue-400 mb-1">{student.name || "Unknown Student"}</h4>
              <p className="text-sm text-gray-300 mb-4">{student.email}</p>
              
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between border-b border-gray-800 pb-1">
                  <span>Mobile:</span> <span className="text-white">{student.mobile || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1">
                  <span>College:</span> <span className="text-white">{student.collegeName || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1">
                  <span>Course & Batch:</span> <span className="text-white">{student.course} ({student.batchYear || "N/A"})</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex-1 flex flex-col justify-end">
                <p className="text-xs font-bold text-gray-400 mb-2">Active Courses:</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {student.purchasedCourses && student.purchasedCourses.length > 0 ? (
                    student.purchasedCourses.map((courseId: string) => (
                      <span key={courseId} className="bg-emerald-900/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-500/30">
                        {courseId}
                        <button onClick={() => updateCourseAccess(student.uid, courseId, 'remove')} className="hover:text-red-400 ml-1 transition-colors" title="Remove Access">
                          <X className="w-3 h-3"/>
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-600 italic">No courses assigned yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Course ID (e.g. sa1)" 
                    value={courseInputs[student.uid] || ""} 
                    onChange={e => setCourseInputs({...courseInputs, [student.uid]: e.target.value})} 
                    className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                  />
                  <button 
                    onClick={() => updateCourseAccess(student.uid, courseInputs[student.uid], 'add')} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  >
                    Grant Access
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}