import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const samhita = searchParams.get("samhita");
    const sthana = searchParams.get("sthana");
    const chapter = searchParams.get("chapter");

    if (!samhita || !sthana || !chapter) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await connectToDatabase();

    // 🚀 THE FIX: Sort by insertion time (_id or createdAt) descending, NOT by shlokaNumber string.
    // This guarantees we get the absolute latest extracted visual block.
    const lastExtracted = await Shloka.findOne({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter)
    })
    .sort({ _id: -1 }) // -1 means descending (newest first)
    .select("shlokaNumber");

    return NextResponse.json({ 
      success: true, 
      lastShloka: lastExtracted ? lastExtracted.shlokaNumber : null 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Last Extracted API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/*import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const samhita = searchParams.get("samhita");
    const sthana = searchParams.get("sthana");
    const chapter = searchParams.get("chapter");

    if (!samhita || !sthana || !chapter) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await connectToDatabase();

    // Is chapter ka sabse latest add kiya hua shloka dhundho
    const latestShloka = await Shloka.findOne({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter)
    }).sort({ createdAt: -1 }); // createdAt: -1 matlab sabse naya sabse pehle

    return NextResponse.json({ 
      success: true, 
      lastShloka: latestShloka ? latestShloka.shlokaNumber : "" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Last Extracted API Error:", error);
    return NextResponse.json({ error: "Failed to fetch last shloka" }, { status: 500 });
  }
}*/