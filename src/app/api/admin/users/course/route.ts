import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course"; // 🔥 स्मार्ट वेरिफिकेशन के लिए Course मॉडल जोड़ा गया है

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

    // अगर किसी पुराने यूज़र में array नहीं बना है, तो उसे इनिशियलाइज़ करें (Safety Check)
    if (!user.purchasedCourses) {
      user.purchasedCourses = [];
    }

    // 3. Action Logic
    if (action === "add") {
      // 🔥 SMART CHECK: क्या यह कोर्स सच में डेटाबेस में है?
      const courseExists = await Course.findOne({ courseId: courseId });
      
      if (!courseExists) {
        return NextResponse.json({ 
          error: `Course ID '${courseId}' is invalid! Please check the 'Manage Courses' tab for correct IDs.` 
        }, { status: 404 });
      }

      // Add course if not already present
      if (!user.purchasedCourses.includes(courseId)) {
        user.purchasedCourses.push(courseId);
      } else {
        return NextResponse.json({ error: "Student already has access to this course." }, { status: 400 });
      }

    } else if (action === "remove") {
      // Remove course from array
      user.purchasedCourses = user.purchasedCourses.filter((id: string) => id !== courseId);
    }

    // 4. Save to Database
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: `Course access successfully ${action === 'add' ? 'granted' : 'revoked'}!` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Course Access Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}