import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import SystemSettings from "@/models/SystemSettings";
import Shloka from "@/models/Shloka";
import { adminAuth } from "@/lib/firebaseAdmin";
import AIChatLog from "@/models/AIChatLog";
import { checkRateLimit } from "@/lib/rateLimiter";
import { logAIRequest } from "@/lib/aiLogService";

const VALID_MODEL_MAPPING: Record<string, string> = {
  basic: "gemini-1.5-flash-8b",
  plus: "gemini-1.5-flash",
  pro: "gemini-1.5-pro"
};

function sanitizeModelName(configuredName?: string, fallbackTier: string = "basic"): string {
  if (!configuredName || typeof configuredName !== "string" || !configuredName.trim()) {
    return VALID_MODEL_MAPPING[fallbackTier] || "gemini-1.5-flash";
  }
  return configuredName.trim();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized Access" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateCheck = checkRateLimit(decodedToken.uid || clientIp, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: "Too Many Requests"
      }, { status: 429 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid Request" }, { status: 400 });
    }

    const { message, image, history, courseId } = body;
    if (!message && !image) {
      return NextResponse.json({ success: false, error: "Prompt or image required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const settings = await SystemSettings.findOne({ settingId: "global_settings" });

    const adminModels = settings?.aiModels || {
      basic: "gemini-1.5-flash-8b",
      plus: "gemini-1.5-flash",
      pro: "gemini-1.5-pro"
    };

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

    if (availableTokens <= 0) {
      const msg = isMultimodalQuery
        ? "Limit Exceeded"
        : "limit_exceeded_upgrade";
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }

    if (courseId) {
      const hasAccess = user.purchasedCourses?.some(
        (pc: any) => pc.courseId === courseId && pc.status === "ACTIVE"
      );
      if (!hasAccess && currentTier !== "pro") {
        return NextResponse.json({ success: false, error: "Course Access Required" }, { status: 403 });
      }
    }

    if (!image && message) {
      const shlokaPattern = /(?:chapter|ch)?\s*(\d+)\s*(?:shloka|[\/\.\-])\s*(\d+[a-zA-Z]*)|(?:samhita)\s*(?:chapter)?\s*(\d+)\s*[\/\.\-]\s*(\d+)/i;
      const match = message.match(shlokaPattern);

      if (match) {
        const chapterNo = match[1] || match[3];
        const shlokaNo = match[2] || match[4];

        if (chapterNo && shlokaNo) {
          const directShlokas = await Shloka.find({
            chapter: Number(chapterNo),
            shlokaNumber: new RegExp("^" + shlokaNo, "i")
          }).limit(5);

          if (directShlokas && directShlokas.length > 0) {
            const fullOriginalShloka = directShlokas.map(s => s.originalShloka).join("\n");
            const fullTranslation = directShlokas[0].translationHindi || "";
            const samhitaInfo = `${directShlokas[0].samhitaName || "Samhita"} (${directShlokas[0].sthana || "Sthana"}), Chapter: ${directShlokas[0].chapter}, Shloka: ${shlokaNo}`;

            const directReply = `Direct Samhita Reference Match: ${samhitaInfo}\n\nOriginal Shloka:\n${fullOriginalShloka}\n\nTranslation:\n${fullTranslation}`;

            return NextResponse.json({
              success: true,
              reply: directReply,
              remainingTokens: availableTokens
            });
          }
        }
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    let retrievedSlokas = "";
    let finalSystemInstruction = "";

    if (image) {
      finalSystemInstruction = `You are 'AyushGyaan AI'—an expert BAMS teacher and exam guide. 
Analyze the uploaded question paper or handwritten notes. Provide step-by-step answers for Q1, Q2, Q3...
Include original Sanskrit Shlokas and Samhita references when available.`;
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
              `Ref: ${s.samhitaName || "Unknown"} (${s.sthana || ""}), Chapter: ${s.chapter}, Shloka: ${s.shlokaNumber}\nShloka: ${s.originalShloka || ""}\nMeaning: ${s.translationHindi || ""}`
            ).join("\n\n---\n\n");
          } else {
            retrievedSlokas = "NO_DATA_FOUND";
          }
        } catch (e) {
          retrievedSlokas = "DB_ERROR";
        }
      }

      finalSystemInstruction = `You are 'AyushGyaan AI'—a friendly, supportive BAMS AI Study Companion.

Rules:
1. Tone: Friendly, clear Hinglish or easy Hindi. Keep terminology accurate (Vata, Pitta, Kapha, Tridosha, Agni, Srotas, Dhatu, Ojas, Nidan, Samprapti, Chikitsa Sutra).
2. Question Paper Formatting:
   - Short Note (5 Marks): Max 150 words.
   - Long Essay (10 Marks): Max 400 words (Nidan, Samprapti, Laksana, Chikitsa Sutra).
   - MANDATORY SHLOKA REFERENCE: Always quote original Sanskrit Shloka in blockquotes (> Shloka) with Samhita reference whenever context contains Shloka.
3. Zero Hallucination: If context is NO_DATA_FOUND, politely respond that this topic is currently being added to digital samhitas.

=== Retrieved Database Context ===
${retrievedSlokas}`;
    }

    const sanitizedHistory: any[] = [];
    if (Array.isArray(history)) {
      const rawHistory = history
        .filter((msg: any) => msg && msg.role)
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

    const primaryModelName = adminModels[currentTier] || "gemini-1.5-flash";
    const basicModelName = adminModels["basic"] || "gemini-1.5-flash-8b";
    let finalAiReply = "";

    const generateAIResponse = async (modelName: string, tierKey: string) => {
      const safeModel = sanitizeModelName(modelName, tierKey);
      const startTime = Date.now();

      const chatModel = genAI.getGenerativeModel({
        model: safeModel,
        systemInstruction: finalSystemInstruction
      });

      let res: any;
      if (image) {
        const base64Data = image.split(",")[1];
        res = await chatModel.generateContent([
          message || "Analyze the attached question paper image",
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
      } else {
        const chat = chatModel.startChat({
          history: sanitizedHistory
        });
        res = await chat.sendMessage(message);
      }

      const latencyMs = Date.now() - startTime;
      const usageMetadata = res?.response?.usageMetadata || res?.usageMetadata;

      logAIRequest({
        userId: decodedToken.uid,
        featureName: image ? "Image Analysis" : (body.featureName || "Chat"),
        provider: "google",
        modelName: safeModel,
        inputType: image ? "IMAGE" : (isVoice ? "VOICE" : "TEXT"),
        speechDurationSec: body.speechDurationSec || 0,
        transcriptLength: message ? message.length : 0,
        usageMetadata,
        latencyMs,
        status: "SUCCESS"
      }).catch((e: any) => console.error("AI log background error:", e));

      return res.response.text();
    };

    try {
      finalAiReply = await generateAIResponse(primaryModelName, currentTier);
    } catch (primaryError: any) {
      console.warn(`[AI Engine] Primary model '${primaryModelName}' failed. Falling back to basic model.`);
      try {
        finalAiReply = await generateAIResponse(basicModelName, "basic");
      } catch (fallbackError: any) {
        console.error("AI Fallback failed:", fallbackError);

        logAIRequest({
          userId: decodedToken.uid,
          featureName: image ? "Image Analysis" : "Chat",
          provider: "google",
          modelName: primaryModelName,
          inputType: image ? "IMAGE" : "TEXT",
          usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0 },
          latencyMs: 0,
          status: "ERROR",
          errorMessage: fallbackError?.message || "All models failed"
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          reply: "AyushGyaan AI: This topic is currently being added to our digital samhitas. Available soon!",
          remainingTokens: availableTokens
        }, { status: 200 });
      }
    }

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
    return NextResponse.json({
      success: true,
      reply: "AyushGyaan AI: Server update in progress. Please try again shortly.",
      remainingTokens: 0
    }, { status: 200 });
  }
}
