import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

// 1. GET ALL COUPONS (Admin view)
export async function GET() {
  try {
    await connectToDatabase();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, coupons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. CREATE NEW COUPON
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await connectToDatabase();
    
    // Code ko uppercase me convert karna
    if (data.code) {
      data.code = data.code.toUpperCase().trim();
    }

    const newCoupon = new Coupon(data);
    await newCoupon.save();
    
    return NextResponse.json({ success: true, message: "Coupon Created Successfully!", coupon: newCoupon }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Coupon code already exists!" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. UPDATE / EDIT COUPON (Active/Inactive toggle or edit details)
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    
    await connectToDatabase();
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Coupon Updated Successfully!", coupon: updatedCoupon }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE COUPON
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await connectToDatabase();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Coupon Deleted Successfully!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}