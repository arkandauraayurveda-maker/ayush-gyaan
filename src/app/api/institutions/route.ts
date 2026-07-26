import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Institution from "@/models/Institution";

// 1. GET ALL INSTITUTIONS
export async function GET() {
  try {
    await connectToDatabase();
    // Database se hi A to Z sort karke bhejenge
    const institutions = await Institution.find().sort({ university: 1 });
    return NextResponse.json({ success: true, data: institutions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. CREATE NEW UNIVERSITIES (BULK OR SINGLE)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await connectToDatabase();

    // 🔥 NEW: Check if Admin sent an Array of universities (Bulk Add)
    if (Array.isArray(data)) {
      const added = [];
      for (const item of data) {
        try {
          const newInst = new Institution(item);
          await newInst.save();
          added.push(newInst);
        } catch (err: any) {
          // Ignore duplicates (Code 11000) and continue saving the rest
          if (err.code !== 11000) console.error("Error saving uni:", err);
        }
      }
      return NextResponse.json({ success: true, message: "Universities processed!", added }, { status: 201 });
    }

    // Normal Single Add
    const newInst = new Institution(data);
    await newInst.save();
    return NextResponse.json({ success: true, message: "Institution added!", data: newInst }, { status: 201 });

  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: "University already exists!" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. UPDATE UNIVERSITY & COLLEGES
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    await connectToDatabase();
    const updated = await Institution.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Institution updated!", data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE UNIVERSITY
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await connectToDatabase();
    await Institution.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Institution deleted!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}