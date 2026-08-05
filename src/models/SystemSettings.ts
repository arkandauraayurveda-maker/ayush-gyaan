import mongoose, { Schema, Document, models } from "mongoose";

// 🔥 TypeScript Interface for better Type Safety
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
    basic: number;
    plus: number;
    pro: number;
  };
  maintenanceMode: boolean;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  // हम एक ही डॉक्युमेंट रखेंगे, इसलिए एक ID फिक्स कर देंगे
  settingId: { type: String, default: "global_settings", unique: true },
  
  // 🧠 AI Models for each tier
  aiModels: {
    basic: { type: String, default: "gemini-1.5-flash-8b" },
    plus: { type: String, default: "gemini-1.5-flash" },
    pro: { type: String, default: "gemini-1.5-pro" }
  },

  // 📉 Daily Text Query Limits for each tier
  aiLimits: {
    basic: { type: Schema.Types.Mixed, default: 10 },    // Free Users
    plus: { type: Schema.Types.Mixed, default: 100 },    // Plus Users
    pro: { type: Schema.Types.Mixed, default: 9999 }     // Pro Users (Unlimited)
  },

  // 📸 Daily Multimodal (Image/Voice) Limits for each tier
  aiMultimodalLimits: {
    basic: { type: Number, default: 3 },
    plus: { type: Number, default: 25 },
    pro: { type: Number, default: 9999 }
  },

  // 💰 Pricing for Upgrades in INR (Admin Controlled)
  aiPricing: {
    basic: { type: Number, default: 0 },     // Free
    plus: { type: Number, default: 199 },    // Plus Plan Price
    pro: { type: Number, default: 499 }      // Pro Plan Price
  },
  
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export default models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);