/**
 * 🇮🇳 Extensible AI Pricing Engine in INR (₹)
 * Provider-agnostic calculation architecture supporting Google Gemini and future LLM providers.
 */

export interface ModelPricingInr {
  inputPer1M: number;      // Price in ₹ INR per 1,000,000 input tokens
  outputPer1M: number;     // Price in ₹ INR per 1,000,000 output tokens
  cachedInputPer1M?: number;// Price in ₹ INR per 1,000,000 cached input tokens
  thinkingPer1M?: number;  // Price in ₹ INR per 1,000,000 thinking tokens
}

export const DEFAULT_INR_PRICING: Record<string, Record<string, ModelPricingInr>> = {
  google: {
    "gemini-1.5-flash-8b": { inputPer1M: 3.15, outputPer1M: 12.50, cachedInputPer1M: 0.78 },
    "gemini-1.5-flash": { inputPer1M: 6.25, outputPer1M: 25.00, cachedInputPer1M: 1.56 },
    "gemini-1.5-pro": { inputPer1M: 104.00, outputPer1M: 417.00, cachedInputPer1M: 26.00 },
    "gemini-2.0-flash": { inputPer1M: 8.35, outputPer1M: 33.40, cachedInputPer1M: 2.08 },
    "gemini-2.0-flash-lite": { inputPer1M: 6.25, outputPer1M: 25.00, cachedInputPer1M: 1.56 }
  }
};

/**
 * Computes exact AI Request cost in ₹ INR based on token usage and dynamic pricing rules.
 */
export function calculateAICostInr(
  provider: string = "google",
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0,
  thinkingTokens: number = 0,
  customPricingMap?: Record<string, ModelPricingInr>
): number {
  const providerKey = (provider || "google").toLowerCase();
  
  // Try custom Admin pricing map first, fallback to DEFAULT_INR_PRICING
  let pricing: ModelPricingInr | undefined;
  if (customPricingMap && customPricingMap[modelName]) {
    pricing = customPricingMap[modelName];
  } else {
    const providerPricing = DEFAULT_INR_PRICING[providerKey] || DEFAULT_INR_PRICING["google"];
    pricing = providerPricing[modelName] || providerPricing["gemini-1.5-flash"];
  }

  const inputPrice = pricing?.inputPer1M ?? 6.25;
  const outputPrice = pricing?.outputPer1M ?? 25.00;
  const cachedPrice = pricing?.cachedInputPer1M ?? (inputPrice * 0.25);
  const thinkingPrice = pricing?.thinkingPer1M ?? outputPrice;

  const regularInputTokens = Math.max(0, inputTokens - cachedTokens);

  const inputCost = (regularInputTokens / 1_000_000) * inputPrice;
  const cachedCost = (cachedTokens / 1_000_000) * cachedPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  const thinkingCost = (thinkingTokens / 1_000_000) * thinkingPrice;

  const totalCostInr = inputCost + cachedCost + outputCost + thinkingCost;
  return parseFloat(totalCostInr.toFixed(6));
}
