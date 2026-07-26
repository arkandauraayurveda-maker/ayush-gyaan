import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectToDatabase();
    
    // सिर्फ वो कोर्सेज लाएगा जिनका isActive: true है
    // और उन्हें क्रिएट होने की डेट के हिसाब से सॉर्ट करेगा
    const courses = await Course.find({ isActive: true }).sort({ createdAt: 1 });
    
    return NextResponse.json({ success: true, courses }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch public courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}