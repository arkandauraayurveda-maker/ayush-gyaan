import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name, mobile } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing Firebase UID or Email" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check if user already exists in MongoDB
    let user = await User.findOne({ uid });

    if (user) {
      // User exists, return their data
      return NextResponse.json({ 
        success: true, 
        message: "User synced successfully", 
        user,
        isNewUser: false 
      }, { status: 200 });
    } else {
      // 2. New User - Create account in MongoDB
      user = new User({
        uid,
        email,
        name: name || "",
        mobile: mobile || "",
        isOnboarded: false, // 🔥 Force them to fill onboarding form
        purchasedCourses: [],
      });

      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: "New user created in database", 
        user,
        isNewUser: true
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Auth Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}