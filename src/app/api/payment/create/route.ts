import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import SystemSettings from "@/models/SystemSettings"; // 🔥 NEW: For dynamic AI Pricing

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

    // =========================================================
    // 🛤️ रास्ता 1: COURSE CHECKOUT (आपका पुराना लॉजिक - 100% Safe)
    // =========================================================
    if (courseId) {
      const course = await Course.findOne({ courseId: courseId });
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

      let activePriceString = course.price;
      if (aiPlan === "basic" && course.priceBasic) activePriceString = course.priceBasic;
      if (aiPlan === "plus" && course.pricePlus) activePriceString = course.pricePlus;
      if (aiPlan === "pro" && course.pricePro) activePriceString = course.pricePro;

      finalAmount = parseInt(activePriceString.toString().replace(/\D/g, ""), 10);

      if (finalAmount <= 0) {
        return NextResponse.json({ error: "Invalid price configuration" }, { status: 400 });
      }

      // 🔥 COUPON RE-VERIFICATION
      if (appliedCouponCode) {
        const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });
        
        if (coupon && coupon.isActive) {
          const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
          const isNotExhausted = !coupon.maxUses || coupon.usageCount < coupon.maxUses;
          const isForThisCourse = !coupon.courseId || coupon.courseId === courseId || coupon.courseId === "ALL";
          const isForThisUser = !coupon.userId || coupon.userId === userId;

          if (isNotExpired && isNotExhausted && isForThisCourse && isForThisUser) {
            const discountAmount = (finalAmount * coupon.discountPercentage) / 100;
            finalAmount = Math.round(finalAmount - discountAmount);
          } else {
             return NextResponse.json({ error: "Coupon conditions failed at checkout." }, { status: 400 });
          }
        }
      }
    } 
    // =========================================================
    // 🛤️ रास्ता 2: STANDALONE AI UPGRADE (चैटबॉट से डायरेक्ट पेमेंट)
    // =========================================================
    else if (aiPlan) {
      // 1. एडमिन पैनल (SystemSettings) से डायनामिक प्राइसिंग मंगाना
      const settings = await SystemSettings.findOne({ settingId: "global_settings" });
      
      // (अगर एडमिन ने प्राइस सेट नहीं किया है, तो फ़ॉलबैक डिफ़ॉल्ट प्राइस ₹199/₹499 यूज़ होगा)
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
    
    // Razorpay requires minimum ₹1
    if (finalAmount < 1) {
      return NextResponse.json({ error: "Order amount cannot be zero via Razorpay." }, { status: 400 });
    }

    const options = {
      amount: finalAmount * 100, 
      currency: "INR",
      receipt: `receipt_${userId.substring(0,5)}_${Date.now()}`,
      notes: { 
        courseId: courseId || "none", // चैटबॉट वाले केस में यह "none" जाएगा
        userId, 
        aiPlan: aiPlan || "none" 
      }
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Save to Database (Pending Status)
    const newOrder = new Order({
      userId,
      courseId: courseId || null, // कोर्स न होने पर null सेव होगा
      razorpayOrderId: rzpOrder.id,
      amount: finalAmount,
      status: "CREATED",
      aiPlanIntent: aiPlan || "none" 
    });
    
    await newOrder.save();

    return NextResponse.json({ success: true, order: rzpOrder, dbOrderId: newOrder._id }, { status: 200 });

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: "Could not initiate payment" }, { status: 500 });
  }
}