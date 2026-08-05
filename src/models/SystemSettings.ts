import mongoose, { Schema, Document, models } from "mongoose";

export interface IPlanPricing {
  monthly: number;
  yearly: number;
  offerTag?: string;
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

  // 💰 Billing Options (Monthly, Yearly & Offer Badge)
  aiPricing: {
    basic: { type: Schema.Types.Mixed, default: { monthly: 0, yearly: 0, offerTag: "Free Forever" } },
    plus: { type: Schema.Types.Mixed, default: { monthly: 199, yearly: 1999, offerTag: "Save 16%" } },
    pro: { type: Schema.Types.Mixed, default: { monthly: 499, yearly: 4999, offerTag: "Save 17%" } }
  },
  
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export default models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);