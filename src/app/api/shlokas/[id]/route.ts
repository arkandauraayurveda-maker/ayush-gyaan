import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

// ✅ UPDATE / APPROVE Shloka (PUT Method)
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // Next.js 15/16 require params to be a Promise
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Await params specifically for Next.js 16+
    const { id } = await params;
    
   const updatedShloka = await Shloka.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after' } // Updated for Mongoose latest standard
    );

    if (!updatedShloka) {
      return NextResponse.json({ error: "Shloka not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedShloka }, { status: 200 });
  } catch (error: any) {
    console.error("PUT API Error:", error);
    return NextResponse.json({ error: "Failed to update shloka", details: error.message }, { status: 500 });
  }
}

// ✅ DELETE Shloka (DELETE Method)
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Await params specifically for Next.js 16+
    const { id } = await params;

    const deletedShloka = await Shloka.findByIdAndDelete(id);
    
    if (!deletedShloka) {
      return NextResponse.json({ error: "Shloka not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Shloka deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE API Error:", error);
    return NextResponse.json({ error: "Failed to delete shloka", details: error.message }, { status: 500 });
  }
}