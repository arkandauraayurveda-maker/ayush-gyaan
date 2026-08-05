import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChatLog extends Document {
  userId: mongoose.Types.ObjectId; // कौन सा स्टूडेंट?
  courseId?: mongoose.Types.ObjectId; // किस कोर्स के अंदर पूछा?
  userMessage: string;
  aiResponse: string;
  isExactMatch: boolean; // True: अगर सिर्फ DB से श्लोक निकाला (AI API cost 0)
  modelUsed: 'none' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  feedback?: 'like' | 'dislike'; // Fine-tuning के लिए
  createdAt: Date;
}

const AIChatLogSchema = new Schema<IAIChatLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  userMessage: { type: String, required: true },
  aiResponse: { type: String, required: true },
  isExactMatch: { type: Boolean, default: false },
  modelUsed: { type: String, enum: ['none', 'gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-1.5-pro'], default: 'none' },
  feedback: { type: String, enum: ['like', 'dislike'] },
  createdAt: { type: Date, default: Date.now, expires: '30d' } // 🔥 30 Days Auto-Delete Magic
});

export default mongoose.models.AIChatLog || mongoose.model<IAIChatLog>('AIChatLog', AIChatLogSchema);