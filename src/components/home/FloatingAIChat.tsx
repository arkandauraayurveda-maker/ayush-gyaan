"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User as UserIcon, Sparkles, Loader2, X, ImageIcon, History, Zap, ChevronRight, Lock, Crown, CheckCircle2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import Link from "next/link";

type Message = { id: string; role: "user" | "model"; content: string; timestamp: number };
type ChatSession = { id: string; title: string; updatedAt: number; messages: Message[] };

export default function FloatingAIChat({ userId = "guest_user", courseId }: { userId?: string; courseId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
  
  // 🔥 User Plan State (Fetched from DB)
  const [userPlan, setUserPlan] = useState<{ tier: string; tokens: number } | null>(null);
  const [userName, setUserName] = useState("विद्वान");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistoryList, setChatHistoryList] = useState<ChatSession[]>([]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 🛡️ 1. SECURE INIT & FETCH USER PLAN
  // ==========================================
  useEffect(() => {
    const initChat = async () => {
      // 1. Load Razorpay Script
      if (!document.getElementById("razorpay-script")) {
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
      }

      // 2. Fetch User Plan Securely
      if (userId !== "guest_user") {
        try {
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken(true); 
            const res = await fetch("/api/user/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
              setUserPlan(data.aiPlan);
              if (data.name) setUserName(data.name);
            }
          }
        } catch (error) {
          console.error("Failed to secure user plan.");
        }
      }
      
      // 3. Load 7-Day History from LocalStorage
      loadLocalHistory();
    };
    
    if (isOpen) initChat();
  }, [isOpen, userId]);

  // ==========================================
  // 🧠 2. SMART 7-DAY HISTORY MANAGEMENT
  // ==========================================
  const loadLocalHistory = () => {
    const saved = localStorage.getItem(`ayush_chat_${userId}`);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (saved) {
      let parsedSessions: ChatSession[] = JSON.parse(saved);
      parsedSessions = parsedSessions.filter(session => (now - session.updatedAt) < SEVEN_DAYS);
      
      setChatHistoryList(parsedSessions);
      
      if (parsedSessions.length > 0) {
        setMessages(parsedSessions[0].messages); 
      } else {
        startNewChat();
      }
      localStorage.setItem(`ayush_chat_${userId}`, JSON.stringify(parsedSessions));
    } else {
      startNewChat();
    }
  };

  const saveToLocalHistory = (newMessages: Message[]) => {
    const title = newMessages.find(m => m.role === "user")?.content.substring(0, 30) + "..." || "New Consultation";
    const newSession: ChatSession = {
      id: "session_1", 
      title,
      updatedAt: Date.now(),
      messages: newMessages
    };
    setChatHistoryList([newSession]);
    localStorage.setItem(`ayush_chat_${userId}`, JSON.stringify([newSession]));
  };

  const startNewChat = () => {
    setMessages([{ id: Date.now().toString(), role: "model", content: `प्रणाम ${userName}! 🙏 मैं आयुष-ज्ञान का उन्नत AI आयुर्वेदाचार्य हूँ। आप संहिताओं के श्लोक, उनके गूढ़ अर्थ, या किसी भी नैदानिक (clinical) विषय पर मेरा मार्गदर्शन प्राप्त कर सकते हैं।`, timestamp: Date.now() }]);
  };

  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, isOpen]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ==========================================
  // 🚀 3. SECURE MESSAGE SENDING & CONTEXT
  // ==========================================
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || cooldown > 0) return;

    const userText = input.trim();
    setInput(""); setSelectedImage(null);
    
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: "user", content: userText || "📸 [चित्र संलग्न किया गया]", timestamp: Date.now() }];
    setMessages(newMessages);
    setIsLoading(true); setCooldown(3); 

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken(true) : null;

      // 🔥 FIX: Clean Context (अमान्य मैसेजेस को हटाना)
      const cleanContext = messages
        .filter(m => !m.content.includes("⚠️") && !m.content.includes("अपग्रेड"))
        .slice(-6);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ message: userText, courseId: courseId, image: selectedImage, history: cleanContext }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedMessages: Message[] = [...newMessages, { id: Date.now().toString(), role: "model", content: data.reply, timestamp: Date.now() }];
        setMessages(updatedMessages);
        saveToLocalHistory(updatedMessages); 
        
        if (userPlan && data.remainingTokens !== undefined) {
          setUserPlan({ ...userPlan, tokens: data.remainingTokens });
        }
      } else {
        triggerUpgradeCards(newMessages, data.error);
      }
    } catch (error) {
      setMessages([...newMessages, { id: Date.now().toString(), role: "model", content: "⚠️ नेटवर्क कनेक्शन बाधित है। कृपया अपने इंटरनेट की जाँच करें और पुनः प्रयास करें।", timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
  };

  // 🔥 TRIGGER UPGRADE UI IN CHAT
  const triggerUpgradeCards = (currentMessages: Message[], errorType: string) => {
    const errorMsg = errorType?.includes("limit") || errorType?.includes("अपग्रेड")
      ? "नमस्ते! आपके दैनिक निःशुल्क प्रश्नों की सीमा समाप्त हो गई है। आयुष-ज्ञान के साथ अपने अध्ययन को निर्बाध रूप से जारी रखने और उन्नत AI सुविधाओं का लाभ उठाने के लिए, कृपया हमारे प्रीमियम प्लान्स की ओर अपग्रेड करें।\n\n[PRICING_CARDS]"
      : `⚠️ ${errorType || "सर्वर से संपर्क स्थापित करने में त्रुटि हुई है।"}`;
      
    const finalMessages: Message[] = [...currentMessages, { id: Date.now().toString(), role: "model", content: errorMsg, timestamp: Date.now() }];
    setMessages(finalMessages);
    saveToLocalHistory(finalMessages);
  };

  // ==========================================
  // 💳 4. IN-CHAT PAYMENT HANDLER
  // ==========================================
  const handlePayment = async (planId: string) => {
    if (userId === "guest_user") return alert("कृपया प्रीमियम सुविधाओं का लाभ उठाने के लिए सर्वप्रथम लॉगिन करें।");

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken(true) : null;
      if (!idToken || !user) { setIsLoading(false); return alert("प्रमाणीकरण विफल (Authentication error)!"); }

      const orderRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ userId: user.uid, aiPlan: planId }) 
      });
      const orderData = await orderRes.json();

      if (!orderData.success) { setIsLoading(false); return alert("भुगतान आरंभ करने में विफल: " + orderData.error); }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AyushGyaan AI",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              aiPlan: planId
            })
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            setUserPlan({ tier: planId, tokens: planId === 'pro' ? 9999 : 1000 }); 
            const successMsg = [...messages, { id: Date.now().toString(), role: "model", content: `🎉 अभिनंदन! आपका अकाउंट सफलतापूर्वक ${planId.toUpperCase()} प्लान में अपग्रेड हो चुका है। अब आप असीमित AI मार्गदर्शन प्राप्त कर सकते हैं।`, timestamp: Date.now() }];
            setMessages(successMsg);
            saveToLocalHistory(successMsg);
          } else {
            alert("भुगतान सत्यापन विफल रहा (Verification failed)!");
          }
        },
        theme: { color: "#10B981" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setIsLoading(false);
    } catch (error) {
      console.error("Payment flow error:", error);
      alert("पेमेंट गेटवे से संपर्क करने में समस्या आ रही है।");
      setIsLoading(false);
    }
  };

  // ==========================================
  // 🎨 5. RENDER UI & PRICING CARDS
  // ==========================================
  const formatMessage = (text: string) => {
    if (text.includes("[PRICING_CARDS]")) {
      const parts = text.split("[PRICING_CARDS]");
      return (
        <div className="space-y-4">
          <span>{parts[0].replace(/\*\*/g, '')}</span>
          
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
            {/* PLUS PLAN */}
            <div className="min-w-[220px] bg-gradient-to-b from-blue-900/40 to-black/60 border border-blue-500/30 rounded-2xl p-4 snap-center shrink-0 shadow-lg">
              <h4 className="text-blue-400 font-black flex items-center gap-2 mb-1"><Zap className="w-4 h-4"/> Ayush Plus</h4>
              <p className="text-[10px] text-gray-400 mb-3">Ideal for BAMS Scholars</p>
              <h3 className="text-2xl font-bold text-white mb-4">₹199<span className="text-xs text-gray-500 font-normal">/mo</span></h3>
              <ul className="space-y-2 mb-4 text-xs text-gray-300">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-400"/> Expanded Daily Limits</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-400"/> Advanced Image Analysis</li>
              </ul>
              <button onClick={() => handlePayment('plus')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                Upgrade to Plus
              </button>
            </div>

            {/* PRO PLAN */}
            <div className="min-w-[220px] bg-gradient-to-b from-amber-900/40 to-black/60 border border-amber-500/40 rounded-2xl p-4 snap-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)] relative">
              <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">Popular</div>
              <h4 className="text-amber-400 font-black flex items-center gap-2 mb-1"><Crown className="w-4 h-4"/> Ayush Pro</h4>
              <p className="text-[10px] text-gray-400 mb-3">For Practitioners & Researchers</p>
              <h3 className="text-2xl font-bold text-white mb-4">₹499<span className="text-xs text-gray-500 font-normal">/mo</span></h3>
              <ul className="space-y-2 mb-4 text-xs text-gray-300">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-amber-400"/> Unlimited AI Consultations</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-amber-400"/> Gemini 1.5 Pro Intelligence</li>
              </ul>
              <button onClick={() => handlePayment('pro')} className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold rounded-lg shadow-md hover:scale-[1.02] transition-transform">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      );
    }
    return text.split('\n').map((line, idx) => (
      <span key={idx} className="block mb-1">{line.replace(/\*\*/g, '')}</span>
    ));
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-300/30 hover:scale-105 transition-transform"
          >
            <Sparkles className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#020604] md:bg-transparent md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[750px] md:max-h-[85vh] shadow-2xl"
          >
            <div className="flex flex-col h-full w-full md:rounded-3xl border border-emerald-900/50 bg-[#050B08]/95 backdrop-blur-2xl overflow-hidden relative pb-safe">
              
              {/* HEADER WITH DYNAMIC PLAN BADGE */}
              <div className="flex items-center justify-between p-4 border-b border-emerald-900/30 bg-black/60 z-20">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors relative">
                    <History className="w-5 h-5" />
                    {chatHistoryList.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">AyushGyaan AI</h3>
                    <p className="text-[10px] text-emerald-500/70">{userPlan?.tokens !== undefined ? `${userPlan.tokens} Tokens Remaining` : "Syncing Data..."}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 🔥 DYNAMIC BADGE / UPGRADE BUTTON */}
                  {userPlan?.tier === 'pro' ? (
                     <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                       <Crown className="w-3 h-3"/> PRO 
                     </div>
                  ) : (
                     <button onClick={() => triggerUpgradeCards(messages, "अपग्रेड")} className="flex items-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors">
                       <Zap className="w-3 h-3"/> Upgrade
                     </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 7-DAY HISTORY SIDEBAR */}
              <AnimatePresence>
                {isHistoryOpen && (
                  <motion.div 
                    initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }}
                    className="absolute inset-y-0 left-0 w-[80%] md:w-3/4 bg-[#0A1410] border-r border-emerald-900/50 z-30 shadow-2xl flex flex-col"
                  >
                    <div className="p-4 border-b border-emerald-900/30 bg-black/20 mt-[73px] flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4"/> 7-Day History</h4>
                      <button onClick={() => setIsHistoryOpen(false)} className="md:hidden text-gray-500"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {chatHistoryList.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center mt-10">No recent conversations.</p>
                      ) : (
                        chatHistoryList.map(chat => (
                          <button key={chat.id} onClick={() => { setMessages(chat.messages); setIsHistoryOpen(false); }} className="w-full text-left p-3 rounded-xl hover:bg-emerald-900/20 text-sm text-gray-300 transition-colors flex items-center justify-between group">
                            <span className="truncate pr-2">{chat.title}</span>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 shrink-0"/>
                          </button>
                        ))
                      )}
                      
                      <div className="m-2 mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/20 text-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-50"/>
                        <p className="text-[10px] text-gray-500">Chats auto-delete after 7 days for enhanced privacy.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CHAT MESSAGES AREA */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar z-0 bg-[#020604]" onClick={() => setIsHistoryOpen(false)}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1 ${msg.role === "user" ? "bg-teal-900/30 border-teal-500/30 text-teal-400" : "bg-emerald-900/30 border-emerald-500/30 text-emerald-400"}`}>
                      {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-md ${msg.role === "user" ? "bg-teal-600/90 text-white rounded-tr-sm" : "bg-[#0A1410] border border-emerald-900/40 text-gray-200 rounded-tl-sm overflow-hidden"}`}>
                      {formatMessage(msg.content)}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
                    <div className="bg-[#0A1410] border border-emerald-900/40 text-emerald-400 p-3 rounded-2xl rounded-tl-sm text-sm animate-pulse">शास्त्रों का विश्लेषण किया जा रहा है...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-3 bg-black/80 border-t border-emerald-900/30 z-20 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="relative flex flex-col bg-[#0A1410] border border-emerald-900/50 rounded-2xl focus-within:border-emerald-500/50 transition-colors">
                  <textarea
                    value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={cooldown > 0 ? "कृपया प्रतीक्षा करें..." : "श्लोक पूछें, रोग निदान पर चर्चा करें या चित्र अपलोड करें..."}
                    disabled={cooldown > 0 || isLoading}
                    className="w-full bg-transparent text-white placeholder-gray-600 p-4 pb-2 outline-none resize-none text-sm custom-scrollbar"
                    rows={1} style={{ minHeight: '52px' }}
                  />
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-emerald-400 rounded-xl transition-all">
                        <ImageIcon className="w-5 h-5" />
                        <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }}} className="hidden" accept="image/*" />
                      </button>
                    </div>
                    <button type="submit" disabled={(!input.trim() && !selectedImage) || isLoading || cooldown > 0} className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl flex items-center justify-center transition-all">
                      {cooldown > 0 ? <span className="text-xs font-bold">{cooldown}s</span> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}