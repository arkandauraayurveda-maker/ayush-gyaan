import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true }, 
  title: { type: String, required: true }, 
  prof: { type: String, required: true }, 
  status: { type: String, required: true }, // e.g., 'Available Now', 'Coming Soon'
  
  price: { type: String, required: true }, 
  originalPrice: { type: String }, // For strikethrough (e.g., ₹1999)
  discountText: { type: String }, // e.g., '70% OFF'
  badge: { type: String }, // e.g., 'HOT 🔥'
  startDate: { type: String }, // e.g., 'Starts 15 Aug'
  couponCode: { type: String }, // e.g., 'BAMS50'
  
  duration: { type: String, required: true }, 
  syllabus: [{ type: String }], 
  highlight: { type: Boolean, default: false }, 
  isActive: { type: Boolean, default: true }, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);