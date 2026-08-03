import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Lead from "@/models/Lead";

export const dynamic = "force-dynamic"; // Taki hamesha fresh data aaye

export async function GET() {
  try {
    await connectToDatabase();
    // Nayi leads sabse upar dikhengi (Descending order)
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, leads }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}