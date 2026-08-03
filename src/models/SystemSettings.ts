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
    basic: { type: String, default: "gemini-3.5-flash-lite" },
    plus: { type: String, default: "gemini-3.5-flash" },
    pro: { type: String, default: "gemini-3.6-flash" } // 🔥 FIXED TYPO HERE
  },

  // 📉 Daily Token Limits for each tier (Admin Controlled)
  aiLimits: {
    basic: { type: Number, default: 10 },    // Free Users
    plus: { type: Number, default: 100 },    // Plus Users
    pro: { type: Number, default: 9999 }     // Pro Users (Unlimited)
  },

  // 💰 Pricing for Upgrades in INR (Admin Controlled)
  aiPricing: {
    basic: { type: Number, default: 0 },     // Free
    plus: { type: Number, default: 199 },    // Plus Plan Price
    pro: { type: Number, default: 499 }      // Pro Plan Price
  },
  
  maintenanceMode: { type: Boolean, default: false } // भविष्य के लिए
}, { timestamps: true });

export default models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);