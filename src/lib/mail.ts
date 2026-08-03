import nodemailer from "nodemailer";

// 1. Email Bhejne wala Transporter Set karein
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Universal Email Sender Function
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"AyushGyaan Academy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html, // HTML format me design kiya hua email
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};