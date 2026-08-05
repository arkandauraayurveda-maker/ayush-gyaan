import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SystemSettings from "@/models/SystemSettings";
import { verifyAdminAuth } from "@/lib/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    let settings = await SystemSettings.findOne({ settingId: "global_settings" });
    
    // अगर पहली बार ऐप चल रहा है और सेटिंग्स नहीं हैं, तो डिफ़ॉल्ट बना दो
    if (!settings) {
      settings = await SystemSettings.create({ 
        settingId: "global_settings",
        aiModels: { basic: "gemini-1.5-flash-8b", plus: "gemini-1.5-flash", pro: "gemini-1.5-pro" },
        aiLimits: { basic: 10, plus: 100, pro: 9999 },
        aiMultimodalLimits: { basic: 3, plus: 25, pro: 9999 },
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
    const { errorResponse } = await verifyAdminAuth(req);
    if (errorResponse) return errorResponse;

    const { aiModels, aiLimits, aiMultimodalLimits, aiPricing } = await req.json();
    await connectToDatabase();

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      { settingId: "global_settings" },
      { 
        $set: { 
          aiModels, 
          aiLimits, 
          aiMultimodalLimits,
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