import { NextResponse } from "next/server";

export async function GET() {
  // अभी के लिए हम खाली Array भेज रहे हैं ताकि 404 एरर न आए। 
  // बाद में हम इसे असली स्टूडेंट्स के डेटाबेस से जोड़ेंगे।
  return NextResponse.json({ success: true, data: [] }, { status: 200 });
}