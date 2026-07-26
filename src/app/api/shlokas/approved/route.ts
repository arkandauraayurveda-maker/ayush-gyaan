import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

export async function GET() {
  try {
    await connectToDatabase();
    // Sirf APPROVED shlokas ko layenge (createdAt ke hisab se ascending order me taaki 1, 2, 3 line se aayein)
    const approvedShlokas = await Shloka.find({ status: "APPROVED" }).sort({ createdAt: 1 });
    
    return NextResponse.json({ success: true, data: approvedShlokas }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch approved shlokas", details: error.message }, { status: 500 });
  }
}