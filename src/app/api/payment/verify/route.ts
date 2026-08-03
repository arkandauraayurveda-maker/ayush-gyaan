import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId, aiPlan } = await req.json();
    
    // 1. 🛡️ VERIFY SIGNATURE (Security Core)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", secret!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature! Potential fraud attempt." }, { status: 400 });
    }

    await connectToDatabase();

    // 2. Update Order Status
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { 
        status: "PAID", 
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found in DB" }, { status: 404 });
    }

    const updateQuery: any = { $set: {} };

    // 3. 🎓 GRANT COURSE ACCESS (सिर्फ़ तब, जब courseId मौजूद हो)
    if (courseId) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 Year Access default

      updateQuery.$push = {
        purchasedCourses: {
          courseId: courseId,
          purchaseDate: new Date(),
          expiryDate: expiryDate,
          status: "ACTIVE",
          grantedBy: "SYSTEM_PURCHASE"
        }
      };
    }

    // 4. 🤖 CONFIGURE AI PLAN & TOKENS
    if (aiPlan && aiPlan !== "none") {
      let tokensToAssign = 0;
      if (aiPlan === "pro") tokensToAssign = 9999; // Unlimited for PRO
      else if (aiPlan === "plus") tokensToAssign = 1000;
      else if (aiPlan === "basic") tokensToAssign = 50;

      const nextRefill = new Date();
      nextRefill.setMonth(nextRefill.getMonth() + 1); // Token validity 1 month

      updateQuery.$set = {
        "aiPlan.tier": aiPlan,
        "aiPlan.tokens": tokensToAssign,
        "aiPlan.validityEnd": nextRefill, 
        "aiPlan.tokenRefillDate": nextRefill
      };
    }

    // 5. 🚀 UPDATE USER PROFILE IN DATABASE
    // अगर updateQuery.$set खाली है, तो उसे हटा दें ताकि MongoDB एरर न दे
    if (Object.keys(updateQuery.$set).length === 0) delete updateQuery.$set;

    await User.findOneAndUpdate(
      { uid: userId },
      updateQuery
    );

    return NextResponse.json({ 
      success: true, 
      message: "Payment verified & benefits granted successfully!" 
    });

  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ success: false, error: "Server error during verification" }, { status: 500 });
  }
}