import connectToDatabase from "@/lib/mongodb";
import AIRequestLog from "@/models/AIRequestLog";
import SystemSettings from "@/models/SystemSettings";
import { calculateAICostInr } from "@/lib/aiPricingEngine";
import { crypto } from "crypto";

export interface LogAIRequestParams {
  userId: string;
  sessionId?: string;
  featureName?: string;
  provider?: string;
  modelName: string;
  inputType?: "TEXT" | "IMAGE" | "VOICE";
  speechDurationSec?: number;
  transcriptLength?: number;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
    candidatesTokensDetails?: Array<{ thinkingTokenCount?: number }>;
  };
  latencyMs: number;
  status?: "SUCCESS" | "ERROR" | "RATE_LIMITED";
  errorMessage?: string;
}

/**
 * Extract Gemini usage metadata, computes cost in ₹ INR, and logs AIRequestLog to MongoDB asynchronously.
 */
export async function logAIRequest(params: LogAIRequestParams): Promise<void> {
  try {
    await connectToDatabase();

    const settings = await SystemSettings.findOne({ settingId: "global_settings" }).lean();
    const customPricingMap = settings?.modelTokenPricingInr;

    const inputTokens = params.usageMetadata?.promptTokenCount || 0;
    const outputTokens = params.usageMetadata?.candidatesTokenCount || 0;
    const cachedTokens = params.usageMetadata?.cachedContentTokenCount || 0;
    const thinkingTokens = params.usageMetadata?.candidatesTokensDetails?.[0]?.thinkingTokenCount || 0;
    const totalTokens = params.usageMetadata?.totalTokenCount || (inputTokens + outputTokens);

    const costInr = calculateAICostInr(
      params.provider || "google",
      params.modelName,
      inputTokens,
      outputTokens,
      cachedTokens,
      thinkingTokens,
      customPricingMap
    );

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await AIRequestLog.create({
      requestId,
      userId: params.userId,
      sessionId: params.sessionId || `sess_${params.userId}`,
      featureName: params.featureName || "Chat",
      provider: params.provider || "google",
      modelName: params.modelName,
      inputType: params.inputType || "TEXT",
      speechDurationSec: params.speechDurationSec || 0,
      transcriptLength: params.transcriptLength || 0,
      inputTokens,
      outputTokens,
      thinkingTokens,
      cachedTokens,
      totalTokens,
      latencyMs: params.latencyMs || 0,
      estimatedCostInr: costInr,
      status: params.status || "SUCCESS",
      errorMessage: params.errorMessage
    });

  } catch (error) {
    console.error("[AI Log Service] Failed to record AI log:", error);
  }
}
