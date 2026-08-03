import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AIChatLog from "@/models/AIChatLog";

export async function GET(req: NextRequest) {
  try {
    // 🔐 यहाँ आप भविष्य में Admin Verification/Auth लगा सकते हैं
    
    await connectToDatabase();

    // डेटाबेस से ताज़ा 100 चैट्स निकालें (सबसे नई सबसे ऊपर)
    const logs = await AIChatLog.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    console.error("Failed to fetch chat logs:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}