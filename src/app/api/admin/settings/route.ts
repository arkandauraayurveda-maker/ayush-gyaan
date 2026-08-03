import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SystemSettings from "@/models/SystemSettings";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    let settings = await SystemSettings.findOne({ settingId: "global_settings" });
    
    // अगर पहली बार ऐप चल रहा है और सेटिंग्स नहीं हैं, तो डिफ़ॉल्ट बना दो (तीनों चीज़ों के साथ)
    if (!settings) {
      settings = await SystemSettings.create({ 
        settingId: "global_settings",
        aiModels: { basic: "gemini-3.1-flash-lite", plus: "gemini-3.5-flash-lite", pro: "gemini-3.6-flash" },
        aiLimits: { basic: 10, plus: 100, pro: 9999 },
        aiPricing: { basic: 0, plus: 199, pro: 499 }
      });
    }
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔥 अब हम frontend से तीनों ऑब्जेक्ट रिसीव करेंगे
    const { aiModels, aiLimits, aiPricing } = await req.json();
    await connectToDatabase();

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      { settingId: "global_settings" },
      { 
        $set: { 
          aiModels, 
          aiLimits, 
          aiPricing 
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}