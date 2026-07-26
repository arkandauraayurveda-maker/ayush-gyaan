import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { razorpayOrderId, userId, courseId } = await req.json();
    await connectToDatabase();

    const order = await Order.findOne({ razorpayOrderId, userId });
    if (!order || order.status !== "SUCCESS") {
      return NextResponse.json({ error: "Valid successful order not found." }, { status: 404 });
    }

    // 🕒 5-Day Timeframe Logic Check
    const orderDate = new Date(order.createdAt).getTime();
    const currentDate = new Date().getTime();
    const daysPassed = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

    if (daysPassed > 5) {
      return NextResponse.json({ error: "Refund window (5 days) has expired." }, { status: 400 });
    }

    // Process Refund via Razorpay API
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      speed: "optimum" // Normal speed for refund processing
    });

    // Update Order & Remove Course Access
    order.status = "REFUNDED";
    order.refundedAt = new Date();
    await order.save();

    const user = await User.findOne({ uid: userId });
    if (user) {
      user.purchasedCourses = user.purchasedCourses.filter((id: string) => id !== courseId);
      await user.save();
    }

    return NextResponse.json({ success: true, message: "Refund initiated successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Refund Error:", error);
    return NextResponse.json({ error: "Could not process refund." }, { status: 500 });
  }
}