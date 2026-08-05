import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  uid: string; 
  email: string;
  name: string;
  mobile?: string;
  collegeName?: string;
  course?: string;
  batchYear?: string;
  addressDetails?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  isOnboarded: boolean;
  role: "user" | "student" | "admin" | "co-admin";
  allowedAdminTabs?: string[];

  purchasedCourses: {
    courseId: string;
    purchaseDate: Date;
    expiryDate: Date;
    status: string; 
    grantedBy: string;
  }[];

  aiPlan: {
    tier: string;          // "free" | "basic" | "plus" | "pro"
    tokens: number;        // REMAINING TOKENS
    lastActiveDate: Date;  // Token Reset date check
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
  mobile: { type: String, default: "" },
  collegeName: { type: String, default: "" },
  course: { type: String, default: "" },
  batchYear: { type: String, default: "" },
  addressDetails: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
  },
  isOnboarded: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "student", "admin", "co-admin"], default: "user" },
  allowedAdminTabs: [{ type: String, default: [] }],

  purchasedCourses: [{
    courseId: { type: String },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: { type: String, default: "ACTIVE" },
    grantedBy: { type: String, default: "SYSTEM" }
  }],

  aiPlan: {
    tier: { type: String, default: "free" },
    tokens: { type: Number, default: 10 },
    lastActiveDate: { type: Date, default: Date.now },
    validityEnd: { type: Date }
  }
}, { timestamps: true });

export default models.User || mongoose.model<IUser>("User", UserSchema);