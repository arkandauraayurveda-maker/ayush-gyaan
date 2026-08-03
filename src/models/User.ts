import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  uid: string; 
  email: string;
  name: string;
  mobile?: string;
  // ... (बाकी पुराने फील्ड्स जैसे collegeName, address आदि)
  isOnboarded: boolean;
  
  // 👑 Role & Security
  // पहले यह था: role: "user" | "admin";
  // अब इसे यह कर दें:
  role: "user" | "student" | "admin";

  purchasedCourses: {
    courseId: string;
    purchaseDate: Date;
    expiryDate: Date;
    status: string; 
    grantedBy: string;
  }[];

  // 🤖 🔥 AI Subscription & Token Economy
  aiPlan: {
    tier: string;          // "free" | "basic" | "plus" | "pro"
    tokens: number;        // 🔥 REMAINING TOKENS (Countdown: 10 -> 9 -> 8)
    lastActiveDate: Date;  // 🔥 To check if it's a new day for Token Reset
    validityEnd?: Date;    // Paid Plan expiry date
  };

  checkoutIntent: {
    courseId: string;
    timestamp: Date;
  }[];
}

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  isOnboarded: { type: Boolean, default: false },

  // पहले यह था: role: { type: String, enum: ["user", "admin"], default: "user" },
  // अब इसे यह कर दें:
  role: { type: String, enum: ["user", "student", "admin"], default: "user" },

  purchasedCourses: [{
    courseId: { type: String },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: { type: String, default: "ACTIVE" }
  }],

  // 🤖 🔥 Secure AI Schema
  aiPlan: {
    tier: { type: String, default: "free" },
    tokens: { type: Number, default: 10 }, // डिफ़ॉल्ट 10 टोकन
    lastActiveDate: { type: Date, default: Date.now },
    validityEnd: { type: Date }
  }
}, { timestamps: true });

export default models.User || mongoose.model<IUser>("User", UserSchema);