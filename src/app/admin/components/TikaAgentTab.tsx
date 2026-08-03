"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Play, Square, FileUp, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";

export default function TikaAgentTab() {
  const [samhita, setSamhita] = useState("Charak Samhita");
  const [sthana, setSthana] = useState("Sutrasthana");
  const [chapter, setChapter] = useState("1");
  
  const [pdfBase64, setPdfBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [extractedData, setExtractedData] = useState<any[]>([]);

  // 🔥 Abort Controller for stopping the API request manually
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. PDF Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a valid PDF file only.");
        return;
      }
      setFileName(file.name);
      setIsUploading(true);
      setStatusMessage("Converting PDF...");

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPdfBase64(base64String);
        setIsUploading(false);
        setStatusMessage("PDF Ready. Click Initialize to start.");
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. AI Extraction Trigger
  const startTikaExtraction = async () => {
    if (!pdfBase64) return alert("Please upload the Tika PDF first!");
    
    setIsExtracting(true);
    setStatusMessage("Initializing AI Agent... Analyzing Sanskrit Text & Grammar. This may take a minute.");
    setExtractedData([]);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const response = await fetch("/api/agents/extract-tika", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, samhita, sthana, chapter }),
        signal // Passes the abort signal to the fetch request
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatusMessage(`Extraction Complete! Data merged successfully using ${result.message || "AI"}.`);
        setExtractedData(result.data); // JSON array of shlokas with Tika
      } else {
        setStatusMessage(`Error: ${result.error || "Extraction failed. Rate limit or invalid PDF."}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatusMessage("Extraction was stopped by the user.");
      } else {
        setStatusMessage("Network error or API crash: " + error.message);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // 3. Stop Extraction Handler
  const stopExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExtracting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 max-w-4xl mx-auto border-teal-500/30 bg-[#050B08] shadow-2xl">
      
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-800 pb-6">
        <h2 className="text-3xl font-black text-teal-400 mb-3 flex items-center gap-3">
          <Sparkles className="w-8 h-8" /> Tika & Grammar AI Agent
        </h2>
        <p className="text-sm text-gray-400 font-medium">
          Upload your pure Sanskrit commentary PDF. The AI will intelligently extract the Tika, translate it into Hindi, identify Tantra Yukti, and parse Vyakarana (Grammar) rules using smart JSON mapping.
        </p>
      </div>

      {/* Target Mapping Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Samhita</label>
          <select value={samhita} onChange={(e) => setSamhita(e.target.value)} disabled={isExtracting} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors">
            <option value="Charak Samhita">Charak Samhita</option>
            <option value="Sushruta Samhita">Sushruta Samhita</option>
            <option value="Ashtang Hridaya">Ashtang Hridaya</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sthana</label>
          <input type="text" value={sthana} onChange={(e) => setSthana(e.target.value)} disabled={isExtracting} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors" placeholder="e.g. Sutrasthana" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chapter Number</label>
          <input type="number" value={chapter} onChange={(e) => setChapter(e.target.value)} disabled={isExtracting} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none transition-colors" />
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-2 mb-8">
        <label className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
          <FileUp className="w-4 h-4" /> Upload Sanskrit Tika PDF
        </label>
        <div className="relative w-full h-40 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center hover:border-teal-500/50 hover:bg-teal-900/10 transition-all bg-black/30 group">
          <input type="file" accept="application/pdf" onChange={handleFileUpload} disabled={isExtracting || isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
          
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
              <p className="text-sm text-teal-400 font-bold">Processing PDF Document...</p>
            </>
          ) : (
            <>
              <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${fileName ? "text-teal-500" : "text-gray-500 group-hover:text-teal-400"}`} />
              <p className="text-sm text-gray-400">{fileName ? <span className="text-teal-400 font-bold">{fileName}</span> : "Click or drag your Sanskrit PDF here"}</p>
            </>
          )}
        </div>
      </div>

      {/* Action Button & Status */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        
        {/* Toggle Start/Stop Button */}
        {!isExtracting ? (
          <button 
            onClick={startTikaExtraction} 
            disabled={isUploading || !pdfBase64} 
            className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 text-black font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            <Play className="w-5 h-5 fill-black" /> Initialize AI Extraction
          </button>
        ) : (
          <button 
            onClick={stopExtraction} 
            className="w-full sm:w-auto bg-red-900/50 border border-red-500/50 text-red-200 font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/80 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Square className="w-5 h-5 fill-red-200" /> Stop Extraction
          </button>
        )}

        <div className="flex-1 bg-black/40 border border-gray-800 rounded-xl p-4 w-full">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Agent Status Console</h4>
          <p className={`text-sm font-bold flex items-center gap-2 ${statusMessage.includes("Error") || statusMessage.includes("stopped") ? "text-red-400" : "text-teal-300"}`}>
            {isExtracting && <Loader2 className="w-4 h-4 animate-spin" />}
            {statusMessage || "Standby. Waiting for PDF..."}
          </p>
        </div>
      </div>

      {/* Results Preview - Fixed object keys based on API */}
      {extractedData.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8 border-t border-gray-800 pt-6">
          <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5" /> Successfully Extracted ({extractedData.length} Sections)
          </h4>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {extractedData.map((data, idx) => (
              <div key={idx} className="bg-black/40 border border-teal-900/30 p-5 rounded-xl shadow-inner">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs bg-teal-900/40 text-teal-300 px-3 py-1.5 rounded-md font-bold uppercase tracking-widest border border-teal-700/50">
                    Shloka {data.shlokaNumber} {/* Fixed Key */}
                  </span>
                  {data.tantraYukti && (
                     <span className="text-[10px] text-amber-400 bg-amber-900/20 px-2 py-1 rounded font-bold">
                       Tantra Yukti: {data.tantraYukti}
                     </span>
                  )}
                </div>
                <p className="text-base text-gray-200 font-serif leading-relaxed mb-3">{data.tikaSanskrit}</p> {/* Fixed Key */}
                
                {data.tikaHindi && (
                  <div className="bg-black/50 p-3 rounded-lg border-l-2 border-teal-500">
                    <p className="text-sm text-gray-400">{data.tikaHindi}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}