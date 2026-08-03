import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    await connectToDatabase();
    
    // 🔥 Updated: Fetching name, aiPlan, and purchasedCourses together for the Dashboard
    const user = await User.findOne({ uid: decodedToken.uid }).select("aiPlan name purchasedCourses email");
    
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name || "Scholar",
        email: user.email || "",
        aiPlan: user.aiPlan || { tier: "basic", tokens: 10 },
        courses: user.purchasedCourses || []
      }
    });

  } catch (error) {
    console.error("User API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
/*import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    await connectToDatabase();
    
    // सिर्फ ज़रूरी डेटा भेजें (Performance Boost)
    const user = await User.findOne({ uid: decodedToken.uid }).select("aiPlan name");
    
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, aiPlan: user.aiPlan, name: user.name });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}*/