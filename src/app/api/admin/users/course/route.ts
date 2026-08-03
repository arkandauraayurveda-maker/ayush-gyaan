import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";

export async function POST(req: NextRequest) {
  try {
    const { uid, courseId, action } = await req.json();

    // 1. Basic Validation
    if (!uid || !courseId || !action) {
      return NextResponse.json({ error: "Missing required fields (uid, courseId, action)" }, { status: 400 });
    }

    if (action !== "add" && action !== "remove") {
      return NextResponse.json({ error: "Invalid action. Use 'add' or 'remove'." }, { status: 400 });
    }

    await connectToDatabase();

    // 2. Find User
    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json({ error: "Student account not found in database." }, { status: 404 });
    }

    if (!user.purchasedCourses) {
      user.purchasedCourses = [];
    }

    // 3. Action Logic (Object Schema के साथ सिंक किया गया)
    if (action === "add") {
      // 🔥 SMART CHECK: क्या यह कोर्स सच में डेटाबेस में है?
      const courseExists = await Course.findOne({ courseId: courseId });
      
      if (!courseExists) {
        return NextResponse.json({ 
          error: `Course ID '${courseId}' is invalid! Please check the 'Manage Courses' tab for correct IDs.` 
        }, { status: 404 });
      }

      // चेक करें कि क्या यूज़र के पास यह कोर्स पहले से है
      const existingCourse = user.purchasedCourses.find((c: any) => c.courseId === courseId);

      if (existingCourse) {
        if (existingCourse.status === "ACTIVE") {
          return NextResponse.json({ error: "Student already has active access to this course." }, { status: 400 });
        } else {
          // अगर पहले से था पर Revoked/Inactive था, तो वापस Active कर दो
          existingCourse.status = "ACTIVE";
          existingCourse.expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          existingCourse.grantedBy = "ADMIN";
        }
      } else {
        // नया कोर्स ऑब्जेक्ट पुश करें (Schema के मुताबिक)
        user.purchasedCourses.push({
          courseId: courseId,
          purchaseDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          status: "ACTIVE",
          grantedBy: "ADMIN"
        });
      }

    } else if (action === "remove") {
      // कोर्स को रिमूव करने के बजाय उसका स्टेटस REVOKED या हटायें
      const courseIndex = user.purchasedCourses.findIndex((c: any) => c.courseId === courseId);
      
      if (courseIndex > -1) {
        // आप चाहें तो एरे से पूरी तरह हटा सकते हैं या स्टेटस 'REVOKED' कर सकते हैं
        user.purchasedCourses.splice(courseIndex, 1);
      } else {
        return NextResponse.json({ error: "Course not found for this user." }, { status: 400 });
      }
    }

    // 🔥 Mongoose को बताने के लिए कि एरे मॉडिफाइड हुआ है
    user.markModified("purchasedCourses");

    // 4. Save to Database
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: `Course access successfully ${action === 'add' ? 'granted' : 'revoked'}!` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Course Access Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}