import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/authMiddleware";
import connectToDatabase from "@/lib/mongodb";
import AIRequestLog from "@/models/AIRequestLog";
import SystemSettings from "@/models/SystemSettings";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const ALL_AYUSH_FEATURES = [
  "Chat", "Ask AI", "MCQ Generator", "Notes Generator", 
  "Quiz", "Flashcards", "Case Discussion", "Image Analysis", 
  "Voice Chat", "PDF Chat", "RAG Search", "Summary", "Translation"
];

/**
 * 🔒 GET: Fetch AyushGyaan AI Analytics & Cost Intelligence Metrics
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminAuth(req, "AI_CHAT_LOGS");
    if (errorResponse) return errorResponse;

    await connectToDatabase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.valueOf() - 86400000);
    const startOfLast7Days = new Date(startOfToday.valueOf() - 6 * 86400000);
    const startOfMonthly = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch System Budget Settings
    const settings = await SystemSettings.findOne({ settingId: "global_settings" }).lean();
    const budgetSettings = settings?.aiBudgetSettings || {
      dailyBudgetInr: 500,
      monthlyBudgetInr: 10000,
      maxTokensPerUserPerDay: 50000,
      maxRequestsPerUserPerDay: 100,
      disabledFeatures: []
    };
    const modelTokenPricing = settings?.modelTokenPricingInr || {};

    // 💰 1. OVERVIEW COST AGGREGATION PIPELINE
    const costAgg = await AIRequestLog.aggregate([
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, cost: { $sum: "$estimatedCostInr" }, reqs: { $sum: 1 }, tokens: { $sum: "$totalTokens" } } }
          ],
          yesterday: [
            { $match: { createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
            { $group: { _id: null, cost: { $sum: "$estimatedCostInr" } } }
          ],
          last7Days: [
            { $match: { createdAt: { $gte: startOfLast7Days } } },
            { $group: { _id: null, cost: { $sum: "$estimatedCostInr" } } }
          ],
          monthly: [
            { $match: { createdAt: { $gte: startOfMonthly } } },
            { $group: { _id: null, cost: { $sum: "$estimatedCostInr" } } }
          ],
          lifetime: [
            { $group: { 
                _id: null, 
                cost: { $sum: "$estimatedCostInr" }, 
                reqs: { $sum: 1 }, 
                tokens: { $sum: "$totalTokens" },
                users: { $addToSet: "$userId" },
                avgLatency: { $avg: "$latencyMs" },
                errors: { $sum: { $cond: [{ $eq: ["$status", "ERROR"] }, 1, 0] } }
              } 
            }
          ]
        }
      }
    ]);

    const facet = costAgg[0] || {};
    const todayCost = facet.today?.[0]?.cost || 0;
    const todayReqs = facet.today?.[0]?.reqs || 0;
    const todayTokens = facet.today?.[0]?.tokens || 0;
    const yesterdayCost = facet.yesterday?.[0]?.cost || 0;
    const last7DaysCost = facet.last7Days?.[0]?.cost || 0;
    const monthlyCost = facet.monthly?.[0]?.cost || 0;
    const lifetimeCost = facet.lifetime?.[0]?.cost || 0;
    const totalLifetimeReqs = facet.lifetime?.[0]?.reqs || 0;
    const totalLifetimeTokens = facet.lifetime?.[0]?.tokens || 0;
    const totalUniqueUsers = facet.lifetime?.[0]?.users?.length || 1;
    const avgLatencyMs = Math.round(facet.lifetime?.[0]?.avgLatency || 0);
    const totalErrorCount = facet.lifetime?.[0]?.errors || 0;

    const avgCostPerRequest = totalLifetimeReqs > 0 ? parseFloat((lifetimeCost / totalLifetimeReqs).toFixed(4)) : 0;
    const avgCostPerUser = totalUniqueUsers > 0 ? parseFloat((lifetimeCost / totalUniqueUsers).toFixed(2)) : 0;

    // 📊 2. FEATURE COST MATRIX AGGREGATION (All 13 AyushGyaan Features)
    const featureAgg = await AIRequestLog.aggregate([
      {
        $group: {
          _id: "$featureName",
          requests: { $sum: 1 },
          totalTokens: { $sum: "$totalTokens" },
          totalCostInr: { $sum: "$estimatedCostInr" },
          avgLatencyMs: { $avg: "$latencyMs" }
        }
      }
    ]);

    const featureMap = new Map();
    featureAgg.forEach(f => featureMap.set(f._id, f));

    const featureCostMatrix = ALL_AYUSH_FEATURES.map(fName => {
      const data = featureMap.get(fName) || { requests: 0, totalTokens: 0, totalCostInr: 0, avgLatencyMs: 0 };
      return {
        featureName: fName,
        requests: data.requests,
        totalTokens: data.totalTokens,
        totalCostInr: parseFloat((data.totalCostInr || 0).toFixed(4)),
        avgCostInr: data.requests > 0 ? parseFloat((data.totalCostInr / data.requests).toFixed(4)) : 0,
        avgLatencyMs: Math.round(data.avgLatencyMs || 0)
      };
    });

    // 👑 3. MOST EXPENSIVE USERS LEADERBOARD
    const topUsersAgg = await AIRequestLog.aggregate([
      {
        $group: {
          _id: "$userId",
          totalCostInr: { $sum: "$estimatedCostInr" },
          totalTokens: { $sum: "$totalTokens" },
          requests: { $sum: 1 }
        }
      },
      { $sort: { totalCostInr: -1 } },
      { $limit: 10 }
    ]);

    // Populate User Details
    const userUids = topUsersAgg.map(u => u._id);
    const userDocs = await User.find({ uid: { $in: userUids } }).select("uid name email aiPlan").lean();
    const userDocMap = new Map();
    userDocs.forEach(ud => userDocMap.set(ud.uid, ud));

    const mostExpensiveUsers = topUsersAgg.map(u => {
      const ud = userDocMap.get(u._id);
      return {
        userId: u._id,
        name: ud?.name || "Student User",
        email: ud?.email || u._id,
        tier: ud?.aiPlan?.tier || "basic",
        requests: u.requests,
        totalTokens: u.totalTokens,
        totalCostInr: parseFloat((u.totalCostInr || 0).toFixed(2))
      };
    });

    // 🎤 4. INPUT TYPE BREAKDOWN (TEXT, IMAGE, VOICE)
    const inputTypeAgg = await AIRequestLog.aggregate([
      {
        $group: {
          _id: "$inputType",
          requests: { $sum: 1 },
          totalCostInr: { $sum: "$estimatedCostInr" },
          totalSpeechSec: { $sum: "$speechDurationSec" }
        }
      }
    ]);

    const inputTypeBreakdown = {
      TEXT: { requests: 0, costInr: 0 },
      IMAGE: { requests: 0, costInr: 0 },
      VOICE: { requests: 0, costInr: 0, speechSec: 0 }
    };

    inputTypeAgg.forEach(item => {
      const key = item._id as keyof typeof inputTypeBreakdown;
      if (key && inputTypeBreakdown[key]) {
        inputTypeBreakdown[key].requests = item.requests;
        inputTypeBreakdown[key].costInr = parseFloat((item.totalCostInr || 0).toFixed(2));
        if (key === "VOICE") {
          inputTypeBreakdown.VOICE.speechSec = item.totalSpeechSec || 0;
        }
      }
    });

    // 🤖 5. MODEL USAGE BREAKDOWN
    const modelAgg = await AIRequestLog.aggregate([
      {
        $group: {
          _id: "$modelName",
          requests: { $sum: 1 },
          totalCostInr: { $sum: "$estimatedCostInr" }
        }
      },
      { $sort: { requests: -1 } }
    ]);

    const modelUsage = modelAgg.map(m => ({
      modelName: m._id || "gemini-1.5-flash",
      requests: m.requests,
      costInr: parseFloat((m.totalCostInr || 0).toFixed(2))
    }));

    // 📈 6. 14-DAY DAILY TREND
    const fourteenDaysAgo = new Date(startOfToday.valueOf() - 13 * 86400000);
    const trendAgg = await AIRequestLog.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          totalTokens: { $sum: "$totalTokens" },
          costInr: { $sum: "$estimatedCostInr" },
          requests: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 🔔 7. EVALUATE SMART ALERTS
    const alerts = [];
    if (todayCost > budgetSettings.dailyBudgetInr) {
      alerts.push({ type: "BUDGET_EXCEEDED", message: `Daily AI cost (₹${todayCost.toFixed(2)}) has exceeded the daily limit of ₹${budgetSettings.dailyBudgetInr}` });
    }
    if (totalLifetimeReqs > 20 && (totalErrorCount / totalLifetimeReqs) > 0.05) {
      alerts.push({ type: "ERROR_RATE_HIGH", message: `AI Error rate is high (${((totalErrorCount/totalLifetimeReqs)*100).toFixed(1)}%)` });
    }
    if (avgLatencyMs > 4000) {
      alerts.push({ type: "LATENCY_HIGH", message: `Average response latency is elevated (${avgLatencyMs}ms)` });
    }

    return NextResponse.json({
      success: true,
      overview: {
        todayCost: parseFloat(todayCost.toFixed(2)),
        todayReqs,
        todayTokens,
        yesterdayCost: parseFloat(yesterdayCost.toFixed(2)),
        last7DaysCost: parseFloat(last7DaysCost.toFixed(2)),
        monthlyCost: parseFloat(monthlyCost.toFixed(2)),
        lifetimeCost: parseFloat(lifetimeCost.toFixed(2)),
        totalLifetimeReqs,
        totalLifetimeTokens,
        totalUniqueUsers,
        avgCostPerRequest,
        avgCostPerUser,
        avgLatencyMs
      },
      featureCostMatrix,
      mostExpensiveUsers,
      inputTypeBreakdown,
      modelUsage,
      dailyTrend: trendAgg,
      budgetSettings,
      modelTokenPricing,
      alerts
    });

  } catch (error: any) {
    console.error("AI Analytics Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 🔒 POST: Update AyushGyaan AI Budget Controls & Dynamic INR Token Pricing
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminAuth(req, "AI_CHAT_LOGS");
    if (errorResponse) return errorResponse;

    const { aiBudgetSettings, modelTokenPricingInr } = await req.json();

    await connectToDatabase();

    const updated = await SystemSettings.findOneAndUpdate(
      { settingId: "global_settings" },
      { 
        $set: { 
          ...(aiBudgetSettings ? { aiBudgetSettings } : {}),
          ...(modelTokenPricingInr ? { modelTokenPricingInr } : {})
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "AI Budget controls & pricing updated successfully!",
      budgetSettings: updated.aiBudgetSettings,
      modelTokenPricing: updated.modelTokenPricingInr
    });

  } catch (error: any) {
    console.error("AI Analytics Budget Save Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
