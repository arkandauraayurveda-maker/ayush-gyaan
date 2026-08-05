import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAdminAuth } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    // 🔥 Frontend se aane wale naye fields (role, tier, tokens, validityMonths) add kiye
    const { userId, action, courseId, planType, role, tier, tokens, validityMonths } = body; 

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ uid: userId });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    // ==========================================
    // 🎓 ACTION 1: COURSE GRANT / REVOKE (100% UNTOUCHED)
    // ==========================================
    if (action === "grant" || action === "revoke") {
      if (!courseId) {
        return NextResponse.json({ success: false, error: "Course ID is required for this action." }, { status: 400 });
      }

      if (!user.purchasedCourses) user.purchasedCourses = [];
      const existingCourse = user.purchasedCourses.find((c: any) => c.courseId === courseId);

      if (action === "grant") {
        if (existingCourse) {
          existingCourse.status = "ACTIVE";
          existingCourse.expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          existingCourse.grantedBy = "ADMIN";
        } else {
          user.purchasedCourses.push({
            courseId: courseId,
            purchaseDate: new Date(),
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: "ACTIVE",
            grantedBy: "ADMIN"
          });
        }
      } 
      else if (action === "revoke") {
        if (existingCourse) {
          existingCourse.status = "REVOKED"; 
        } else {
          return NextResponse.json({ success: false, error: "Course not found for this user." }, { status: 400 });
        }
      }

      user.markModified("purchasedCourses");
    }

    // ==========================================
    // 🚀 ACTION 2: UPGRADE AI PLAN & USER ROLE
    // ==========================================
    // ==========================================
    // 🚀 ACTION 2: UPGRADE AI PLAN & USER ROLE
    // ==========================================
    else if (action === "UPGRADE_AI_PLAN" || action === "UPDATE_ACCESS") {
      
      // 🔥 1. Role Update (Auto-fix for legacy 'student' roles)
      if (role) {
        user.role = role === "student" ? "user" : role;
      } else if (user.role === "student") {
        user.role = "user"; // Purane DB users ko automatically 'user' me shift kar dega
      }

      // ... (बाकी का कोड एकदम सेम रहेगा)

      // 2. Tier Update
      const finalTier = (tier || planType || user.aiPlan?.tier || "basic").toLowerCase();

      // 3. Tokens Update
      let finalTokens = tokens !== undefined ? Number(tokens) : user.aiPlan?.tokens;
      
      // (अगर पुरानी API से कॉल हुआ है जहाँ tokens नहीं भेजे गए)
      if (action === "UPGRADE_AI_PLAN" && tokens === undefined) {
        if (finalTier === "pro" || finalTier === "plus") finalTokens = 9999;
        else finalTokens = 10;
      }

      // 4. Validity Update
      let newValidityEnd = user.aiPlan?.validityEnd;
      if (validityMonths && Number(validityMonths) > 0) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + Number(validityMonths));
        newValidityEnd = expiryDate;
      } else if (validityMonths === "lifetime") {
        const lifetime = new Date();
        lifetime.setFullYear(lifetime.getFullYear() + 100);
        newValidityEnd = lifetime;
      }

      // Save Data safely
      user.aiPlan = {
        ...(user.aiPlan || {}),
        tier: finalTier,
        tokens: finalTokens,
        validityEnd: newValidityEnd
      };
      
      user.markModified("aiPlan");
    } 
    
    // ❌ INVALID ACTION
    else {
      return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });
    }

    // 💾 FINAL SAVE 
    await user.save();
    
    // 🔥 Return updated user so frontend updates instantly
    return NextResponse.json({ 
      success: true, 
      message: `Action '${action}' successful!`,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        aiPlan: user.aiPlan
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Admin Action Error:", error);
    return NextResponse.json({ success: false, error: "Server Error", details: error.message }, { status: 500 });
  }
}