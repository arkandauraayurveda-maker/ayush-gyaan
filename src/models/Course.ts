import mongoose, { Schema, Document, models } from "mongoose";

export interface ICourse extends Document {
  courseId: string;
  title: string;
  prof: string;
  status: string;
  price: string;
  priceBasic?: string;
  pricePlus?: string;
  pricePro?: string;
  originalPrice?: string;
  discountText?: string;
  badge?: string;
  startDate?: string;
  couponCode?: string;
  duration: string;
  syllabus: string[];
  highlight: boolean;
  isActive: boolean;
  isSamhitaCourse: boolean;
  allowedChapters: { sthana: string; chapters: string }[];
  aiSettings: {
    isAiEnabled: boolean;
    allowedSamhitas: string[];
    allowedChapters: string[];
  };
}

const CourseSchema = new Schema<ICourse>({
  courseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  prof: { type: String, required: true },
  status: { type: String, required: true },
  price: { type: String, required: true },
  
  // 🔥 NEW TIERED PRICING FIELDS
  priceBasic: { type: String, default: "" },
  pricePlus: { type: String, default: "" },
  pricePro: { type: String, default: "" },
  
  originalPrice: { type: String },
  discountText: { type: String },
  badge: { type: String },
  startDate: { type: String },
  couponCode: { type: String },
  duration: { type: String, required: true },
  syllabus: [{ type: String }],
  highlight: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  isSamhitaCourse: { type: Boolean, default: false },
  allowedChapters: [{
    sthana: { type: String },
    chapters: { type: String }
  }],
  
  // 🤖 NEW AI SETTINGS
  aiSettings: {
    isAiEnabled: { type: Boolean, default: false },
    allowedSamhitas: [{ type: String }],
    allowedChapters: [{ type: String }]
  }
}, { timestamps: true });

export default models.Course || mongoose.model<ICourse>("Course", CourseSchema);