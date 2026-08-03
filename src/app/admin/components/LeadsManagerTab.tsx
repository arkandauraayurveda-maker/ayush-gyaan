"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, Mail, Phone, CheckCircle2 } from "lucide-react";

export default function LeadsManagerTab() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeadsList();
  }, []);

  const fetchLeadsList = async () => {
    setIsLoading(true);
    try {
      // 🔥 Nayi API se data fetch kar rahe hain
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      if (data.success) setLeadsList(data.leads);
    } catch (error) { 
      console.error(error); 
    }
    setIsLoading(false);
  };

  const downloadLeads = () => {
    // 🔥 CSV headers aur mapping update kar di gayi hai naye model ke hisaab se
    const headers = ["Name,Email,Mobile,Status,Registration Date"];
    const csvData = leadsList.map(lead => {
      return `"${lead.name}","${lead.email}","${lead.mobile}","${lead.status}","${new Date(lead.createdAt).toLocaleDateString()}"`;
    });
    
    const blob = new Blob([[...headers, ...csvData].join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AyushGyaan_Leads_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-400">Pre-Registration Leads</h2>
          <p className="text-sm text-gray-400">Marketing data of students waiting for early-bird discounts.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={fetchLeadsList} className="flex-1 sm:flex-none px-4 py-2 bg-purple-900/30 text-purple-400 rounded-lg text-sm border border-purple-500/30 hover:bg-purple-900/50 transition-colors flex items-center justify-center">
            <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'hidden'} inline mr-2`} /> Refresh
          </button>
          <button onClick={downloadLeads} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {isLoading && leadsList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
      ) : leadsList.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-500 border-dashed">
          No early bird registrations yet. Start marketing!
        </div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-widest font-black border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Scholar Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leadsList.map((lead, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-bold text-white capitalize">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2 text-xs text-gray-300"><Mail className="w-3 h-3 text-emerald-500" /> {lead.email}</span>
                        <span className="flex items-center gap-2 text-xs text-gray-300"><Phone className="w-3 h-3 text-emerald-500" /> {lead.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex w-fit items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                        <CheckCircle2 className="w-3 h-3" /> {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}