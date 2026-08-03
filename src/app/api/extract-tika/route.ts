import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🔥 AI FALLBACK ARRAY (Hierarchy wise)
const AVAILABLE_MODELS = [
  "gemini-3.6-flash",       // 1st Priority: Sabse smart
  "gemini-3.5-flash",       // 2nd Priority: Backup
  "gemini-3.5-flash-lite"   // 3rd Priority: Emergency (Fast & lightweight)
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, samhita, sthana, chapter } = body;

    if (!pdfBase64 || !samhita || !sthana || !chapter) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "Gemini API key is not configured" }, { status: 500 });
    }

    await connectToDatabase();

    // 1. 🧠 THE SYSTEM PROMPT
    const systemPrompt = `
      तुम एक प्राचीन आयुर्वेद, संस्कृत व्याकरण और उच्च कोटि के अनुवादक (Translator) हो। मेरा उद्देश्य एक आयुर्वेदिक ग्रंथ के श्लोकों की संस्कृत टीकाओं को स्ट्रक्चर्ड JSON फॉरमेट में निकालना और उनका सर्वश्रेष्ठ हिंदी अनुवाद करना है।

      नियम (Rules):
      1. श्लोक संख्या (Shloka Number) और अध्याय (Chapter) को ध्यान से पहचानो।
      2. 'tikaSanskrit' में श्लोक के ठीक बाद दी गई पूरी शुद्ध संस्कृत टीका को हूबहू लिखो।
      3. 'tikaHindi' में उस पूरी संस्कृत टीका का एकदम सटीक, सरल, और प्रवाहमयी (Fluent) हिंदी अनुवाद करो। 
      4. टीका को ध्यान से पढ़ो। अगर उसमें व्याकरण (Vyakarana) का कोई नियम है, तो उसे 'grammarNotes' की लिस्ट (Array of strings) में लिखो।
      5. अगर 'तंत्र युक्ति' (Tantra Yukti) का जिक्र है, तो उसे 'tantraYukti' में लिखो। यदि नहीं है, तो null कर दो।
      6. आउटपुट केवल JSON Array होना चाहिए।
    `;

    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf"
      }
    };

    // 2. 🤖 SMART AI FALLBACK LOGIC (For Rate Limits & RPM/RPD)
    let responseText = null;
    let successfulModel = null;

    for (const modelName of AVAILABLE_MODELS) {
      try {
        console.log(`[AI AGENT] Attempting extraction with model: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const result = await model.generateContent([systemPrompt, pdfPart]);
        responseText = result.response.text();
        successfulModel = modelName;
        
        console.log(`[AI AGENT] Success using ${modelName}! Breaking loop.`);
        break; // Agar success mil gayi, toh aage ke models try karne ki zaroorat nahi

      } catch (error: any) {
        console.warn(`[AI AGENT] Model ${modelName} failed or rate-limited (Skipping to next). Error:`, error.message);
        // Loop continue hoga aur automatically agla model try karega
      }
    }

    // Agar teeno models fail ho gaye (sabki limit cross ho gayi)
    if (!responseText) {
      return NextResponse.json({ 
        success: false, 
        error: "All AI Agents are currently busy or rate-limited. Please try again after a minute." 
      }, { status: 503 });
    }

    // String ko JSON object me parse karna
    let aiExtractedJson;
    try {
      aiExtractedJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Failed. AI gave:", responseText);
      return NextResponse.json({ success: false, error: "AI returned invalid JSON format." }, { status: 500 });
    }

    // 3. 💾 SMART MERGE IN DATABASE
    const updatedShlokas = [];

    for (const data of aiExtractedJson) {
      const filter = {
        samhitaName: samhita,
        sthana: sthana,
        chapter: parseInt(chapter),
        shlokaNumber: String(data.shlokaNumber)
      };

      const update = {
        $set: {
          tikaSanskrit: data.tikaSanskrit,
          tikaHindi: data.tikaHindi,
          tantraYukti: data.tantraYukti,
          grammarNotes: Array.isArray(data.grammarNotes) ? data.grammarNotes : [],
          status: "PENDING"
        }
      };

      const updatedDoc = await Shloka.findOneAndUpdate(filter, update, { new: true, upsert: true });
      updatedShlokas.push(updatedDoc);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Tika extracted successfully using ${successfulModel}!`,
      data: aiExtractedJson
    }, { status: 200 });

  } catch (error: any) {
    console.error("Tika Extraction Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}