import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectToDatabase();
    // Admin के लिए सारे कोर्सेस (Active/Inactive)
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, courses }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Courses Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      courseId, title, prof, status, price, 
      priceBasic, pricePlus, pricePro, 
      originalPrice, discountText, badge, startDate, couponCode, 
      duration, syllabus, highlight, isActive,
      isSamhitaCourse, allowedChapters,
      aiSettings 
    } = data;

    await connectToDatabase();
    
    const newCourse = new Course({
      courseId, title, prof, status, price, 
      priceBasic, pricePlus, pricePro, 
      originalPrice, discountText, badge, startDate, couponCode, 
      duration, syllabus, highlight, isActive,
      isSamhitaCourse, allowedChapters,
      aiSettings
    });

    await newCourse.save();
    return NextResponse.json({ success: true, message: "Course Created!", course: newCourse }, { status: 201 });
  } catch (error: any) {
    console.error("Create Course Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data; 
    
    await connectToDatabase();
    
    const updatedCourse = await Course.findByIdAndUpdate(
      _id, 
      { $set: updateData }, 
      { new: true, runValidators: true } 
    );

    if (!updatedCourse) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Course Updated!" }, { status: 200 });
  } catch (error: any) {
    console.error("Update Course Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Course ID is required" }, { status: 400 });

    await connectToDatabase();
    await Course.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true, message: "Course Deleted!" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete Course Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}