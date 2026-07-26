import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export async function GET() {
  try {
    await connectToDatabase();
    // Sirf wahi shlokas layenge jinka status PENDING hai, naye wale pehle aayenge
    const pendingShlokas = await Shloka.find({ status: "PENDING" }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: pendingShlokas }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch pending shlokas", details: error.message }, { status: 500 });
  }
}