import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId } = await req.json();

    // 🔒 SECURE VERIFICATION: Generating Signature manually
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    await connectToDatabase();

    if (isAuthentic) {
      // 1. Update Order Status
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "SUCCESS", razorpayPaymentId: razorpay_payment_id }
      );

      // 2. Grant Access to Student
      const user = await User.findOne({ uid: userId });
      if (user && !user.purchasedCourses.includes(courseId)) {
        user.purchasedCourses.push(courseId);
        await user.save();
      }

      return NextResponse.json({ success: true, message: "Payment Verified & Course Granted!" }, { status: 200 });
    } else {
      // Failed Verification
      await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: "FAILED" });
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}