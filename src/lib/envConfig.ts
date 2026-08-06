/**
 * 🛡️ Runtime Environment Variable Validator & Configuration Helper
 * Ensures all required AyushGyaan server environment variables are populated.
 */

export interface EnvConfig {
  mongodbUri: string;
  geminiApiKey: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  emailUser?: string;
  emailPass?: string;
}

export function validateEnv(): EnvConfig {
  const mongodbUri = process.env.MONGODB_URI || "";
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const emailUser = process.env.EMAIL_USER || "";
  const emailPass = process.env.EMAIL_PASS || "";

  const missing: string[] = [];
  if (!mongodbUri) missing.push("MONGODB_URI");
  if (!geminiApiKey) missing.push("GEMINI_API_KEY");

  if (missing.length > 0) {
    console.warn(`[Env Warning] Missing required environment variables: ${missing.join(", ")}. Please check your .env.local file.`);
  }

  return {
    mongodbUri,
    geminiApiKey,
    firebaseClientEmail,
    firebasePrivateKey,
    razorpayKeyId,
    razorpayKeySecret,
    emailUser,
    emailPass
  };
}

export const env = validateEnv();
