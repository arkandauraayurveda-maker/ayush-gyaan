import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectToDatabase();
    const courses = await Course.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, courses }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await connectToDatabase();
    const newCourse = new Course(data);
    await newCourse.save();
    return NextResponse.json({ success: true, message: "Course Created!", course: newCourse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { _id, ...updateData } = data;
    await connectToDatabase();
    const updatedCourse = await Course.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Course Updated!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await connectToDatabase();
    await Course.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Course Deleted!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}