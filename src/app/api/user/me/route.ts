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
    
    const user = await User.findOne({ uid: decodedToken.uid });
    
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      user: {
        uid: user.uid,
        name: user.name || "Scholar",
        email: user.email || "",
        mobile: user.mobile || "",
        collegeName: user.collegeName || "",
        course: user.course || "",
        batchYear: user.batchYear || "",
        addressDetails: user.addressDetails || { street: "", city: "", state: "", pincode: "" },
        isOnboarded: Boolean(user.isOnboarded),
        role: user.role || "user",
        aiPlan: user.aiPlan || { tier: "free", tokens: 10 },
        courses: user.purchasedCourses || []
      },
      aiPlan: user.aiPlan || { tier: "free", tokens: 10 },
      name: user.name || "Scholar"
    });

  } catch (error) {
    console.error("User API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}