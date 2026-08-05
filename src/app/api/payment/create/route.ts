import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import SystemSettings from "@/models/SystemSettings";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { courseId, userId, appliedCouponCode, aiPlan } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let finalAmount = 0;
    let originalBaseAmount = 0;

    // =========================================================
    // 🛤️ CASE 1: COURSE CHECKOUT
    // =========================================================
    if (courseId) {
      const course = await Course.findOne({ courseId: courseId });
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

      let activePriceString = course.price;
      if (aiPlan === "basic" && course.priceBasic) activePriceString = course.priceBasic;
      if (aiPlan === "plus" && course.pricePlus) activePriceString = course.pricePlus;
      if (aiPlan === "pro" && course.pricePro) activePriceString = course.pricePro;

      originalBaseAmount = parseInt(activePriceString.toString().replace(/\D/g, ""), 10);
      finalAmount = originalBaseAmount;

      if (finalAmount <= 0) {
        return NextResponse.json({ error: "Invalid price configuration" }, { status: 400 });
      }

      // 🛡️ ZERO-TRUST SERVER-SIDE COUPON VERIFICATION
      if (appliedCouponCode) {
        const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });
        
        if (!coupon) {
          return NextResponse.json({ error: "Coupon code does not exist!" }, { status: 400 });
        }
        if (!coupon.isActive) {
          return NextResponse.json({ error: "Coupon is currently inactive!" }, { status: 400 });
        }

        const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
        const isNotExhausted = !coupon.maxUses || coupon.usageCount < coupon.maxUses;
        const isMinAmountMet = !coupon.minOrderAmount || originalBaseAmount >= coupon.minOrderAmount;
        const isForThisCourse = !coupon.courseId || coupon.courseId === "ALL" || coupon.courseId === courseId;
        const isForThisUser = !coupon.userId || coupon.userId === userId;

        if (isNotExpired && isNotExhausted && isMinAmountMet && isForThisCourse && isForThisUser) {
          let discountVal = coupon.discountValue || coupon.discountPercentage || 0;
          let discountAmt = 0;

          if (coupon.discountType === "FLAT") {
            discountAmt = discountVal;
          } else {
            discountAmt = Math.round((originalBaseAmount * discountVal) / 100);
          }

          finalAmount = Math.max(1, originalBaseAmount - discountAmt);
        } else {
          return NextResponse.json({ 
            error: "Coupon conditions failed (expired, limit reached, or min order amount not met)." 
          }, { status: 400 });
        }
      }
    } 
    // =========================================================
    // 🛤️ CASE 2: STANDALONE AI UPGRADE
    // =========================================================
    else if (aiPlan) {
      const settings = await SystemSettings.findOne({ settingId: "global_settings" });
      const pricing = settings?.aiPricing || { basic: 49, plus: 199, pro: 499 };
      
      if (aiPlan === "basic") finalAmount = pricing.basic || 49;
      else if (aiPlan === "plus") finalAmount = pricing.plus || 199;
      else if (aiPlan === "pro") finalAmount = pricing.pro || 499;
      else return NextResponse.json({ error: "Invalid AI Plan selected" }, { status: 400 });
    } 
    else {
      return NextResponse.json({ error: "Either Course ID or AI Plan is required" }, { status: 400 });
    }

    // =========================================================
    // 💳 RAZORPAY ORDER CREATION
    // =========================================================
    if (finalAmount < 1) {
      return NextResponse.json({ error: "Order amount cannot be zero via Razorpay." }, { status: 400 });
    }

    const options = {
      amount: finalAmount * 100, 
      currency: "INR",
      receipt: `receipt_${userId.substring(0,5)}_${Date.now()}`,
      notes: { 
        courseId: courseId || "none",
        userId, 
        aiPlan: aiPlan || "none",
        appliedCouponCode: appliedCouponCode || "none"
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Save Pending Order
    const newOrder = new Order({
      userId,
      courseId: courseId || null,
      razorpayOrderId: rzpOrder.id,
      amount: finalAmount,
      status: "CREATED",
      aiPlanIntent: aiPlan || "none",
      appliedCoupon: appliedCouponCode || null
    });
    
    await newOrder.save();

    return NextResponse.json({ success: true, order: rzpOrder, dbOrderId: newOrder._id }, { status: 200 });

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: "Could not initiate payment" }, { status: 500 });
  }
}