import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
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
    const { courseId, userId, appliedCouponCode, aiPlan, billingCycle } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const userDoc = await User.findOne({ uid: userId });

    // 🛡️ PREVENT DUPLICATE COURSE ENROLLMENT
    if (courseId && userDoc) {
      const alreadyHasCourse = userDoc.purchasedCourses?.some(
        (c: any) => c.courseId === courseId && c.status === "ACTIVE"
      );
      if (alreadyHasCourse) {
        return NextResponse.json({
          error: "You are already enrolled in this course! Access your modules from the Student Dashboard."
        }, { status: 400 });
      }
    }

    // 🛡️ PREVENT DUPLICATE / DOWNGRADE AI PLAN PURCHASE
    if (aiPlan && !courseId && userDoc) {
      const currentTier = (userDoc.aiPlan?.tier || "basic").toLowerCase();
      const requestedTier = aiPlan.toLowerCase();
      const tierRank: Record<string, number> = { free: 0, basic: 1, plus: 2, pro: 3 };

      if ((tierRank[requestedTier] || 0) <= (tierRank[currentTier] || 0)) {
        return NextResponse.json({
          error: `You already have an active subscription for Ayush ${currentTier.toUpperCase()} Plan (or higher)!`
        }, { status: 400 });
      }
    }

    let finalAmount = 0;
    let originalBaseAmount = 0;
    const cycle = billingCycle === "annual" || billingCycle === "yearly" ? "annual" : "monthly";

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
    // 🛤️ CASE 2: STANDALONE AI PLAN UPGRADE (MONTHLY vs ANNUAL)
    // =========================================================
    else if (aiPlan) {
      const settings = await SystemSettings.findOne({ settingId: "global_settings" });
      const pricing = settings?.aiPricing || { 
        basic: { monthly: 0, yearly: 0 }, 
        plus: { monthly: 199, yearly: 1999 }, 
        pro: { monthly: 499, yearly: 4999 } 
      };
      
      const planKey = aiPlan.toLowerCase();
      const planObj = pricing[planKey];

      if (typeof planObj === "number") {
        finalAmount = cycle === "annual" ? planObj * 12 : planObj;
      } else if (planObj && typeof planObj === "object") {
        finalAmount = cycle === "annual" ? (planObj.yearly || planObj.monthly * 12) : (planObj.monthly || 199);
      } else {
        finalAmount = planKey === "pro" ? (cycle === "annual" ? 4999 : 499) : (cycle === "annual" ? 1999 : 199);
      }
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
        billingCycle: cycle,
        appliedCouponCode: appliedCouponCode || "none"
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

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