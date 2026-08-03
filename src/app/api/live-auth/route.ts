import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin"; // 🛡️ Firebase Admin Security

export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 🛡️ 1. STRICT SECURITY CHECK (Firebase Token)
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized access! Missing Token." }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid or Expired Token!" }, { status: 401 });
    }

    const userId = decodedToken.uid; 

    // ==========================================
    // 👤 2. CHECK USER TOKENS & LIMITS
    // ==========================================
    await connectToDatabase();
    const user = await User.findOne({ uid: userId });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const availableTokens = user.aiPlan?.tokens || 0;
    const originalTier = user.aiPlan?.tier || 'free';
    const isPlanExpired = user.aiPlan?.validityEnd && new Date() > new Date(user.aiPlan.validityEnd);

    // अगर फ्री प्लान है या टोकन 0 हैं, तो Live API (Voice/Image) का एक्सेस रोक दें
    if (originalTier === 'free' || isPlanExpired || availableTokens <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Live Audio/Image फीचर के लिए AyushGyaan Pro में अपग्रेड करें या आपके टोकन समाप्त हो गए हैं।" 
      }, { status: 403 });
    }

    // ==========================================
    // 🔋 3. DEDUCT TOKEN FOR LIVE SESSION
    // ==========================================
    // Live API महँगी होती है, इसलिए हम सेशन स्टार्ट होने पर 1 टोकन काट लेंगे
    await User.updateOne({ _id: user._id }, { $inc: { "aiPlan.tokens": -1 } });

    // ==========================================
    // 🚀 4. GRANT ACCESS (SECURE HANDSHAKE)
    // ==========================================
    // यहाँ हम फ्रंटएंड को बता रहे हैं कि यूज़र ऑथेंटिकेट हो गया है 
    // और उसे Live API से जुड़ने की अनुमति है।
    return NextResponse.json({ 
      success: true, 
      message: "Live Session Authorized",
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error("Live Auth API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error during secure handshake" }, { status: 500 });
  }
}