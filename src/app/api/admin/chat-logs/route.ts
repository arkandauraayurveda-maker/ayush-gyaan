import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/authMiddleware";
import connectToDatabase from "@/lib/mongodb";
import AIChatLog from "@/models/AIChatLog";

export async function GET(req: NextRequest) {
  try {
    // 🔐 Verify Admin or Co-Admin with 'AI_CHAT_LOGS' tab permission
    const authResult = await verifyAdminAuth(req, "AI_CHAT_LOGS");
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();

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