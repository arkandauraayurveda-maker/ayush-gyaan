import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let verifiedUid: string | null = null;
    let verifiedEmail: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUid = decodedToken.uid;
        verifiedEmail = decodedToken.email || null;
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 });
      }
    }

    const { uid, email, name } = await req.json();

    // If token was provided, enforce that caller can only sync their own profile
    if (verifiedUid && verifiedUid !== uid) {
      return NextResponse.json({ success: false, error: "Forbidden: Identity mismatch" }, { status: 403 });
    }

    const targetUid = verifiedUid || uid;
    const targetEmail = verifiedEmail || email;

    if (!targetUid) {
      return NextResponse.json({ success: false, error: "UID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let user = await User.findOne({ uid: targetUid });

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