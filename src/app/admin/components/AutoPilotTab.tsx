"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Play, Square, FileUp, Loader2 } from "lucide-react";

export default function AutoPilotTab() {
  // ==========================================
  // AUTO-PILOT STATES (Moved exactly as it was)
  // ==========================================
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);
  const [lastShloka, setLastShloka] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [samhita, setSamhita] = useState("Charak Samhita");
  const [sthana, setSthana] = useState("Sutrasthana");
  const [chapter, setChapter] = useState("1");
  
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ==========================================
  // LOGIC FUNCTIONS
  // ==========================================
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a valid PDF file only.");
        return;
      }
      setFileName(file.name);
      setIsUploading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPdfBase64(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAutoPilot = async () => {
    if (!pdfBase64) return alert("Please upload a Chapter PDF first!");
    
    setIsAutoPilotOn(true);
    isRunningRef.current = true;
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setStatusMessage("Checking database for resume point...");
    let currentLastShloka = "";
    try {
      const dbCheckRes = await fetch(`/api/shlokas/last-extracted?samhita=${encodeURIComponent(samhita)}&sthana=${encodeURIComponent(sthana)}&chapter=${chapter}`, { signal });
      const dbCheckData = await dbCheckRes.json();
      if (dbCheckData.success && dbCheckData.lastShloka) {
        currentLastShloka = dbCheckData.lastShloka;
        setStatusMessage(`Resuming. Extracting from Section ${currentLastShloka} onwards...`);
      } else {
        setStatusMessage("New chapter detected. Starting extraction from the beginning...");
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error("Database check failed", e);
      setStatusMessage("Database check failed. Starting extraction from the beginning...");
    }

    setLastShloka(currentLastShloka);
    if (isRunningRef.current) await sleep(2000);

    while (isRunningRef.current) {
      try {
        setStatusMessage(`Extracting section after: ${currentLastShloka || "Start"}...`);
        
        const response = await fetch("/api/extract-shloka", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64, samhita, sthana, chapter, lastExtractedShloka: currentLastShloka }),
          signal 
        });

        if (!isRunningRef.current) break;

        const result = await response.json();

        if (!response.ok) {
          setStatusMessage(`Error: ${result.error || result.details || "Unknown error"}`);
          stopAutoPilot();
          break;
        }

        if (result.data?.shlokaNumber === "COMPLETED") {
          setStatusMessage(`Congratulations! Chapter ${chapter} has been fully extracted.`);
          setIsAutoPilotOn(false);
          isRunningRef.current = false;
          break;
        }

        if (result.data?.shlokaNumber === currentLastShloka) {
           setStatusMessage(`Warning: AI repeated a section. Auto-Pilot stopped.`);
           stopAutoPilot();
           break;
        }

        currentLastShloka = result.data.shlokaNumber;
        setLastShloka(currentLastShloka);
        setExtractedCount(prev => prev + 1);
        setStatusMessage(`Success! Section ${currentLastShloka} extracted. Pausing for 6 seconds...`);
        
        if (isRunningRef.current) await sleep(6000);

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log("Process successfully aborted by user.");
          break;
        }
        setStatusMessage("Network error or API crash: " + error.message);
        stopAutoPilot();
        break;
      }
    }
  };

  const stopAutoPilot = () => {
    setIsAutoPilotOn(false);
    isRunningRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setStatusMessage("Auto-Pilot has been stopped.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">AI Shloka Auto-Pilot</h2>
      <p className="text-sm text-gray-400 mb-6">Upload the chapter PDF. The AI will automatically extract all sections one by one.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Samhita</label>
          <select value={samhita} onChange={(e) => setSamhita(e.target.value)} disabled={isAutoPilotOn || isUploading} className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none">
            <option value="Charak Samhita">Charak Samhita</option>
            <option value="Ashtang Hridaya">Ashtang Hridaya</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Sthana</label>
          <input type="text" value={sthana} onChange={(e) => setSthana(e.target.value)} disabled={isAutoPilotOn || isUploading} className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Chapter</label>
          <input type="number" value={chapter} onChange={(e) => setChapter(e.target.value)} disabled={isAutoPilotOn || isUploading} className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-sm text-gray-300 flex items-center gap-2"><FileUp className="w-4 h-4 text-primary" /> Upload Chapter PDF</label>
        <div className="relative w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-primary/50 transition-colors bg-black/30">
          <input type="file" accept="application/pdf" onChange={handleFileUpload} disabled={isAutoPilotOn || isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
          
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-primary font-medium">Processing PDF...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-sm text-gray-400">{fileName ? <span className="text-primary font-medium">{fileName}</span> : "Click to upload or drag & drop PDF"}</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-black/40 border border-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-accent text-sm font-bold">Auto-Pilot Status</h4>
          <p className="text-gray-400 text-xs mt-1">{statusMessage || "Standby (Ready)"}</p>
        </div>
        <div className="text-right">
          <h4 className="text-primary text-sm font-bold">Sections Extracted</h4>
          <p className="text-white text-lg font-bold">{extractedCount}</p>
        </div>
      </div>

      <div className="flex gap-4">
        {!isAutoPilotOn ? (
          <button onClick={startAutoPilot} disabled={isUploading} className="flex-1 bg-gradient-to-r from-primary/80 to-primary text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="w-5 h-5 fill-black" /> Start Auto-Pilot
          </button>
        ) : (
          <button onClick={stopAutoPilot} className="flex-1 bg-red-900/50 border border-red-500/50 text-red-200 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-900/80">
            <Square className="w-5 h-5 fill-red-200" /> Stop Auto-Pilot
          </button>
        )}
      </div>
    </motion.div>
  );
}