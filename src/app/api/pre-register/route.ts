import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile, course } = await req.json();

    if (!name || !email || !mobile) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if already registered
    const existingLead = await Lead.findOne({ email });
    if (existingLead) {
      return NextResponse.json({ success: false, error: "You are already pre-registered!" }, { status: 400 });
    }

    // Save New Lead
    const newLead = await Lead.create({ 
      name, 
      email, 
      mobile, 
      course: course || "BAMS 1st Prof." 
    });

    // 📧 SEND MARKETING/THANK YOU EMAIL
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Pre-Registration Successful! 🚀</h1>
        </div>
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <p style="color: #374151; font-size: 16px;">Namaste <b>${name}</b>,</p>
          <p style="color: #374151; font-size: 16px;">Thank you for showing interest in AyushGyaan Academy. Your spot has been reserved!</p>
          <p style="color: #374151; font-size: 16px;">We will notify you on this email when we release special early-bird discounts and coupons just for you.</p>
          <p style="color: #059669; font-size: 16px; font-weight: bold; margin-top: 20px;">Stay tuned for more updates!</p>
        </div>
      </div>
    `;
    sendEmail(email, "Welcome to AyushGyaan Waitlist! 🎉", emailHtml);

    return NextResponse.json({ success: true, message: "Pre-registration successful!" }, { status: 200 });

  } catch (error: any) {
    console.error("Pre-Register Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}