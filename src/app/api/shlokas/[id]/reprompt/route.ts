import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Await params specifically for Next.js 15/16
    const { id } = await params;
    const { instruction } = await req.json();

    if (!instruction) {
      return NextResponse.json({ error: "Instruction missing" }, { status: 400 });
    }

    // 1. Database se current shloka nikalein
    const currentDraft = await Shloka.findById(id);
    if (!currentDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // 2. Gemini AI ko nirdesh dein
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    });

    const prompt = `
      You are an expert Ayurvedic AI Editor. 
      Below is an extracted JSON draft of a Shloka section that needs correction based on the user's specific instruction.
      
      USER INSTRUCTION TO FIX: "${instruction}"
      
      CURRENT DRAFT DATA:
      ${JSON.stringify(currentDraft)}
      
      RULES:
      1. Apply the user's fix precisely to the respective field.
      2. Keep the rest of the valid data exactly intact.
      3. Always output valid JSON strictly following the schema from the original draft.
    `;

    // 3. AI se theek karwayein
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const fixedData = JSON.parse(textResponse);

    // 4. Database me update karein
    const updatedShloka = await Shloka.findByIdAndUpdate(
      id,
      { $set: {
          originalShloka: fixedData.originalShloka || currentDraft.originalShloka,
          easyToReadShloka: fixedData.easyToReadShloka || currentDraft.easyToReadShloka,
          words: fixedData.words || currentDraft.words,
          anvaya: fixedData.anvaya || currentDraft.anvaya,
          translationHindi: fixedData.translationHindi || currentDraft.translationHindi,
          vimarsh: fixedData.vimarsh || currentDraft.vimarsh,
          metadata: fixedData.metadata || currentDraft.metadata,
      }},
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, data: updatedShloka }, { status: 200 });

  } catch (error: any) {
    console.error("Reprompt API Error:", error);
    return NextResponse.json({ error: "Failed to reprompt shloka", details: error.message }, { status: 500 });
  }
}