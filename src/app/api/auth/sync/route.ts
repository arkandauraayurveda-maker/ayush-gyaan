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
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        uid: targetUid, 
        email: targetEmail, 
        name: name || "",
        isOnboarded: false,
        aiPlan: { tier: 'free', tokens: 10, lastActiveDate: new Date() } 
      });
      await user.save();
    } else {
      let needsSave = false;
      if (!user.aiPlan || !user.aiPlan.tier) {
        user.aiPlan = { tier: 'free', tokens: 10, lastActiveDate: new Date() };
        needsSave = true;
      }
      if (name && (!user.name || user.name === "")) {
        user.name = name;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      isNewUser, 
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        isOnboarded: Boolean(user.isOnboarded),
        aiPlan: user.aiPlan,
        role: user.role
      } 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync user" }, { status: 500 });
  }
}