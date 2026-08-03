"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, Database, ShieldCheck, Loader2 } from "lucide-react";

type ChatState = 
  | "idle" 
  | "user_typing" 
  | "ai_analyzing" 
  | "ai_answering" 
  | "user_voice" 
  | "voice_transcribing"
  | "ai_analyzing_2"
  | "ai_answering_2"
  | "done";

export default function AIChatSimulator() {
  const [phase, setPhase] = useState<ChatState>("idle");
  const [userText1, setUserText1] = useState("");
  const [aiText1, setAiText1] = useState("");
  const [userText2, setUserText2] = useState("");
  const [aiText2, setAiText2] = useState("");

  // 🌿 1st Question (Text Typing)
  const q1 = "आयुर्वेद के अवतरण को चरक के अनुसार समझाओ?";
  const a1 = "चरक संहिता के सूत्रस्थान (दीर्घञ्जीवितीयम् अध्याय) के श्लोक 3, 4 और 5 में आयुर्वेद के अवतरण का वर्णन इस प्रकार है:\n\n॥ श्लोक ३ ॥\nदीर्घञ्जीवितीयमन्विच्छन् भरद्वाज उपागमत्।\nइन्द्रमुग्रतपा बुद्ध्वा शरण्यममरेश्वरम् ॥\n\n॥ श्लोक ४ ॥\nब्रह्मणा हि प्रणीतं हि पुण्यमायुर्वेदं प्रजापतिः।\nजग्राह निखिलेनादावश्विनौ तु पुनस्ततः ॥\n\n॥ श्लोक ५ ॥\nअश्विभ्यां भगवाञ्छक्रः प्रतिपेदे ह केवलम्।\nऋषिप्रोक्तो भरद्वाजस्तस्माच्छक्रमुपागमत् ॥\n\n🔸 हिंदी भावार्थ:\nउग्र तपस्या करने वाले महर्षि भरद्वाज ने दीर्घायु की इच्छा से देवराज इन्द्र की शरण ली। सबसे पहले ब्रह्मा जी ने इस पवित्र आयुर्वेद का स्मरण कर दक्ष प्रजापति को इसका ज्ञान दिया। प्रजापति से अश्विनी कुमारों ने, और अश्विनी कुमारों से भगवान इन्द्र ने इसे प्राप्त किया। इसी कारण ऋषियों के प्रतिनिधि बनकर महर्षि भरद्वाज इन्द्र के पास गए।";

  // 🎤 2nd Question (Voice Input)
  const q2 = "इन्द्र के बाद आयुर्वेद का ज्ञान पृथ्वी पर कैसे आया?";
  const a2 = "महर्षि भरद्वाज ने इन्द्र से आयुर्वेद सीखकर उसे पृथ्वी पर अन्य ऋषियों (जैसे महर्षि आत्रेय) को सिखाया। \n\nआत्रेय जी ने अपने ६ शिष्यों— अग्निवेश, भेल, जतूकर्ण, पराशर, हारीत और क्षारपाणि— को इसका उपदेश दिया। इनमें से अग्निवेश ने 'अग्निवेश तन्त्र' की रचना की, जिसे बाद में महर्षि चरक ने प्रतिसंस्कृत करके 'चरक संहिता' का रूप दिया।";

  useEffect(() => {
    // 🎭 THE MASTER SEQUENCE 🎭
    const runDemo = async () => {
      // 1. User Types Q1
      setPhase("user_typing");
      for (let i = 0; i <= q1.length; i++) {
        setUserText1(q1.slice(0, i));
        await new Promise(r => setTimeout(r, 40));
      }
      await new Promise(r => setTimeout(r, 500));

      // 2. AI Analyzes Q1
      setPhase("ai_analyzing");
      await new Promise(r => setTimeout(r, 2000));

      // 3. AI Types A1 (Speed up thoda kyuki text lamba hai)
      setPhase("ai_answering");
      for (let i = 0; i <= a1.length; i++) {
        setAiText1(a1.slice(0, i));
        await new Promise(r => setTimeout(r, 15)); // Fast typing for long shlokas
      }
      await new Promise(r => setTimeout(r, 2500));

      // 4. User Voice Record UI
      setPhase("user_voice");
      await new Promise(r => setTimeout(r, 3000));

      // 5. Voice to Text
      setPhase("voice_transcribing");
      setUserText2(q2);
      await new Promise(r => setTimeout(r, 1500));

      // 6. AI Analyzes Q2
      setPhase("ai_analyzing_2");
      await new Promise(r => setTimeout(r, 2000));

      // 7. AI Types A2
      setPhase("ai_answering_2");
      for (let i = 0; i <= a2.length; i++) {
        setAiText2(a2.slice(0, i));
        await new Promise(r => setTimeout(r, 25));
      }
      
      setPhase("done");
      
      // Loop the demo after 8 seconds
      setTimeout(() => {
        setPhase("idle");
        setUserText1(""); setAiText1(""); setUserText2(""); setAiText2("");
        runDemo();
      }, 8000);
    };

    runDemo();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-[#030a07]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-[2rem] p-4 md:p-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white tracking-wide">Samhita AI Engine</h4>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3 h-3"/> Charak Sutrasthana Loaded</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 relative pr-2">
        
        {/* === Q1 AREA (User Text) === */}
        {phase !== "idle" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="self-end max-w-[85%] bg-white/5 border border-white/10 rounded-2xl rounded-tr-sm p-3 text-sm text-gray-200">
            {userText1}
            {phase === "user_typing" && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />}
          </motion.div>
        )}

        {/* AI Analyzing 1 */}
        {phase === "ai_analyzing" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-2 rounded-xl">
            <Database className="w-3.5 h-3.5 animate-bounce" /> Scanning Charak Samhita...
          </motion.div>
        )}

        {/* AI Answer 1 (Shlokas) */}
        {(phase === "ai_answering" || phase === "user_voice" || phase === "voice_transcribing" || phase === "ai_analyzing_2" || phase === "ai_answering_2" || phase === "done") && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start w-[95%] bg-gradient-to-br from-emerald-950/60 to-transparent border border-emerald-500/30 rounded-2xl rounded-tl-sm p-4 text-[13px] md:text-sm text-emerald-50 leading-relaxed whitespace-pre-wrap shadow-lg">
            {aiText1}
            {phase === "ai_answering" && <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />}
          </motion.div>
        )}

        {/* === VOICE Q2 AREA === */}
        {phase === "user_voice" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="self-end max-w-[85%] bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 flex items-center gap-3">
            <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
            <div className="flex gap-1.5 items-center h-4">
              {[1,2,3,4,5,6].map((i) => (
                <motion.div key={i} animate={{ height: ["20%", "100%", "20%"] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-1 bg-blue-400 rounded-full" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Voice Transcribed Text */}
        {(phase === "voice_transcribing" || phase === "ai_analyzing_2" || phase === "ai_answering_2" || phase === "done") && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-end max-w-[85%] bg-white/5 border border-white/10 rounded-2xl rounded-tr-sm p-3 text-sm text-gray-200">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-1 flex items-center gap-1"><Mic className="w-3 h-3"/> Voice Transcribed</span>
            {userText2}
          </motion.div>
        )}

        {/* AI Analyzing 2 */}
        {phase === "ai_analyzing_2" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-2 rounded-xl">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cross-referencing History...
          </motion.div>
        )}

        {/* AI Answer 2 */}
        {(phase === "ai_answering_2" || phase === "done") && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start w-[95%] bg-gradient-to-br from-emerald-950/60 to-transparent border border-emerald-500/30 rounded-2xl rounded-tl-sm p-4 text-[13px] md:text-sm text-emerald-50 leading-relaxed whitespace-pre-wrap shadow-lg">
            {aiText2}
            {phase === "ai_answering_2" && <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />}
          </motion.div>
        )}

        {/* Auto-scroll anchor - ye hamesha scroll ko neeche rakhega */}
        <div className="h-2 shrink-0" />
      </div>
    </div>
  );
}