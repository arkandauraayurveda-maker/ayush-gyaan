import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon"; // 🔥 Coupon Model Import

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    // Frontend ab coupon code bhi bhejega (agar user ne apply kiya ho)
    const { courseId, userId, appliedCouponCode } = await req.json();
    await connectToDatabase();

    // 1. Fetch Original Price from Database
    const course = await Course.findOne({ courseId: courseId });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Base price extract karna ("₹599" -> 599)
    let finalAmount = parseInt(course.price.replace(/\D/g, ""), 10);

    // 2. 🔥 COUPON RE-VERIFICATION (Backend Logic) 🔥
    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });
      
      if (coupon && coupon.isActive) {
        // Validation Checks
        const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
        const isNotExhausted = !coupon.maxUses || coupon.usageCount < coupon.maxUses;
        const isForThisCourse = !coupon.courseId || coupon.courseId === courseId;
        const isForThisUser = !coupon.userId || coupon.userId === userId;

        if (isNotExpired && isNotExhausted && isForThisCourse && isForThisUser) {
          // Calculate Discounted Price
          const discountAmount = (finalAmount * coupon.discountPercentage) / 100;
          finalAmount = Math.round(finalAmount - discountAmount); // Ensure it's a whole number
          
          // Optionally: Increase usage count of coupon (Best to do this after successful payment, but for now we keep it simple)
        } else {
           return NextResponse.json({ error: "Coupon conditions failed at checkout. Payment blocked." }, { status: 400 });
        }
      }
    }

    // Prevent Free Courses via 100% coupon (Razorpay requires minimum ₹1)
    if (finalAmount < 1) {
      return NextResponse.json({ error: "Order amount cannot be zero via Razorpay." }, { status: 400 });
    }

    // 3. Create Razorpay Order (Multiply by 100 for paise)
    const options = {
      amount: finalAmount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const rzpOrder = await razorpay.orders.create(options);

    // 4. Save to Database
    const newOrder = new Order({
      userId,
      courseId,
      razorpayOrderId: rzpOrder.id,
      amount: finalAmount, // Save the actual discounted amount paid
      status: "CREATED"
    });
    await newOrder.save();

    return NextResponse.json({ success: true, order: rzpOrder, dbOrderId: newOrder._id }, { status: 200 });

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: "Could not initiate payment" }, { status: 500 });
  }
}