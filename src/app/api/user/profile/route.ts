import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const body = await req.json();
    const { name, mobile, collegeName, course, batchYear, addressDetails } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    user.name = name.trim();
    if (mobile !== undefined) user.mobile = mobile.trim();
    if (collegeName !== undefined) user.collegeName = collegeName.trim();
    if (course !== undefined) user.course = course.trim();
    if (batchYear !== undefined) user.batchYear = batchYear.trim();
    
    if (addressDetails) {
      user.addressDetails = {
        street: addressDetails.street ? addressDetails.street.trim() : "",
        city: addressDetails.city ? addressDetails.city.trim() : "",
        state: addressDetails.state ? addressDetails.state.trim() : "",
        pincode: addressDetails.pincode ? addressDetails.pincode.trim() : "",
      };
      user.markModified("addressDetails");
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        collegeName: user.collegeName,
        course: user.course,
        batchYear: user.batchYear,
        addressDetails: user.addressDetails,
        isOnboarded: user.isOnboarded,
        role: user.role,
        aiPlan: user.aiPlan
      }
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile", details: error.message }, { status: 500 });
  }
}
