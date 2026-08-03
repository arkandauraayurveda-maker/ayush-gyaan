import mongoose from "mongoose";

// 1. Shloka Schema
const ShlokaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  shlokaNumber: { type: String, required: true },
  mool_shloka: { type: String, required: true },
  padchhed: { type: String, required: true },
  word_meaning: { type: Map, of: String }, // 🔥 JSON Object (Word: Meaning) ke liye Map
  anuwad: { type: String, required: true },
  vimarsh: { type: String } // HTML tags allowed (<span class="notranslate"> shlok </span>)
});

// 2. Chapter Schema
const ChapterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  shlokas: [ShlokaSchema]
});

// 3. Main Course Content Schema
const CourseContentSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true, index: true }, // Jaise: 'sa1'
  title: { type: String, required: true }, // Jaise: "Charak Samhita - Sutrasthana"
  chapters: [ChapterSchema]
}, { timestamps: true });

export default mongoose.models.CourseContent || mongoose.model("CourseContent", CourseContentSchema);
