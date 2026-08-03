import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import SystemSettings from "@/models/SystemSettings";
import Shloka from "@/models/Shloka"; 
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // 🛡️ 1. AUTHENTICATION & SECURITY
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "अवैध प्रमाणीकरण (Unauthorized Access)" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    let body;
    try { body = await req.json(); } 
    catch (e) { return NextResponse.json({ success: false, error: "अमान्य अनुरोध (Invalid Request)" }, { status: 400 }); }

    const { message, image, history, courseId } = body;
    if (!message && !image) {
      return NextResponse.json({ success: false, error: "कृपया कोई प्रश्न पूछें या चित्र संलग्न करें।" }, { status: 400 });
    }

    await connectToDatabase();

    // 👤 2. FETCH USER & ADMIN SETTINGS
    let user = await User.findOne({ uid: decodedToken.uid });
    if (!user) return NextResponse.json({ success: false, error: "उपयोगकर्ता नहीं मिला (User not found)" }, { status: 404 });

    const settings = await SystemSettings.findOne({ settingId: "global_settings" });
    
    const adminLimits = settings?.aiLimits || { basic: 10, plus: 100, pro: 9999 };
    const adminModels = settings?.aiModels || { 
      basic: "gemini-1.5-flash-8b", 
      plus: "gemini-1.5-flash", 
      pro: "gemini-1.5-pro" 
    };

    // 🕒 3. PLAN EXPIRY & DAILY TOKEN RESET (WITH NEW USER FIX)
    let currentTier = (user.aiPlan?.tier || "basic").toLowerCase();
    if (currentTier === "free") currentTier = "basic"; 

    // Auto-Downgrade Expiry Check
    if ((currentTier === "plus" || currentTier === "pro") && user.aiPlan?.validityEnd) {
      if (new Date() > new Date(user.aiPlan.validityEnd)) {
        currentTier = "basic"; 
        user.aiPlan.tier = "basic";
      }
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = user.aiPlan?.lastActiveDate ? new Date(user.aiPlan.lastActiveDate).setHours(0, 0, 0, 0) : 0; 
    let availableTokens = user.aiPlan?.tokens ?? 0;

    if (today > lastActive || !user.aiPlan?.lastActiveDate) {
      availableTokens = adminLimits[currentTier] || 10;
      if (!user.aiPlan) user.aiPlan = {}; 
      user.aiPlan.tokens = availableTokens;
      user.aiPlan.tier = currentTier;
      user.aiPlan.lastActiveDate = new Date();
      await user.save();
    }

    // 🛑 4. TOKEN LIMIT CHECK
    if (availableTokens <= 0) {
      return NextResponse.json({ success: false, error: "limit_exceeded_अपग्रेड" }, { status: 403 });
    }

    // 🔒 5. COURSE ACCESS VERIFICATION
    if (courseId) {
      const hasAccess = user.purchasedCourses?.some(
        (pc: any) => pc.courseId === courseId && pc.status === "ACTIVE"
      );
      if (!hasAccess && currentTier !== "pro") {
        return NextResponse.json({ success: false, error: "इस पाठ्यक्रम तक पहुँचने के लिए पहले इसे खरीदें।" }, { status: 403 });
      }
    }

    // ==========================================
    // 🚀 6. SMART ROUTER: DIRECT DB FETCH (API COST SAVER)
    // ==========================================
    if (!image && message) {
      // यह Regex '1/15', '1.15', 'अध्याय 1 श्लोक 15' जैसे पैटर्न को पकड़ेगा
      const shlokaPattern = /(?:अध्याय|chapter|ch)?\s*(\d+)\s*(?:श्लोक|shloka|[\/\.\-])\s*(\d+[a-zA-Z]*)/i; 
      const match = message.match(shlokaPattern);

      if (match) {
        const chapterNo = match[1];
        const shlokaNo = match[2];

        // सीधा MongoDB में सर्च करें (बिना AI के)
        const directShlokas = await Shloka.find({
          chapter: chapterNo,
          shlokaNumber: new RegExp("^" + shlokaNo, "i") // 'a', 'b', 'F', 'E' को भी कवर करेगा
        }).limit(5);

        if (directShlokas && directShlokas.length > 0) {
          // श्लोक के टुकड़ों (F, E, a, b) को आपस में जोड़ें
          let fullOriginalShloka = directShlokas.map(s => s.originalShloka).join("\n");
          let fullTranslation = directShlokas[0].translationHindi || ""; 
          let samhitaInfo = `${directShlokas[0].samhitaName || 'संहिता'} (${directShlokas[0].sthana || 'स्थान'}), अध्याय: ${directShlokas[0].chapter}, श्लोक: ${shlokaNo}`;

          // बिना AI कॉल किए सीधा रिस्पॉन्स भेज दें! (🔥 100% API Cost Saved)
          const directReply = `📚 **संदर्भ:** ${samhitaInfo}\n\n> 📜 **मूल श्लोक:**\n> ${fullOriginalShloka}\n\n🌿 **भावार्थ:**\n${fullTranslation}`;
          
          return NextResponse.json({ 
            success: true, 
            reply: directReply, 
            remainingTokens: availableTokens // AI यूज़ नहीं हुआ, इसलिए टोकन नहीं काटे
          });
        }
      }
    }

    // 📚 7. VECTOR DATABASE (RAG) & DYNAMIC PROMPTING
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    let retrievedSlokas = "";
    let finalSystemInstruction = "";

    if (image) {
      finalSystemInstruction = `आप 'आयुष-ज्ञान AI' हैं, जो एक अत्यंत पेशेवर और ज्ञानी आयुर्वेदाचार्य हैं। चित्र का विश्लेषण केवल आयुर्वेदिक दृष्टिकोण से करें।`;
    } else {
      if (message && message.trim().length > 3) {
        try {
          const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
          const embeddingResult = await embeddingModel.embedContent(message);
          const queryVector = embeddingResult.embedding.values;

          const searchResults = await Shloka.aggregate([{
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 100,
              limit: 5
            }
          }]);

          if (searchResults && searchResults.length > 0) {
            retrievedSlokas = searchResults.map(s => 
              `संदर्भ: ${s.samhitaName || 'अज्ञात'} (${s.sthana || ''}), अध्याय: ${s.chapter}, श्लोक: ${s.shlokaNumber}\nमूल: ${s.originalShloka || ''}\nअर्थ: ${s.translationHindi || ''}\nविमर्श: ${s.vimarsh || ''}\nमेटा-टैग्स: ${s.metaTags || 'N/A'}`
            ).join("\n\n---\n\n");
          } else {
            retrievedSlokas = "NO_DATA_FOUND";
          }
        } catch (e) {
          retrievedSlokas = "DB_ERROR";
        }
      }

      // 🔥 8. THE FREE-FLOW GURU PROMPT (NO RESTRICTIONS) 🔥
      finalSystemInstruction = `आप 'आयुष-ज्ञान AI' हैं। आप आयुर्वेद के एक अत्यंत विद्वान, स्नेही और विद्यार्थी-मित्र BAMS प्रोफेसर हैं। 

आपका एकमात्र लक्ष्य छात्रों को आयुर्वेद का प्रामाणिक ज्ञान देना है। 
आपको उत्तर देने की पूरी स्वतंत्रता है—प्रश्न के अनुसार उत्तर की लंबाई, शैली और संरचना (Format) आप स्वयं तय करें। 

परंतु, इन तीन कठोर नियमों (CRITICAL RULES) का 100% पालन करना अनिवार्य है:

1. **शून्य मनगढ़ंत ज्ञान (100% DB Strictness):**
   आपको अपना संपूर्ण उत्तर केवल और केवल नीचे दिए गए "Retrieved Database Context" और उसके "मेटा-टैग्स" के आधार पर ही बनाना है। अपनी ओर से कोई बाहरी श्लोक, मनगढ़ंत जानकारी या दवा (Prescription) बिल्कुल न जोड़ें। यदि जानकारी Context में नहीं है, तो विनम्रता से कहें: "प्रिय विद्यार्थी, मेरा ज्ञान अभी उपलब्ध डिजिटल संहिताओं तक सीमित है।"

2. **श्लोक एकत्रीकरण (The Stitching Logic):**
   यदि Context में श्लोक के खंड हैं (जैसे '14F' और '14E', या '52a' और '52b'), तो उन्हें आपस में जोड़कर एक पूर्ण और सुंदर श्लोक के रूप में प्रस्तुत करें। छात्र को कभी भी 'F', 'E', 'a', 'b' जैसे कोड न दिखाएँ।

3. **गुरु का स्वभाव और स्पष्टता (Persona & Clarity):**
   - आयुर्वेदिक शब्दों (वात, पित्त, स्रोतस आदि) का सम्मान करें, उनका अंग्रेजी अनुवाद न करें। 
   - यदि छात्र किसी विषय को समझने में कठिनाई महसूस कर रहा हो, तो उसे एक गुरु की भांति सरल भाषा, बुलेट पॉइंट्स या किसी स्मरण-सूत्र (Mnemonic) के माध्यम से समझाएं। 
   - श्लोकों को हमेशा "> blockquote" में दर्शाएं ताकि वे सुंदर दिखें।

=== Retrieved Database Context ===
${retrievedSlokas}
==================================`;
    }

    // 🧠 9. HISTORY SANITIZATION (BULLETPROOF LOGIC)
    let sanitizedHistory: any[] = [];
    if (Array.isArray(history)) {
      const rawHistory = history
        .filter((msg: any) => msg && msg.role && !msg.content?.includes("⚠️")) 
        .map((msg: any) => ({
          role: (msg.role === "assistant" || msg.role === "model") ? "model" : "user",
          parts: [{ text: msg.content || (msg.parts?.[0]?.text) || "" }]
        }));

      let expectedRole = "user";
      for (const msg of rawHistory) {
        if (msg.role === expectedRole) {
          sanitizedHistory.push(msg);
          expectedRole = expectedRole === "user" ? "model" : "user";
        }
      }
      if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === "user") {
        sanitizedHistory.pop();
      }
    }

    // ⚙️ 10. AI ENGINE EXECUTION (WITH SILENT FALLBACK)
    const primaryModelName = adminModels[currentTier] || "gemini-1.5-flash";
    const basicModelName = adminModels["basic"] || "gemini-1.5-flash-8b";
    let finalAiReply = "";

    const generateAIResponse = async (modelName: string) => {
      const chatModel = genAI.getGenerativeModel({ model: modelName });
      if (image) {
        const base64Data = image.split(',')[1];
        const res = await chatModel.generateContent([
          message || "चित्र का विश्लेषण करें",
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
        return res.response.text();
      } else {
        const chat = chatModel.startChat({
          history: sanitizedHistory,
          systemInstruction: { parts: [{ text: finalSystemInstruction }] }
        });
        const res = await chat.sendMessage(message);
        return res.response.text();
      }
    };

    try {
      finalAiReply = await generateAIResponse(primaryModelName);
    } catch (primaryError) {
      console.warn(`[AI Engine] Primary model ${primaryModelName} failed. Silently falling back to basic.`);
      try {
        finalAiReply = await generateAIResponse(basicModelName);
      } catch (fallbackError) {
        console.error("AI Fallback failed:", fallbackError);
        return NextResponse.json({ success: false, error: "आयुष-ज्ञान सर्वर वर्तमान में व्यस्त है। कृपया कुछ समय पश्चात प्रयास करें।" }, { status: 503 });
      }
    }

    // 📉 11. DEDUCT TOKEN & RETURN SUCCESS
    await User.findOneAndUpdate(
      { uid: decodedToken.uid }, 
      { $inc: { "aiPlan.tokens": -1 } }
    );

    return NextResponse.json({ 
      success: true, 
      reply: finalAiReply, 
      remainingTokens: availableTokens - 1 
    });

  } catch (error: any) {
    console.error("Master AI Router Error:", error);
    return NextResponse.json({ success: false, error: "आंतरिक सर्वर त्रुटि (Internal Server Error)। कृपया पुनः प्रयास करें।" }, { status: 500 });
  }
}