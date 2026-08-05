import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import SystemSettings from "@/models/SystemSettings";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    const courses = await Course.find({ isActive: true })
      .sort({ highlight: -1, createdAt: -1 })
      .lean();

    const settings = await SystemSettings.findOne({ settingId: "global_settings" }).lean();

    return NextResponse.json({ 
      success: true, 
      courses: courses || [],
      settings: settings || null
    }, { status: 200 });

  } catch (error: any) {
    console.error("Public Courses Fetch Warning (Network/DB Retry Needed):", error.message);
    // Graceful fallback to prevent front-end crash during DNS/Network drops
    return NextResponse.json({ 
      success: false, 
      courses: [],
      error: "Database connection temporarily unavailable. Please check internet connection.",
      isNetworkError: true
    }, { status: 200 });
  }
}