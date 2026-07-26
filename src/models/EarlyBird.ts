import mongoose from "mongoose";

const EarlyBirdSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  subject: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now }
});

export default mongoose.models.EarlyBird || mongoose.model("EarlyBird", EarlyBirdSchema);