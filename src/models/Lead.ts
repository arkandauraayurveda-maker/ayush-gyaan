import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  status: { type: String, default: "PRE_REGISTERED" }, // Status for CRM
  couponSent: { type: Boolean, default: false }, // Future tracking ke liye
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);