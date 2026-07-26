import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    const { code, courseId, userId } = await req.json();

    if (!code) return NextResponse.json({ error: "Please enter a coupon code." }, { status: 400 });

    await connectToDatabase();
    
    // 1. Find the coupon (Case-insensitive check)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) return NextResponse.json({ error: "Invalid Coupon Code!" }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: "This coupon is no longer active." }, { status: 400 });
    
    // 2. Check Expiry Date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
    }

    // 3. Check Max Uses Limit
    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached." }, { status: 400 });
    }

    // 4. 🔥 Check Course Specific Restriction 🔥
    if (coupon.courseId && coupon.courseId !== courseId) {
      return NextResponse.json({ error: "This coupon is not valid for this specific course." }, { status: 400 });
    }

    // 5. 🔥 Check User Specific Restriction 🔥
    if (coupon.userId && coupon.userId !== userId) {
      return NextResponse.json({ error: "This coupon is tied to another specific user." }, { status: 400 });
    }

    // If all checks pass, return the discount percentage
    return NextResponse.json({ 
      success: true, 
      discountPercentage: coupon.discountPercentage,
      message: "Coupon Applied Successfully!" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Coupon Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}