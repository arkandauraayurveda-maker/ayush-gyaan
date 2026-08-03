import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name } = await req.json();
    await connectToDatabase();

    let user = await User.findOne({ uid });

    if (!user) {
      // 🔥 NEW: नए यूज़र को डिफ़ॉल्ट 'Free' टियर और 10 टोकन दें
      user = new User({
        uid, 
        email, 
        name,
        isOnboarded: false,
        aiPlan: { tier: 'free', tokens: 10 } 
      });
      await user.save();
    } else if (!user.aiPlan || !user.aiPlan.tier) {
      // अगर कोई पुराना यूज़र है जिसके पास प्लान नहीं है, तो उसे भी 10 टोकन दें
      user.aiPlan = { tier: 'free', tokens: 10 };
      await user.save();
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync user" }, { status: 500 });
  }
}