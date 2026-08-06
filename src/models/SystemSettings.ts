import mongoose, { Schema, Document, models } from "mongoose";

export interface IPlanPricing {
  monthly: number;
  yearly: number;
  offerTag?: string;
}

export interface IModelTokenPricingInr {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
}

export interface IAIBudgetSettings {
  dailyBudgetInr: number;
  monthlyBudgetInr: number;
  maxTokensPerUserPerDay: number;
  maxRequestsPerUserPerDay: number;
  disabledFeatures: string[];
}

export interface ISystemSettings extends Document {
  settingId: string;
  aiModels: {
    basic: string;
    plus: string;
    pro: string;
  };
  aiLimits: {
    basic: number | { text: number; multimodal: number };
    plus: number | { text: number; multimodal: number };
    pro: number | { text: number; multimodal: number };
  };
  aiMultimodalLimits?: {
    basic: number;
    plus: number;
    pro: number;
  };
  aiPricing: {
    basic: number | IPlanPricing;
    plus: number | IPlanPricing;
    pro: number | IPlanPricing;
  };
  modelTokenPricingInr?: Record<string, IModelTokenPricingInr>;
  aiBudgetSettings?: IAIBudgetSettings;
  maintenanceMode: boolean;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  settingId: { type: String, default: "global_settings", unique: true },
  
  aiModels: {
    basic: { type: String, default: "gemini-1.5-flash-8b" },
    plus: { type: String, default: "gemini-1.5-flash" },
    pro: { type: String, default: "gemini-1.5-pro" }
  },

  aiLimits: {
    basic: { type: Schema.Types.Mixed, default: 10 },
    plus: { type: Schema.Types.Mixed, default: 100 },
    pro: { type: Schema.Types.Mixed, default: 9999 }
  },

  aiMultimodalLimits: {
    basic: { type: Number, default: 3 },
    plus: { type: Number, default: 25 },
    pro: { type: Number, default: 9999 }
  },

  aiPricing: {
    basic: { type: Schema.Types.Mixed, default: { monthly: 0, yearly: 0, offerTag: "Free Forever" } },
    plus: { type: Schema.Types.Mixed, default: { monthly: 199, yearly: 1999, offerTag: "Save 16%" } },
    pro: { type: Schema.Types.Mixed, default: { monthly: 499, yearly: 4999, offerTag: "Save 17%" } }
  },

  // 🇮🇳 Dynamic INR Token Pricing per Model
  modelTokenPricingInr: {
    type: Schema.Types.Mixed,
    default: {
      "gemini-1.5-flash-8b": { inputPer1M: 3.15, outputPer1M: 12.50, cachedInputPer1M: 0.78 },
      "gemini-1.5-flash": { inputPer1M: 6.25, outputPer1M: 25.00, cachedInputPer1M: 1.56 },
      "gemini-1.5-pro": { inputPer1M: 104.00, outputPer1M: 417.00, cachedInputPer1M: 26.00 },
      "gemini-2.0-flash": { inputPer1M: 8.35, outputPer1M: 33.40, cachedInputPer1M: 2.08 }
    }
  },

  // 📊 Smart Budget Settings in ₹ INR
  aiBudgetSettings: {
    type: Schema.Types.Mixed,
    default: {
      dailyBudgetInr: 500,
      monthlyBudgetInr: 10000,
      maxTokensPerUserPerDay: 50000,
      maxRequestsPerUserPerDay: 100,
      disabledFeatures: []
    }
  },
  
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export default models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);