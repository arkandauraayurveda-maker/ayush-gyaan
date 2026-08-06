import mongoose, { Schema, Document, models } from "mongoose";

export interface IAIRequestLog extends Document {
  requestId: string;
  userId: string;
  sessionId?: string;
  featureName: string; // "Chat", "Ask AI", "MCQ Generator", "Notes Generator", "Quiz", "Flashcards", "Case Discussion", "Image Analysis", "Voice Chat", "PDF Chat", "RAG Search", "Summary", "Translation"
  provider: string; // default: "google"
  modelName: string;
  inputType: "TEXT" | "IMAGE" | "VOICE";
  speechDurationSec?: number;
  transcriptLength?: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCostInr: number;
  status: "SUCCESS" | "ERROR" | "RATE_LIMITED";
  errorMessage?: string;
  createdAt: Date;
}

const AIRequestLogSchema = new Schema<IAIRequestLog>({
  requestId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },
  featureName: { type: String, required: true, index: true },
  provider: { type: String, default: "google", index: true },
  modelName: { type: String, required: true, index: true },
  inputType: { type: String, enum: ["TEXT", "IMAGE", "VOICE"], required: true, index: true },
  speechDurationSec: { type: Number, default: 0 },
  transcriptLength: { type: Number, default: 0 },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  thinkingTokens: { type: Number, default: 0 },
  cachedTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  estimatedCostInr: { type: Number, default: 0 },
  status: { type: String, enum: ["SUCCESS", "ERROR", "RATE_LIMITED"], default: "SUCCESS", index: true },
  errorMessage: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// ⚡ Compound Indexes for High-Performance Aggregations (100,000+ users scale)
AIRequestLogSchema.index({ createdAt: -1 });
AIRequestLogSchema.index({ userId: 1, createdAt: -1 });
AIRequestLogSchema.index({ featureName: 1, createdAt: -1 });
AIRequestLogSchema.index({ modelName: 1, createdAt: -1 });
AIRequestLogSchema.index({ status: 1, createdAt: -1 });

export default models.AIRequestLog || mongoose.model<IAIRequestLog>("AIRequestLog", AIRequestLogSchema);
