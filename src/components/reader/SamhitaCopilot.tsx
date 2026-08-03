"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Mic, Loader2, Link as LinkIcon, Database } from "lucide-react";

export default function SamhitaCopilot({ activeShloka }: { activeShloka: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState([
    { role: "ai", text: "Namaste! 🙏 I am your Clinical AI Copilot. Ask me anything about the Shloka you are currently reading." }
  ]);

  // Quick prompt suggestions based on current context
  const quickPrompts = [
    "Simplify the Vimarsh",
    "What are the clinical applications?",
    "Explain the Dosha involvement",
  ];

  // Auto-scroll to bottom of chat whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    // Add User Message to UI instantly
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // 🔥 REAL BACKEND API CALL (Fully Activated & Handled)
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, context: activeShloka })
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        setMessages([...newMessages, { role: "ai", text: data.answer }]);
      } else {
        setMessages([...newMessages, { role: "ai", text: `Sorry, I encountered an issue: ${data.error || "Server Error"}` }]);
      }
    } catch (error) {
      console.error("Copilot Fetch Error:", error);
      setMessages([...newMessages, { role: "ai", text: "Network error. Please check your internet connection and try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* 🟢 FLOATING ACTION BUTTON (Visible when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all z-50 flex items-center gap-3 group"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="hidden md:block font-bold text-sm pr-2">Ask AI Copilot</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 🤖 THE COPILOT PANEL (Right Drawer on Desktop, Full Modal on Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] lg:w-[450px] bg-[#050B08]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-white/10 bg-black/20 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> AyushGyaan AI
                </h3>
                
                {/* Context Indicator (Shows which Shloka AI is looking at) */}
                <div className="flex items-center gap-1.5 mt-1">
                  <LinkIcon className="w-3 h-3 text-teal-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                    {activeShloka ? `Linked to Shloka ${activeShloka.shlokaNumber}` : "No Shloka Selected"}
                  </span>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* 🔥 FIXED: Added 'whitespace-pre-wrap' so that AI's paragraphs and bullet points render properly */}
                  <div className={`max-w-[85%] p-3.5 text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${msg.role === "user" ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm" : "bg-gradient-to-br from-white/10 to-transparent border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-3">
                    <Database className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span className="text-xs text-gray-400">Analyzing clinical context...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts (Only if context exists) */}
            {activeShloka && messages.length < 3 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t border-white/5">
                {quickPrompts.map((prompt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(prompt)} 
                    disabled={isTyping}
                    className="whitespace-nowrap text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-colors font-medium disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
                <button type="button" className="absolute left-3 p-1.5 text-gray-400 hover:text-emerald-400 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask a clinical doubt..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
                />
                
                <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-lg transition-all">
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}