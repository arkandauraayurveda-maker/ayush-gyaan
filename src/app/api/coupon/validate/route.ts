import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    const { code, courseId, orderAmount, userId } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    await connectToDatabase();

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Invalid coupon code!" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ success: false, error: "This coupon is currently inactive!" }, { status: 400 });
    }

    // 1. ⏳ Expiry Check
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ success: false, error: "This coupon code has expired!" }, { status: 400 });
    }

    // 2. 🛑 Fixed Max Uses Check
    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: "Coupon usage limit reached! No longer available." }, { status: 400 });
    }

    // 3. 💰 Minimum Order Amount Check
    const amount = Number(orderAmount) || 0;
    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      return NextResponse.json({ 
        success: false, 
        error: `Minimum purchase of ₹${coupon.minOrderAmount} required for this coupon!` 
      }, { status: 400 });
    }

    // 4. 🎓 Course Applicability Check
    if (coupon.courseId && coupon.courseId !== "ALL" && courseId && coupon.courseId !== courseId) {
      return NextResponse.json({ success: false, error: "This coupon is not valid for the selected course!" }, { status: 400 });
    }

    // 5. 👤 User Restriction Check
    if (coupon.userId && userId && coupon.userId !== userId) {
      return NextResponse.json({ success: false, error: "This coupon is assigned to another user!" }, { status: 400 });
    }

    // 💵 CALCULATE DISCOUNT
    let discountAmount = 0;
    const discountVal = coupon.discountValue || coupon.discountPercentage || 0;

    if (coupon.discountType === "FLAT") {
      discountAmount = discountVal;
    } else {
      // Percentage
      discountAmount = Math.round((amount * discountVal) / 100);
    }

    // Discount cannot exceed order total
    if (discountAmount > amount) discountAmount = amount;
    const finalAmount = Math.max(0, amount - discountAmount);

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType || "PERCENTAGE",
      discountValue: discountVal,
      discountAmount,
      finalAmount,
      message: `Coupon applied! You saved ₹${discountAmount}`
    });

  } catch (error: any) {
    console.error("Validate Coupon Error:", error);
    return NextResponse.json({ success: false, error: "Failed to validate coupon" }, { status: 500 });
  }
}
