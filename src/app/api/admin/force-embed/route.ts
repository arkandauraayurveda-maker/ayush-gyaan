import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

    const shlokasToUpdate = await Shloka.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } }
      ]
    }).limit(20);

    if (shlokasToUpdate.length === 0) {
      return NextResponse.json({ success: true, message: "🎉 बधाई हो! सभी श्लोकों के वेक्टर्स सफलतापूर्वक सेव हो गए हैं!" });
    }

    let count = 0;
    for (const shloka of shlokasToUpdate) {
      // 🔥 आपके नए Schema के सटीक नामों का उपयोग
      const samhita = shloka.samhitaName || "Unknown Samhita";
      const sthana = shloka.sthana ? `स्थान: ${shloka.sthana}` : "";
      const chapter = shloka.chapter || "";
      const shlokaNum = shloka.shlokaNumber || "";
      const sanskrit = shloka.originalShloka || "";
      const hindi = shloka.translationHindi || ""; // सही फ़ील्ड नाम

      const textToEmbed = `संदर्भ: ${samhita} ${sthana}, अध्याय: ${chapter}, श्लोक: ${shlokaNum}\nमूल श्लोक: ${sanskrit}\nभावार्थ: ${hindi}`;
      
      const result = await embeddingModel.embedContent(textToEmbed);
      
      await Shloka.updateOne(
        { _id: shloka._id },
        { $set: { embedding: result.embedding.values } }
      );
      
      count++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ कमाल हो गया! ${count} श्लोकों के वेक्टर्स बिना किसी एरर के अपडेट हो गए हैं। कृपया पेज रिफ्रेश करें।` 
    });

  } catch (error: any) {
    console.error("Force Embed Error:", error);
    return NextResponse.json({ success: false, error: "Error: " + error.message }, { status: 500 });
  }
}