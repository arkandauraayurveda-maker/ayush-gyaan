import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID
  
  // 🔥 FIXED: Standalone AI Plan purchase ke liye isko false karna zaroori tha
  courseId: { type: String, required: false, default: null }, 
  
  // 🔥 NEW: Check karne ke liye ki yeh kis cheez ka order hai
  aiPlanIntent: { type: String, default: "none" }, 

  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String }, // Yeh payment success hone ke baad aayega
  amount: { type: Number, required: true }, // In INR
  
  status: { 
    type: String, 
    // 🔥 FIXED: Puraane verify code mein hum 'PAID' bhej rahe the, isliye PAID add kiya
    enum: ['CREATED', 'SUCCESS', 'PAID', 'FAILED', 'REFUNDED'], 
    default: 'CREATED' 
  },
  
  createdAt: { type: Date, default: Date.now },
  refundedAt: { type: Date }
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);