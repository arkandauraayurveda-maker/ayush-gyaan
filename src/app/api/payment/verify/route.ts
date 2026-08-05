import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId, aiPlan, billingCycle, appliedCouponCode } = await req.json();
    
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

    // 🏷️ ATOMICAL INCREMENT COUPON USAGE COUNT
    const couponToIncrement = appliedCouponCode || order.appliedCoupon;
    if (couponToIncrement && couponToIncrement !== "none") {
      await Coupon.findOneAndUpdate(
        { code: couponToIncrement.toUpperCase() },
        { $inc: { usageCount: 1 } }
      );
    }

    const updateQuery: any = { $set: {} };

    // 3. 🎓 GRANT COURSE ACCESS
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

    // 4. 🤖 CONFIGURE AI PLAN & TOKENS ACCORDING TO BILLING CYCLE
    if (aiPlan && aiPlan !== "none") {
      let tokensToAssign = 10;
      if (aiPlan === "pro") tokensToAssign = 9999;
      else if (aiPlan === "plus") tokensToAssign = 100;
      else if (aiPlan === "basic") tokensToAssign = 10;

      const cycle = billingCycle === "annual" || billingCycle === "yearly" ? "annual" : "monthly";
      const validityEnd = new Date();

      if (cycle === "annual") {
        validityEnd.setFullYear(validityEnd.getFullYear() + 1); // 1 Full Year (365 days)
      } else {
        validityEnd.setMonth(validityEnd.getMonth() + 1); // 1 Month
      }

      updateQuery.$set = {
        "aiPlan.tier": aiPlan.toLowerCase(),
        "aiPlan.tokens": tokensToAssign,
        "aiPlan.validityEnd": validityEnd,
        "aiPlan.billingCycle": cycle
      };
    }

    // 5. 🚀 UPDATE USER PROFILE IN DATABASE
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