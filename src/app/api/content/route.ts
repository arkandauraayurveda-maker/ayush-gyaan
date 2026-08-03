import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import Shloka from "@/models/Shloka";

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Course dhoondo taaki pata chale ye Samhita course hai ya nahi aur iske allowedChapters kya hain
    const course = await Course.findOne({ 
      $or: [
        { courseId: { $regex: new RegExp(`^${courseId}$`, "i") } }, 
        { _id: courseId.match(/^[0-9a-fA-F]{24}$/) ? courseId : null }
      ] 
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // 2. Agar yeh Samhita course nahi hai ya allowedChapters set nahi hain
    if (!course.isSamhitaCourse || !course.allowedChapters || course.allowedChapters.length === 0) {
      return NextResponse.json({ 
        success: true, 
        content: { title: course.title, chapters: [], isSamhita: false } 
      }, { status: 200 });
    }

    // 3. Allowed chapters ke mutabik Shlokas fetch karein
    // allowedChapters format: [{ sthana: "Sutrasthana", chapters: "1-5" } ya "1,2,3"]
    let allShlokas: any[] = [];

    for (const mapping of course.allowedChapters) {
      let chapterNumbers: number[] = [];
      const chapStr = String(mapping.chapters);

      if (chapStr.includes("-")) {
        const [start, end] = chapStr.split("-").map(n => parseInt(n.trim()));
        for (let i = start; i <= end; i++) chapterNumbers.push(i);
      } else {
        chapterNumbers = chapStr.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      }

      const shlokasOfSthana = await Shloka.find({
        sthana: { $regex: new RegExp(`^${mapping.sthana.trim()}$`, "i") },
        chapter: { $in: chapterNumbers },
        status: "APPROVED"
      }).sort({ chapter: 1, shlokaNumber: 1 });

      allShlokas = allShlokas.concat(shlokasOfSthana);
    }

    // 4. Chapters ke hisab se group karein taaki Reader UI bina kisi error ke chale
    const chaptersMap: { [key: string]: any } = {};

    allShlokas.forEach((shloka: any) => {
      const chapterKey = `${shloka.sthana} - Chapter ${shloka.chapter}`;
      if (!chaptersMap[chapterKey]) {
        chaptersMap[chapterKey] = {
          id: `${shloka.sthana}-${shloka.chapter}`,
          title: chapterKey,
          shlokas: []
        };
      }

      // Shloka object mapping to match frontend structure
      chaptersMap[chapterKey].shlokas.push({
        id: shloka._id.toString(),
        shlokaNumber: shloka.shlokaNumber,
        mool_shloka: shloka.originalShloka,
        padchhed: shloka.easyToReadShloka,
        word_meaning: shloka.words ? shloka.words.reduce((acc: any, w: any) => {
          acc[w.text] = w.meaningHindi || w.meaningEnglish;
          return acc;
        }, {}) : {},
        anuwad: shloka.translationHindi,
        vimarsh: shloka.vimarsh
      });
    });

    const formattedContent = {
      title: course.title,
      isSamhita: true,
      chapters: Object.values(chaptersMap)
    };

    return NextResponse.json({ success: true, content: formattedContent }, { status: 200 });

  } catch (error: any) {
    console.error("Content Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}