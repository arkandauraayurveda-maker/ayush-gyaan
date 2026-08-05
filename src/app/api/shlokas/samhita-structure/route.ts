import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

// 🧠 DEFAULT FALLBACK STRUCTURE (If DB is empty initially)
const DEFAULT_SAMHITA_STRUCTURE: Record<string, Record<string, number[]>> = {
  "Charak Samhita": {
    "Sutra Sthana": Array.from({ length: 30 }, (_, i) => i + 1),
    "Nidan Sthana": Array.from({ length: 8 }, (_, i) => i + 1),
    "Viman Sthana": Array.from({ length: 8 }, (_, i) => i + 1),
    "Sharir Sthana": Array.from({ length: 8 }, (_, i) => i + 1),
    "Indriya Sthana": Array.from({ length: 12 }, (_, i) => i + 1),
    "Chikitsa Sthana": Array.from({ length: 30 }, (_, i) => i + 1),
    "Kalpa Sthana": Array.from({ length: 12 }, (_, i) => i + 1),
    "Siddhi Sthana": Array.from({ length: 12 }, (_, i) => i + 1)
  },
  "Sushruta Samhita": {
    "Sutra Sthana": Array.from({ length: 46 }, (_, i) => i + 1),
    "Nidan Sthana": Array.from({ length: 16 }, (_, i) => i + 1),
    "Sharir Sthana": Array.from({ length: 10 }, (_, i) => i + 1),
    "Chikitsa Sthana": Array.from({ length: 40 }, (_, i) => i + 1),
    "Kalpa Sthana": Array.from({ length: 8 }, (_, i) => i + 1),
    "Uttara Tantra": Array.from({ length: 66 }, (_, i) => i + 1)
  },
  "Ashtanga Hridaya": {
    "Sutra Sthana": Array.from({ length: 30 }, (_, i) => i + 1),
    "Sharir Sthana": Array.from({ length: 6 }, (_, i) => i + 1),
    "Nidan Sthana": Array.from({ length: 16 }, (_, i) => i + 1),
    "Chikitsa Sthana": Array.from({ length: 22 }, (_, i) => i + 1),
    "Kalpa Sthana": Array.from({ length: 6 }, (_, i) => i + 1),
    "Uttara Sthana": Array.from({ length: 40 }, (_, i) => i + 1)
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // 🔍 DYNAMIC AGGREGATION FROM SHLOKA COLLECTION
    const aggregated = await Shloka.aggregate([
      {
        $group: {
          _id: {
            samhitaName: "$samhitaName",
            sthana: "$sthana"
          },
          chapters: { $addToSet: "$chapter" }
        }
      },
      { $sort: { "_id.samhitaName": 1, "_id.sthana": 1 } }
    ]);

    if (!aggregated || aggregated.length === 0) {
      // Return default fallbacks if no shlokas are imported yet
      return NextResponse.json({
        success: true,
        source: "fallback",
        structure: DEFAULT_SAMHITA_STRUCTURE
      });
    }

    // Build dynamic structure map: { [samhitaName]: { [sthana]: [1, 2, 3, ...] } }
    const dynamicStructure: Record<string, Record<string, number[]>> = {};

    aggregated.forEach(item => {
      const samhita = item._id.samhitaName;
      const sthana = item._id.sthana;
      const chaptersList: number[] = (item.chapters || [])
        .filter((ch: any) => typeof ch === "number" && ch > 0)
        .sort((a: number, b: number) => a - b);

      if (!dynamicStructure[samhita]) {
        dynamicStructure[samhita] = {};
      }

      dynamicStructure[samhita][sthana] = chaptersList;
    });

    // Merge default structure for any Samhita not yet populated
    Object.keys(DEFAULT_SAMHITA_STRUCTURE).forEach(samhita => {
      if (!dynamicStructure[samhita]) {
        dynamicStructure[samhita] = DEFAULT_SAMHITA_STRUCTURE[samhita];
      } else {
        Object.keys(DEFAULT_SAMHITA_STRUCTURE[samhita]).forEach(sthana => {
          if (!dynamicStructure[samhita][sthana]) {
            dynamicStructure[samhita][sthana] = DEFAULT_SAMHITA_STRUCTURE[samhita][sthana];
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      source: "database",
      structure: dynamicStructure
    });

  } catch (error: any) {
    console.error("Samhita Structure API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch Samhita structure",
      structure: DEFAULT_SAMHITA_STRUCTURE
    }, { status: 500 });
  }
}
