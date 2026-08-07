import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let targetUid = "";
  let targetEmail = "";
  let userName = "";

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

    targetUid = verifiedUid || uid;
    targetEmail = verifiedEmail || email || "";
    userName = name || "";

    if (!targetUid) {
      return NextResponse.json({ success: false, error: "UID is required" }, { status: 400 });
    }

    // 🛡️ RESILIENT DB CONNECTION CHECK
    try {
      await connectToDatabase();
    } catch (dbErr: any) {
      console.warn("[Auth Sync Warning] DB connection unavailable, returning resilient fallback user session:", dbErr?.message);
      return NextResponse.json({ 
        success: true, 
        isNewUser: false, 
        dbStatus: "offline_fallback",
        user: {
          uid: targetUid,
          email: targetEmail,
          name: userName,
          isOnboarded: true,
          aiPlan: { tier: 'free', tokens: 10 },
          role: targetEmail === "jkdewasi961096@gmail.com" ? "admin" : "student"
        } 
      }, { status: 200 });
    }

    let user = await User.findOne({ uid: targetUid });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        uid: targetUid, 
        email: targetEmail, 
        name: userName,
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
      if (userName && (!user.name || user.name === "")) {
        user.name = userName;
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
    // Fallback: Ensure Firebase authenticated user is never blocked
    return NextResponse.json({ 
      success: true,
      isNewUser: false,
      user: {
        uid: targetUid,
        email: targetEmail,
        name: userName,
        isOnboarded: true,
        aiPlan: { tier: 'free', tokens: 10 },
        role: "student"
      }
    }, { status: 200 });
  }
}