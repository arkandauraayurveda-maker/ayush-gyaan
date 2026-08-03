import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";

// Next.js caching optimization
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // सिर्फ वही कोर्सेस फेच करें जो Live (isActive: true) हैं 
    const courses = await Course.find({ isActive: true })
      .sort({ highlight: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, courses }, { status: 200 });
  } catch (error: any) {
    console.error("Public Courses Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}