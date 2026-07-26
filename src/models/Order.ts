import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID
  courseId: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String }, // Yeh payment success hone ke baad aayega
  amount: { type: Number, required: true }, // In INR
  status: { 
    type: String, 
    enum: ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'], 
    default: 'CREATED' 
  },
  createdAt: { type: Date, default: Date.now },
  refundedAt: { type: Date }
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);