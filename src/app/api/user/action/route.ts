import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail } from "@/lib/mail"; // 🔥 MAIL IMPORTED

export async function POST(req: NextRequest) {
  try {
    const { userId, email, action, courseId } = await req.json();

    if (!userId || !action || !courseId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();
    
    let user = await User.findOne({ uid: userId });
    if (!user && email) {
      user = await User.findOne({ email: email });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Student not found in database" }, { status: 404 });
    }

    const studentName = user.name || "Scholar";
    const userEmail = user.email;

    // ==========================================
    // 🎨 PREMIUM RESPONSIVE EMAIL TEMPLATES
    // ==========================================
    
    // 1. Email Header & Footer (Har mail me common rahega)
    const mailHeader = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaebed;">
        <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">AyushGyaan Academy</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Premium Clinical Ecosystem</p>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
    `;
    
    const mailFooter = `
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eaebed;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Need help? Reply to this email or contact our support.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px;">© ${new Date().getFullYear()} AyushGyaan Academy. All rights reserved.</p>
        </div>
      </div>
    `;

    // 🟢 ACTION 1: GRANT ACCESS (Manual Gifting)
    if (action === "GRANT") {
      const hasActiveCourse = user.purchasedCourses?.some(
        (c: any) => c.courseId === courseId && c.status === "ACTIVE"
      );

      if (hasActiveCourse) {
        return NextResponse.json({ success: false, error: "Student already has active access." }, { status: 400 });
      }

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const newCourse = {
        courseId,
        purchaseDate: new Date(),
        expiryDate,
        status: "ACTIVE",
        grantedBy: "ADMIN"
      };

      await User.findByIdAndUpdate(
        user._id,
        { 
          $push: { purchasedCourses: newCourse },
          $pull: { checkoutIntent: { courseId: courseId } } 
        }
      );

      // 📧 Send Grant Email
      const grantHtml = `
        ${mailHeader}
        <h2 style="color: #1e293b; margin-top: 0;">Access Granted! 🎉</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Namaste <b>Dr. ${studentName}</b>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Great news! The management team at AyushGyaan Academy has manually granted you premium access to the following course:</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; rounded: 8px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #166534; font-size: 15px;">📚 <b>Course ID:</b> ${courseId}</p>
          <p style="margin: 10px 0 0 0; color: #166534; font-size: 15px;">⏳ <b>Validity:</b> 1 Year (Till ${expiryDate.toLocaleDateString()})</p>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 1.6;">You can now log in to your dashboard and start learning immediately.</p>
        
        <div style="text-align: center; margin-top: 35px;">
          <a href="https://ayushgyaan.com/dashboard" style="background-color: #059669; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);">Go to Dashboard</a>
        </div>
        ${mailFooter}
      `;
      sendEmail(userEmail, `🎉 Premium Access Granted: ${courseId}`, grantHtml);

      return NextResponse.json({ success: true, message: `Access granted for ${courseId}!` }, { status: 200 });
    } 
    
    // 🔴 ACTION 2: REVOKE ACCESS
    else if (action === "REVOKE") {
      await User.findByIdAndUpdate(user._id, { $pull: { purchasedCourses: { courseId: courseId } } });
      
      // 📧 Send Revoke Email
      const revokeHtml = `
        ${mailHeader}
        <h2 style="color: #1e293b; margin-top: 0;">Subscription Update</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Namaste <b>${studentName}</b>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">This is a notification regarding your AyushGyaan Academy account.</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your access to the course <b>${courseId}</b> has been revoked by the administration.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; rounded: 8px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">If you believe this is a mistake, or if your payment failed during a recent transaction, please reply to this email immediately so our team can assist you.</p>
        </div>
        ${mailFooter}
      `;
      sendEmail(userEmail, `Important: Subscription Update for ${courseId}`, revokeHtml);
      
      return NextResponse.json({ success: true, message: `Course revoked successfully.` }, { status: 200 });
    }

    // 🟠 ACTION 3: REFUND ACCESS
    else if (action === "REFUND") {
      await User.findByIdAndUpdate(user._id, { $pull: { purchasedCourses: { courseId: courseId } } });
      
      // 📧 Send Refund Email
      const refundHtml = `
        ${mailHeader}
        <h2 style="color: #1e293b; margin-top: 0;">Refund Initiated</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Namaste <b>${studentName}</b>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">As per your request or system detection, a refund has been initiated for your purchase of course <b>${courseId}</b>.</p>
        
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; rounded: 8px; margin: 25px 0; border-radius: 8px;">
          <p style="margin: 0; color: #b45309; font-size: 15px;">⏳ <b>Processing Time:</b> Please allow 5-7 business days for the amount to reflect in your original payment method.</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your access to this course has been removed. We hope to serve you again in the future!</p>
        ${mailFooter}
      `;
      sendEmail(userEmail, `Refund Initiated: ${courseId}`, refundHtml);
      
      return NextResponse.json({ success: true, message: `Course refunded successfully.` }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: "Invalid Action specified." }, { status: 400 });

  } catch (error: any) {
    console.error("Admin Action Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}