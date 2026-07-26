"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Download } from "lucide-react";

export default function LeadsManagerTab() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeadsList();
  }, []);

  const fetchLeadsList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/early-bird");
      const data = await res.json();
      if (data.success) setLeadsList(data.leads);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const downloadLeads = () => {
    const headers = ["Name,Mobile,Subject,Registration Date"];
    const csvData = leadsList.map(lead => {
      return `${lead.name},${lead.mobile},${lead.subject},${new Date(lead.registeredAt).toLocaleDateString()}`;
    });
    const blob = new Blob([[...headers, ...csvData].join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AyushGyaan_EarlyBird_Leads.csv";
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-400">Early Bird Leads</h2>
          <p className="text-sm text-gray-400">Students pre-registered from the homepage marketing form.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLeadsList} className="px-4 py-2 bg-purple-900/30 text-purple-400 rounded-lg text-sm border border-purple-500/30 hover:bg-purple-900/50 transition-colors">
            <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'hidden'} inline mr-2`} /> Refresh
          </button>
          <button onClick={downloadLeads} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {isLoading && leadsList.length === 0 ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
      ) : leadsList.length === 0 ? (
        <div className="glass-panel p-10 text-center text-gray-500 border-dashed">No early bird registrations yet.</div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-widest font-black border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Scholar Name</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4">Interested Subject</th>
                  <th className="px-6 py-4">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leadsList.map((lead, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{lead.name}</td>
                    <td className="px-6 py-4 font-mono text-purple-400">{lead.mobile}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1">
                        {lead.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{new Date(lead.registeredAt).toLocaleDateString()}</td>
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