import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail } from "@/lib/mail"; // 🔥 IMPORTING OUR MAILER

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { uid, email, name, ...updateFields } = data; // email aur name nikal liya

    if (!uid) {
      return NextResponse.json({ error: "Missing Firebase UID" }, { status: 400 });
    }

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: { email, name, ...updateFields } },
      { new: true } 
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // 📧 🔥 SEND WELCOME EMAIL IN BACKGROUND
    if (email && updateFields.isOnboarded) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">Welcome to AyushGyaan Academy! 🎉</h2>
          <p style="color: #374151; font-size: 16px;">Namaste <b>${name || 'Doctor'}</b>,</p>
          <p style="color: #374151; font-size: 16px;">Your scholar profile has been verified successfully. You are now part of India's most advanced BAMS clinical ecosystem.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;">🎓 <b>Institution:</b> ${updateFields.collegeName || 'N/A'}</p>
            <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">📚 <b>Course:</b> ${updateFields.course || 'BAMS'}</p>
          </div>
          <p style="color: #374151; font-size: 16px;">You can now browse our premium courses and start your clinical mastery journey.</p>
          <a href="https://ayushgyaan.com/dashboard" style="display: block; width: 100%; text-align: center; background-color: #10b981; color: white; padding: 12px 0; text-decoration: none; font-weight: bold; border-radius: 8px; margin-top: 20px;">Go to Dashboard</a>
        </div>
      `;
      
      // Ise bina await ke chhod rahe hain taaki user ko loading ka wait na karna pade
      sendEmail(email, "Welcome to AyushGyaan Academy! 🎉", emailHtml);
    }

    return NextResponse.json({ success: true, message: "Profile updated!", user: updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error("User Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}