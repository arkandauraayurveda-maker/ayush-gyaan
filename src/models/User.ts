import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  mobile: { type: String, default: "" },
  collegeName: { type: String, default: "" },
  university: { type: String, default: "" },
  course: { type: String, default: "BAMS" },
  batchYear: { type: String, default: "" },
  address: { type: String, default: "" },
  isOnboarded: { type: Boolean, default: false }, // Checks if form is filled
  role: { type: String, default: "student" },
  purchasedCourses: [{ type: String }], // Array of Course IDs
  lastActiveAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);