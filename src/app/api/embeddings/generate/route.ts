import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🔄 STRICTLY USING gemini-embedding-1 (For 768 Dimensions)
async function generateVector(content: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent(content);
    return result.embedding.values;
  } catch (err: any) {
    console.error("Embedding generation failed:", err);
    throw new Error("Failed to generate vector.");
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if API Key exists
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "Gemini API key is missing" }, { status: 500 });
    }

    await connectToDatabase();

    // 1. FETCH SHLOKAS: Jinke embeddings nahi bane hain
    const shlokasToProcess = await Shloka.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ],
      status: "APPROVED" 
    }).limit(10); 

    if (shlokasToProcess.length === 0) {
      return NextResponse.json({ success: true, message: "Mission Accomplished! All approved shlokas have embeddings." });
    }

    let processedCount = 0;

    for (const shloka of shlokasToProcess) {
      // 2. 🧠 SMART METADATA EXTRACTION
      const m = shloka.metadata || {};
      const metaText = [
        m.dosha?.length ? `Dosha (दोष): ${m.dosha.join(", ")}` : "",
        m.dhatu?.length ? `Dhatu (धातु): ${m.dhatu.join(", ")}` : "",
        m.vyadhi?.length ? `Vyadhi (Disease): ${m.vyadhi.join(", ")}` : "",
        m.lakshana?.length ? `Lakshana (Symptoms): ${m.lakshana.join(", ")}` : "",
        m.dravya?.length ? `Dravya (Medicine): ${m.dravya.join(", ")}` : "",
        m.karma?.length ? `Karma (Action): ${m.karma.join(", ")}` : "",
        m.keywords?.length ? `Keywords: ${m.keywords.join(", ")}` : ""
      ].filter(Boolean).join(" | ");

      // 3. 🚀 THE MASTER CONTEXT STRING
      const contentToEmbed = `
        Reference: ${shloka.samhitaName} - ${shloka.sthana}, Chapter ${shloka.chapter}, Shloka ${shloka.shlokaNumber}
        Sanskrit Shloka: ${shloka.originalShloka}
        Hindi Meaning: ${shloka.translationHindi}
        ${shloka.tikaSanskrit ? `Classical Commentary (Tika): ${shloka.tikaSanskrit}` : ""}
        ${shloka.tikaHindi ? `Tika Translation: ${shloka.tikaHindi}` : ""}
        ${shloka.vimarsh ? `Clinical Vimarsh: ${shloka.vimarsh}` : ""}
        ${metaText ? `Ayurvedic Clinical Tags: ${metaText}` : ""}
      `.replace(/\s+/g, ' ').trim(); 

      // 4. GENERATE VECTOR (768 Dimensions only)
      const embeddingArray = await generateVector(contentToEmbed);

      // 5. SAVE TO MONGODB
      shloka.embedding = embeddingArray;
      await shloka.save();
      
      processedCount++;
      
      if (processedCount < shlokasToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated AI Embeddings for ${processedCount} shlokas! (Press again for the next batch)`,
      processedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error("Embedding Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}