import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import EarlyBird from "@/models/EarlyBird";

export async function POST(req: NextRequest) {
  try {
    const { name, mobile, subject } = await req.json();
    await connectToDatabase();
    const newLead = new EarlyBird({ name, mobile, subject });
    await newLead.save();
    return NextResponse.json({ success: true, message: "Registered!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const leads = await EarlyBird.find().sort({ registeredAt: -1 });
    return NextResponse.json({ success: true, leads }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}