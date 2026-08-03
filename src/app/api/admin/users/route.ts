import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// 🔥 NEXT.JS MAGIC: Is line se Next.js purana data save (cache) nahi karega
// Aur har baar database se fresh list aayegi!
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Naye students sabse upar dikhane ke liye sort({ createdAt: -1 }) lagaya hai
    const users = await User.find()
      .select("uid name email role aiPlan purchasedCourses createdAt") // 🔥 PERFORMANCE BOOST
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    console.error("Admin Users Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 });
  }
}