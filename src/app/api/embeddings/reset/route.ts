import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export async function GET() {
  try {
    await connectToDatabase();

    // 🧹 MONGODB MAGIC: $unset कमांड हर श्लोक से 'embedding' फील्ड को हमेशा के लिए डिलीट कर देगा
    const result = await Shloka.updateMany(
      {}, // {} का मतलब है 'सारे डाक्यूमेंट्स'
      { $unset: { embedding: 1 } } 
    );

    return NextResponse.json({ 
      success: true, 
      message: "🔥 Database Reset Complete! All old embeddings are deleted.",
      modifiedCount: result.modifiedCount // यह बताएगा कि कितने श्लोकों से डेटा डिलीट हुआ
    });

  } catch (error: any) {
    console.error("Reset Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}