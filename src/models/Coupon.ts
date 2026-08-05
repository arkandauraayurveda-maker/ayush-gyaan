import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g., DIWALI50
  
  discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], default: "PERCENTAGE" }, // PERCENTAGE or FLAT (INR)
  discountValue: { type: Number, required: true }, // e.g. 50 (% or ₹)
  discountPercentage: { type: Number }, // Backwards compatibility fallback

  minOrderAmount: { type: Number, default: 0 }, // Minimum total order value required (e.g. ₹499)
  
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date }, // Coupon expiration date
  
  // 🔥 RESTRICTIONS (Targeting)
  courseId: { type: String, default: null }, // Specific courseId or null for all courses
  userId: { type: String, default: null }, // Specific Firebase UID or null for all users
  
  usageCount: { type: Number, default: 0 }, // Current usage counter
  maxUses: { type: Number, default: 100 }, // Fixed max usages limit (e.g., 50 uses)
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);