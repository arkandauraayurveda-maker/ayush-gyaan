import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import SystemSettings from "@/models/SystemSettings";
import Shloka from "@/models/Shloka";
import { adminAuth } from "@/lib/firebaseAdmin";
import AIChatLog from "@/models/AIChatLog";

const VALID_MODEL_MAPPING: Record<string, string> = {
  "basic": "gemini-1.5-flash-8b",
  "plus": "gemini-1.5-flash",
  "pro": "gemini-1.5-pro"
};

/**
 * Uses configured model name directly, fallback only if completely empty.
 */
function sanitizeModelName(configuredName?: string, fallbackTier: string = "basic"): string {
  if (!configuredName || typeof configuredName !== "string" || !configuredName.trim()) {
    return VALID_MODEL_MAPPING[fallbackTier] || "gemini-1.5-flash";
  }
  return configuredName.trim();
}

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
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user) return NextResponse.json({ success: false, error: "उपयोगकर्ता नहीं मिला (User not found)" }, { status: 404 });

    const settings = await SystemSettings.findOne({ settingId: "global_settings" });

    const adminModels = settings?.aiModels || {
      basic: "gemini-1.5-flash-8b",
      plus: "gemini-1.5-flash",
      pro: "gemini-1.5-pro"
    };

    // 🕒 3. PLAN EXPIRY & DAILY TOKEN RESET
    let currentTier = (user.aiPlan?.tier || "basic").toLowerCase();
    if (currentTier === "free") currentTier = "basic";

    if ((currentTier === "plus" || currentTier === "pro") && user.aiPlan?.validityEnd) {
      if (new Date() > new Date(user.aiPlan.validityEnd)) {
        currentTier = "basic";
        user.aiPlan.tier = "basic";
      }
    }

    const { isVoice } = body;
    const isMultimodalQuery = Boolean(image || isVoice);

    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = user.aiPlan?.lastActiveDate ? new Date(user.aiPlan.lastActiveDate).setHours(0, 0, 0, 0) : 0;
    
    const defaultTextLimits: Record<string, number> = { basic: 10, plus: 100, pro: 9999 };
    const defaultMultimodalLimits: Record<string, number> = { basic: 3, plus: 25, pro: 9999 };

    const configuredLimit = isMultimodalQuery
      ? (settings?.aiMultimodalLimits?.[currentTier as keyof typeof defaultMultimodalLimits] ?? defaultMultimodalLimits[currentTier] ?? 3)
      : (typeof settings?.aiLimits?.[currentTier as keyof typeof defaultTextLimits] === "number" 
          ? settings.aiLimits[currentTier as keyof typeof defaultTextLimits] 
          : defaultTextLimits[currentTier] ?? 10);

    let availableTokens = user.aiPlan?.tokens ?? 0;

    if (today > lastActive || !user.aiPlan?.lastActiveDate) {
      availableTokens = configuredLimit;
      if (!user.aiPlan) user.aiPlan = {};
      user.aiPlan.tokens = availableTokens;
      user.aiPlan.tier = currentTier;
      user.aiPlan.lastActiveDate = new Date();
      await user.save();
    }

    // 🛑 4. TOKEN LIMIT CHECK
    if (availableTokens <= 0) {
      const msg = isMultimodalQuery 
        ? "इमेज/वॉइस प्रश्नों की दैनिक सीमा समाप्त हो गई है। कृपया अपने प्लान को अपग्रेड करें।" 
        : "limit_exceeded_अपग्रेड";
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
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
      const shlokaPattern = /(?:अध्याय|chapter|ch)?\s*(\d+)\s*(?:श्लोक|shloka|[\/\.\-])\s*(\d+[a-zA-Z]*)/i;
      const match = message.match(shlokaPattern);

      if (match) {
        const chapterNo = match[1];
        const shlokaNo = match[2];

        const directShlokas = await Shloka.find({
          chapter: chapterNo,
          shlokaNumber: new RegExp("^" + shlokaNo, "i")
        }).limit(5);

        if (directShlokas && directShlokas.length > 0) {
          const fullOriginalShloka = directShlokas.map(s => s.originalShloka).join("\n");
          const fullTranslation = directShlokas[0].translationHindi || "";
          const samhitaInfo = `${directShlokas[0].samhitaName || 'संहिता'} (${directShlokas[0].sthana || 'स्थान'}), अध्याय: ${directShlokas[0].chapter}, श्लोक: ${shlokaNo}`;

          const directReply = `📚 **संदर्भ:** ${samhitaInfo}\n\n> 📜 **मूल श्लोक:**\n> ${fullOriginalShloka}\n\n🌿 **भावार्थ:**\n${fullTranslation}`;

          return NextResponse.json({
            success: true,
            reply: directReply,
            remainingTokens: availableTokens
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
          const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
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

      finalSystemInstruction = `आप 'आयुष-ज्ञान AI' हैं—एक friendly, casual और supportive BAMS AI Study Companion। 

छात्र से बात करते समय भारी-भरकम, कठिन हिंदी या क्लिष्ट संस्कृत वाक्यांशों (जैसे 'अत्यंत विद्वान', 'स्नेही', 'संहिता की गहराइयों') का प्रयोग न करें। सरल, प्राकृतिक Hinglish या आसान हिंदी में बातचीत करें जैसे एक हेल्पफुल सीनियर छात्र या फ्रेंडली मेंटर बात करता है।

इन नियमों का 100% पालन करें:

1. **फ्रेंडली टोन और नाम का उपयोग:**
   यदि यूजर का नाम दिया गया हो तो उसका उपयोग करें। बातचीत सरल, सहज और दोस्ताना (casual & encouraging) रखें।

2. **आयुर्वेदिक शब्दावली की 100% शुद्धता (Strict Terminology Rule):**
   सभी आयुर्वेदिक पदों (जैसे वात, पित्त, कफ, त्रिदोष, अग्नि, स्रोतस, धातु, दूष्य, ओज, निदान, सम्प्राप्ति, उपशय, चिकित्सा सूत्र, रस-पंचक आदि) को 100% वैसा ही रखें। उनमें न तो अपनी तरफ से कोई बदलाव करें और न ही उनका अंग्रेजी में अनुवाद करें।

3. **शून्य मनगढ़ंत ज्ञान (100% DB Strictness):**
   आपका संपूर्ण उत्तर केवल और केवल नीचे दिए गए "Retrieved Database Context" और उसके "मेटा-टैग्स" के आधार पर होना चाहिए। अपनी ओर से कोई बाहरी मनगढ़ंत जानकारी या दवा (Prescription) न जोड़ें। यदि जानकारी Context में न हो, तो सरलता से कहें: "यह टॉपिक अभी डिजिटल संहिताओं में लोड हो रहा है, थोड़ा इंतजार करें।"

4. **श्लोक प्रदर्शन:**
   श्लोक के खंडों को जोड़कर सुंदर पूर्ण रूप में प्रस्तुत करें और श्लोकों को हमेशा "> blockquote" में दिखाएं।

=== Retrieved Database Context ===
${retrievedSlokas}
================ failure instructions ==================`;
    }

    // 🧠 9. HISTORY SANITIZATION
    const sanitizedHistory: any[] = [];
    if (Array.isArray(history)) {
      const rawHistory = history
        .filter((msg: any) => msg && msg.role && !msg.content?.includes("⚠️") && !msg.content?.includes("अपग्रेड"))
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

    // ⚙️ 10. AI ENGINE EXECUTION (PASSED SYSTEM INSTRUCTION INTO GETGENERATIVEMODEL & SAFE MODEL SANITIZING)
    const primaryModelName = adminModels[currentTier] || "gemini-1.5-flash";
    const basicModelName = adminModels["basic"] || "gemini-1.5-flash-8b";
    let finalAiReply = "";

    const generateAIResponse = async (modelName: string, tierKey: string) => {
      const safeModel = sanitizeModelName(modelName, tierKey);
      
      // 🔥 FIX: Pass systemInstruction directly inside getGenerativeModel
      const chatModel = genAI.getGenerativeModel({ 
        model: safeModel,
        systemInstruction: finalSystemInstruction
      });

      if (image) {
        const base64Data = image.split(',')[1];
        const res = await chatModel.generateContent([
          message || "चित्र का विश्लेषण करें",
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
        return res.response.text();
      } else {
        const chat = chatModel.startChat({
          history: sanitizedHistory
        });
        
        const res = await chat.sendMessage(message);
        return res.response.text();
      }
    };

    try {
      finalAiReply = await generateAIResponse(primaryModelName, currentTier);
    } catch (primaryError: any) {
      console.warn(`[AI Engine] Primary model '${primaryModelName}' failed. Error: ${primaryError?.message}. Silently falling back to basic model.`);
      try {
        finalAiReply = await generateAIResponse(basicModelName, "basic");
      } catch (fallbackError: any) {
        console.error("AI Fallback failed:", fallbackError);
        return NextResponse.json({ 
          success: false, 
          error: "आयुष-ज्ञान AI सर्वर वर्तमान में उपलब्ध नहीं है। कृपया कुछ समय पश्चात पुनः प्रयास करें।" 
        }, { status: 503 });
      }
    }

    // 📉 11. DEDUCT TOKEN & LOG CHAT FOR ADMIN ANALYTICS
    await User.findOneAndUpdate(
      { uid: decodedToken.uid },
      { $inc: { "aiPlan.tokens": -1 } }
    );

    AIChatLog.create({
      userId: decodedToken.uid,
      userMessage: message || "Image Query",
      aiResponse: finalAiReply,
      modelUsed: primaryModelName,
      isExactMatch: false
    }).catch((err: any) => console.error("AIChatLog save error:", err));

    return NextResponse.json({
      success: true,
      reply: finalAiReply,
      remainingTokens: availableTokens - 1
    });

  } catch (error: any) {
    console.error("Master AI Router Error:", error);
    return NextResponse.json({ success: false, error: "आंतरिक सर्ver त्रुटि (Internal Server Error)। कृपया पुनः प्रयास करें।" }, { status: 500 });
  }
}