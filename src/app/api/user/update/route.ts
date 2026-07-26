import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { uid, name, mobile, collegeName, university, course, batchYear, address } = data;

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user by UID and update their details
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { 
        $set: {
          name,
          mobile,
          collegeName,
          university,
          course,
          batchYear,
          address,
          isOnboarded: true // ✅ Form fill hone ke baad isko true mark kar diya
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully", 
      data: updatedUser 
    }, { status: 200 });

  } catch (error: any) {
    console.error("User Update API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}