import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true }, // e.g., DIWALI50
  discountPercentage: { type: Number, required: true }, // e.g., 50 (for 50% OFF)
  
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date }, // कूपन कब एक्सपायर होगा
  
  // 🔥 RESTRICTIONS (पाबंदियां) 🔥
  courseId: { type: String, default: null }, // अगर किसी खास कोर्स (sa1) के लिए है। खाली है तो सब पर चलेगा।
  userId: { type: String, default: null }, // अगर किसी खास स्टूडेंट को गिफ्ट करना है (Firebase UID)
  
  usageCount: { type: Number, default: 0 }, // कितनी बार इस्तेमाल हो चुका है
  maxUses: { type: Number, default: 100 }, // लिमिट (जैसे सिर्फ पहले 100 स्टूडेंट्स के लिए)
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);