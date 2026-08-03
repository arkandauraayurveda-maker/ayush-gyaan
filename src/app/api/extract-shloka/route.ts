import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is missing.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_FALLBACK_LIST = [
  "gemini-3.6-flash",
  "gemini-3.5-flash", 
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// Turn off Safety Filters to prevent RECITATION & Content blocks across models
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function generateWithFallback(systemPrompt: string, pdfPart: any) {
  let lastError;
  // Har ek nayi request (file/section extraction) ke liye fresh local copy banegi, 
  // jisse har request ki shuruwat me saare models original order me dobara try honge.
  let activeModels = [...MODEL_FALLBACK_LIST];

  for (const modelName of activeModels) {
    try {
      console.log(`[AyushGyaan Engine] Try model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        safetySettings,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      });

      const result = await model.generateContent([systemPrompt, pdfPart]);
      return result.response.text();
    } catch (error: any) {
      console.error(`[AyushGyaan Engine] Model ${modelName} failed:`, error.message);
      lastError = error;
      // Kisi bhi error (jaise 429, 404, 503, ya RECITATION filter) par 
      // yeh model is request ke liye skip ho jayega aur agla model try hoga.
      // Jab agli nayi request aayegi, toh MODEL_FALLBACK_LIST fir se fresh use hogi.
      continue;
    }
  }
  throw new Error(`Extraction failed across all models. Last error: ${lastError?.message}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, samhita, sthana, chapter, lastExtractedShloka } = body;

    if (!pdfBase64 || !samhita || !chapter) {
      return NextResponse.json({ error: "Required fields or PDF missing." }, { status: 400 });
    }

    await connectToDatabase();

    const pdfPart = {
      inlineData: { data: pdfBase64, mimeType: "application/pdf" },
    };

    // 🔥 PROMPT UPDATED HERE WITH YOUR STRICT NUMBERING RULES (3F, 4E, 52a) 🔥
    const systemPrompt = `
You are NOT a chatbot. You are an AI Knowledge Extraction Engine, great knowlege of authentic deep ayurvedic taxt (charak samhita,shushrut and all others) and ayurvedic sanskritwhose only job is to convert scanned Ayurvedic books into a highly structured knowledge base.
Your highest priority is DATA QUALITY, STRICT VISUAL GROUPING, and ZERO HALLUCINATION.

WHAT IS A "SECTION"? (STRICT VISUAL GROUPING)
The PDF contains images of physical book pages. A "Section" is strictly a visual block on the page containing: 
[Sanskrit Text (one, multiple, or partial shlokas)] + [Its Hindi Translation (Anuwad)] + [Its Commentary (Vimarsh)].
A visual block ends ONLY when the VERY NEXT Sanskrit verse/main shloka (starting with a new numbering or heading) begins. Treat multi-paragraph commentaries as a single continuous unit. 
You must extract this EXACT visual block as ONE single JSON unit. Do not leak into the next section's translation or commentary. Do not break this visual group.

SEPARATING 'SECTIONS' FROM 'SHLOKA NUMBERS' (CRITICAL FOR RAG)
1. "shlokaNumber" String (STRICT NUMBERING RULES): Give a precise label to this block based on its contents.
   - Full Shlokas: Give direct numbers (e.g., "4", "5-6").
   - First Line/Half (Start): If it's the first part of a shloka, append 'F' (e.g., "3F", "4F"). *CRITICAL*: If you extract a section like "shlok1, shlok3, 4F", remember that the next section must contain the ending "4E" or start with "5". Do not break the sequence.
   - End Line/Half (End): If it's the second/ending part, append 'E' (e.g., "3E", "4E").
   - Mixed Sections: If grouped, format like "1, 3, 4F".
   - Half Lines (Ardhaali): If a single shloka line is split, label it "52a" and the next as "52b". Ensure the main number (52) remains correct.
   - Unnumbered: If there is no number, write "Unnumbered".

2. "containedShlokas" Array: Accurately identify which MAIN shloka numbers are physically present (fully or partially). Output as an array of strings.
   - Example A: If shlokaNumber is "3F-6", return ["3", "4", "5", "6"].
   - Example B: If shlokaNumber is "52a" or "52b", return ["52"].
   - Example C: If shlokaNumber is "1, 3, 4F", return ["1", "3", "4"].

ANTI-HALLUCINATION WARNING (CRITICAL)
If a shloka is cut in half at the end of the visual block, DO NOT use your external knowledge or internet to complete it. Extract ONLY the exact half-lines visible in this specific visual block. 

RESUME & LOOK-AHEAD LOGIC
- We have already saved up to visual block name: '${lastExtractedShloka || 'None'}' in our database for this chapter.
- Locate where the translation/vimarsh for that block ends in the PDF. 
- Start extracting strictly from the VERY NEXT visual block.
- Extract exactly ONE new complete visual block per request.
- STRICT CONTINUITY: DO NOT SKIP any shlokas or sections. For example, if the last extracted block was shloka ||6|| or a half 6, the very next block you process MUST be the remaining half of 6 or shloka ||7||. Do not jump ahead.
- If no next section exists, return "shlokaNumber":"COMPLETED" and leave all remaining fields empty.

SOURCE OF TRUTH & OCR
- The uploaded PDF (${samhita}, ${sthana}, Chapter ${chapter}) is the ONLY source of truth.
- Correct only: Sanskrit spelling, Matra, Halant, Sandhi mistakes caused by OCR. Missing punctuation.

TRANSLATION & VIMARSH
- Simplify the grammar and sentence structure, but STRICTLY RETAIN all original technical Ayurvedic terminology (e.g., Anubandha Chatushtaya, Sthana definitions). Explain complex terms like a top university professor, using structured formats like bullet points for easier memorization.
- Rewrite into simple modern Hindi. Keep every important point.
- Rewrite Vimarsh to be clean and structured. 
- vimarsh may consist of multiple paragraphs. or may be absent. If absent, return empty string "".
- vimarsh may include charts, tables,or structured information. if present, instead of reproducing them as raw table, convert them into clear,well-organised bullet points or numbered lists that are easy to understand and memorize, while preserving all original information.
- EMBEDDED SANSKRIT QUOTES: If any Sanskrit shloka or text quote appears inside the Hindi Translation (Anuwad) or Vimarsh, keep it exactly there. Immediately in the next line, provide its simple Hindi translation enclosed in double quotes ("...").
- Break long paragraphs using double line breaks (\\n\\n).

PADACHEDA & ANVAYA
Provide accurate Hindi and English word meanings. Generate proper Sanskrit anvaya without simplifying grammar.

KNOWLEDGE TAGGING (RAG METADATA)
Create lightweight metadata only if EXPLICITLY present. Return empty arrays [] when absent. Never infer or hallucinate.
If a "Tantra Yukti" is explicitly mentioned, extract it into the "tantraYukti" field. Otherwise, leave it empty.

JSON OUTPUT
Always return valid JSON. Never wrap inside markdown. Never use \`\`\`json. Return only JSON.

Required JSON Schema:
{
  "shlokaNumber": "String. Strict label (e.g., '3F', '52a', '1, 3, 4F') OR 'COMPLETED'.",
  "containedShlokas": ["Array of Strings. Main numbers only, e.g., ['1', '3', '4']"],
  "originalShloka": "String. Corrected Sanskrit text EXACTLY as seen in this block with \\n",
  "easyToReadShloka": "String. Sandhi-vichhed yukt saral shlok",
  "words": [
    {
      "text": "word1",
      "hasSandhi": true,
      "sandhiComponents": ["part1", "part2"],
      "meaningHindi": "Hindi meaning",
      "meaningEnglish": "English meaning"
    }
  ],
  "anvaya": "String. Logical Sanskrit Syntax",
  "translationHindi": "String. Simple modern Hindi translation with \\n\\n",
  "vimarsh": "String. Rewritten easy commentary with \\n\\n",
  "tantraYukti": "String. Extract only if present, else empty.",
  "metadata": {
    "dosha": ["Array of Strings"],
    "dhatu": ["Array of Strings"],
    "mala": ["Array of Strings"],
    "srotas": ["Array of Strings"],
    "agni": ["Array of Strings"],
    "vyadhi": ["Array of Strings"],
    "lakshana": ["Array of Strings"],
    "nidana": ["Array of Strings"],
    "dravya": ["Array of Strings"],
    "karma": ["Array of Strings"],
    "keywords": ["Array of Strings"]
  }
}
`;

    const aiResponseText = await generateWithFallback(systemPrompt, pdfPart);
    
    let shlokaData;
    try {
      const cleanedText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      shlokaData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Parse Error. Raw Output:", aiResponseText);
      return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
    }

    if (shlokaData.shlokaNumber === "COMPLETED") {
       return NextResponse.json({ success: true, message: "Chapter Completed", data: shlokaData }, { status: 200 });
    }

    // Default missing arrays to empty if AI omits them
    const safeMetadata = {
      dosha: shlokaData.metadata?.dosha || [],
      dhatu: shlokaData.metadata?.dhatu || [],
      mala: shlokaData.metadata?.mala || [],
      srotas: shlokaData.metadata?.srotas || [],
      agent: shlokaData.metadata?.agni || [],
      vyadhi: shlokaData.metadata?.vyadhi || [],
      lakshana: shlokaData.metadata?.lakshana || [],
      nidana: shlokaData.metadata?.nidana || [],
      dravya: shlokaData.metadata?.dravya || [],
      karma: shlokaData.metadata?.karma || [],
      keywords: shlokaData.metadata?.keywords || []
    };

    const newShlokaDraft = new Shloka({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter),
      shlokaNumber: shlokaData.shlokaNumber,
      containedShlokas: shlokaData.containedShlokas || [],
      originalShloka: shlokaData.originalShloka,
      easyToReadShloka: shlokaData.easyToReadShloka,
      words: shlokaData.words,
      anvaya: shlokaData.anvaya,
      translationHindi: shlokaData.translationHindi,
      vimarsh: shlokaData.vimarsh,
      tantraYukti: shlokaData.tantraYukti || "", // 🔥 Saved securely here
      metadata: safeMetadata,
      status: "PENDING"
    });

    await newShlokaDraft.save();

    return NextResponse.json({ 
      success: true, 
      message: `Section ${shlokaData.shlokaNumber} extracted safely.`, 
      data: newShlokaDraft 
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
/*import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is missing.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_FALLBACK_LIST = [
  "gemini-3.6-flash",
  "gemini-3.5-flash", 
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  
];

// Turn off Safety Filters to prevent RECITATION & Content blocks across models
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function generateWithFallback(systemPrompt: string, pdfPart: any) {
  let lastError;
  // Har ek nayi request (file/section extraction) ke liye fresh local copy banegi, 
  // jisse har request ki shuruwat me saare models original order me dobara try honge.
  let activeModels = [...MODEL_FALLBACK_LIST];

  for (const modelName of activeModels) {
    try {
      console.log(`[AyushGyaan Engine] Try model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        safetySettings,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      });

      const result = await model.generateContent([systemPrompt, pdfPart]);
      return result.response.text();
    } catch (error: any) {
      console.error(`[AyushGyaan Engine] Model ${modelName} failed:`, error.message);
      lastError = error;
      // Kisi bhi error (jaise 429, 404, 503, ya RECITATION filter) par 
      // yeh model is request ke liye skip ho jayega aur agla model try hoga.
      // Jab agli nayi request aayegi, toh MODEL_FALLBACK_LIST fir se fresh use hogi.
      continue;
    }
  }
  throw new Error(`Extraction failed across all models. Last error: ${lastError?.message}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, samhita, sthana, chapter, lastExtractedShloka } = body;

    if (!pdfBase64 || !samhita || !chapter) {
      return NextResponse.json({ error: "Required fields or PDF missing." }, { status: 400 });
    }

    await connectToDatabase();

    const pdfPart = {
      inlineData: { data: pdfBase64, mimeType: "application/pdf" },
    };

    const systemPrompt = `
You are NOT a chatbot. You are an AI Knowledge Extraction Engine, great knowlege of authentic deep ayurvedic taxt (charak samhita,shushrut and all others) and ayurvedic sanskritwhose only job is to convert scanned Ayurvedic books into a highly structured knowledge base.
Your highest priority is DATA QUALITY, STRICT VISUAL GROUPING, and ZERO HALLUCINATION.

WHAT IS A "SECTION"? (STRICT VISUAL GROUPING)
The PDF contains images of physical book pages. A "Section" is strictly a visual block on the page containing: 
[Sanskrit Text (one, multiple, or partial shlokas)] + [Its Hindi Translation (Anuwad)] + [Its Commentary (Vimarsh)].
A visual block ends ONLY when the VERY NEXT Sanskrit verse/main shloka (starting with a new numbering or heading) begins. Treat multi-paragraph commentaries as a single continuous unit. 
You must extract this EXACT visual block as ONE single JSON unit. Do not leak into the next section's translation or commentary. Do not break this visual group.

MAIN SHLOKA DETECTION & NUMBERING (CRITICAL)
The main shloka(s) appear at the top of the visual block. Numbering must strictly be taken from the book's printed text (e.g., ||1||). A shloka can be one line or multiple lines.
Pay special attention to SPLIT/HALF SHLOKAS across different sections:
- Case 1: A section has multiple full shlokas and ends with a half shloka (e.g., shlok ||3||, shlok ||4||, and first half of 5 without a number). Infer the unnumbered half's number by looking at the context.
- Case 2: A section contains ONLY a half shloka without numbering (it might end with a hyphen '-').
- Case 3: A section starts with a remaining half shloka (it might start with a hyphen '-') and ends with its actual printed number (e.g., ||7||).

SEPARATING 'SECTIONS' FROM 'SHLOKA NUMBERS' (CRITICAL FOR RAG)
1. Visual Section vs Content: You must separate the concept of a visual section from the actual shloka numbers.
2. "containedShlokas" Array: Accurately identify which shloka numbers (full or partial) are physically present in the current Sanskrit text block. Output them as an array of strings.
   - Example A: If the block contains Shloka 1 and 2, return "containedShlokas": ["1", "2"].
   - Example B: If the block contains Shloka 3, 4, and the first half of Shloka 5, return "containedShlokas": ["3", "4", "5"].
   - Example C: If the NEXT block contains the second half of Shloka 5, Shloka 6, and Shloka 7, return "containedShlokas": ["5", "6", "7"].
3. "shlokaNumber" String: Give a logical title to this block based on its contents (e.g., "1-2", "3-5", "5-7", or "7(half)").

ANTI-HALLUCINATION WARNING (CRITICAL)
If a shloka is cut in half at the end of the visual block, DO NOT use your external knowledge or internet to complete it. Extract ONLY the exact half-lines visible in this specific visual block. 

RESUME & LOOK-AHEAD LOGIC
- We have already saved up to visual block name: '${lastExtractedShloka || 'None'}' in our database for this chapter.
- Locate where the translation/vimarsh for that block ends in the PDF. 
- Start extracting strictly from the VERY NEXT visual block.
- Extract exactly ONE new complete visual block per request.
- STRICT CONTINUITY: DO NOT SKIP any shlokas or sections. For example, if the last extracted block was shloka ||6|| or a half 6, the very next block you process MUST be the remaining half of 6 or shloka ||7||. Do not jump ahead.
- If no next section exists, return "shlokaNumber":"COMPLETED" and leave all remaining fields empty.

SOURCE OF TRUTH & OCR
- The uploaded PDF (${samhita}, ${sthana}, Chapter ${chapter}) is the ONLY source of truth.
- Correct only: Sanskrit spelling, Matra, Halant, Sandhi mistakes caused by OCR. Missing punctuation.

TRANSLATION & VIMARSH
- Simplify the grammar and sentence structure, but STRICTLY RETAIN all original technical Ayurvedic terminology (e.g., Anubandha Chatushtaya, Sthana definitions). Explain complex terms like a top university professor, using structured formats like bullet points for easier memorization.
- Rewrite into simple modern Hindi. Keep every important point.
- Rewrite Vimarsh to be clean and structured. 
- vimarsh may consist of multiple paragraphs. or may be absent. If absent, return empty string "".
- vimarsh may include charts, tables,or structured information. if present, instead of reproducing them as raw table, convert them into clear,well-organised bullet points or numbered lists that are easy to understand and memorize, while preserving all original information.
- EMBEDDED SANSKRIT QUOTES: If any Sanskrit shloka or text quote appears inside the Hindi Translation (Anuwad) or Vimarsh, keep it exactly there. Immediately in the next line, provide its simple Hindi translation enclosed in double quotes ("...").
- Break long paragraphs using double line breaks (\\n\\n).

PADACHEDA & ANVAYA
Provide accurate Hindi and English word meanings. Generate proper Sanskrit anvaya without simplifying grammar.

KNOWLEDGE TAGGING (RAG METADATA)
Create lightweight metadata only if EXPLICITLY present. Return empty arrays [] when absent. Never infer or hallucinate.

JSON OUTPUT
Always return valid JSON. Never wrap inside markdown. Never use \`\`\`json. Return only JSON.

Required JSON Schema:
{
  "shlokaNumber": "String. Label for this block (e.g., '13', '14-15') OR 'COMPLETED'.",
  "containedShlokas": ["Array of Strings. All numbers present fully or partially in this block, e.g., ['14', '15']"],
  "originalShloka": "String. Corrected Sanskrit text EXACTLY as seen in this block with \\n",
  "easyToReadShloka": "String. Sandhi-vichhed yukt saral shlok",
  "words": [
    {
      "text": "word1",
      "hasSandhi": true,
      "sandhiComponents": ["part1", "part2"],
      "meaningHindi": "Hindi meaning",
      "meaningEnglish": "English meaning"
    }
  ],
  "anvaya": "String. Logical Sanskrit Syntax",
  "translationHindi": "String. Simple modern Hindi translation with \\n\\n",
  "vimarsh": "String. Rewritten easy commentary with \\n\\n",
  "metadata": {
    "dosha": ["Array of Strings"],
    "dhatu": ["Array of Strings"],
    "mala": ["Array of Strings"],
    "srotas": ["Array of Strings"],
    "agni": ["Array of Strings"],
    "vyadhi": ["Array of Strings"],
    "lakshana": ["Array of Strings"],
    "nidana": ["Array of Strings"],
    "dravya": ["Array of Strings"],
    "karma": ["Array of Strings"],
    "keywords": ["Array of Strings"]
  }
}
`;

    const aiResponseText = await generateWithFallback(systemPrompt, pdfPart);
    
    let shlokaData;
    try {
      const cleanedText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      shlokaData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Parse Error. Raw Output:", aiResponseText);
      return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
    }

    if (shlokaData.shlokaNumber === "COMPLETED") {
       return NextResponse.json({ success: true, message: "Chapter Completed", data: shlokaData }, { status: 200 });
    }

    // Default missing arrays to empty if AI omits them
    const safeMetadata = {
      dosha: shlokaData.metadata?.dosha || [],
      dhatu: shlokaData.metadata?.dhatu || [],
      mala: shlokaData.metadata?.mala || [],
      srotas: shlokaData.metadata?.srotas || [],
      agent: shlokaData.metadata?.agni || [],
      vyadhi: shlokaData.metadata?.vyadhi || [],
      lakshana: shlokaData.metadata?.lakshana || [],
      nidana: shlokaData.metadata?.nidana || [],
      dravya: shlokaData.metadata?.dravya || [],
      karma: shlokaData.metadata?.karma || [],
      keywords: shlokaData.metadata?.keywords || []
    };

    const newShlokaDraft = new Shloka({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter),
      shlokaNumber: shlokaData.shlokaNumber,
      containedShlokas: shlokaData.containedShlokas || [],
      originalShloka: shlokaData.originalShloka,
      easyToReadShloka: shlokaData.easyToReadShloka,
      words: shlokaData.words,
      anvaya: shlokaData.anvaya,
      translationHindi: shlokaData.translationHindi,
      vimarsh: shlokaData.vimarsh,
      metadata: safeMetadata,
      status: "PENDING"
    });

    await newShlokaDraft.save();

    return NextResponse.json({ 
      success: true, 
      message: `Section ${shlokaData.shlokaNumber} extracted safely.`, 
      data: newShlokaDraft 
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is missing.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_FALLBACK_LIST = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// Turn off Safety Filters to prevent RECITATION & Content blocks across models
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function generateWithFallback(systemPrompt: string, pdfPart: any) {
  let lastError;
  // Har ek nayi request (file/section extraction) ke liye fresh local copy banegi, 
  // jisse har request ki shuruwat me saare models original order me dobara try honge.
  let activeModels = [...MODEL_FALLBACK_LIST];

  for (const modelName of activeModels) {
    try {
      console.log(`[AyushGyaan Engine] Try model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        safetySettings,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      });

      const result = await model.generateContent([systemPrompt, pdfPart]);
      return result.response.text();
    } catch (error: any) {
      console.error(`[AyushGyaan Engine] Model ${modelName} failed:`, error.message);
      lastError = error;
      // Kisi bhi error (jaise 429, 404, 503, ya RECITATION filter) par 
      // yeh model is request ke liye skip ho jayega aur agla model try hoga.
      // Jab agli nayi request aayegi, toh MODEL_FALLBACK_LIST fir se fresh use hogi.
      continue;
    }
  }
  throw new Error(`Extraction failed across all models. Last error: ${lastError?.message}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, samhita, sthana, chapter, lastExtractedShloka } = body;

    if (!pdfBase64 || !samhita || !chapter) {
      return NextResponse.json({ error: "Required fields or PDF missing." }, { status: 400 });
    }

    await connectToDatabase();

    const pdfPart = {
      inlineData: { data: pdfBase64, mimeType: "application/pdf" },
    };

    const systemPrompt = `
You are NOT a chatbot. You are an AI Knowledge Extraction Engine, great knowlege of authentic deep ayurvedic taxt (charak samhita,shushrut and all others) and ayurvedic sanskritwhose only job is to convert scanned Ayurvedic books into a highly structured knowledge base.
Your highest priority is DATA QUALITY, STRICT VISUAL GROUPING, and ZERO HALLUCINATION.

WHAT IS A "SECTION"? (STRICT VISUAL GROUPING)
The PDF contains images of physical book pages. A "Section" is strictly a visual block on the page containing: 
[Sanskrit Text (one, multiple, or partial shlokas)] + [Its Hindi Translation (Anuwad)] + [Its Commentary (Vimarsh)].
A visual block ends ONLY when the VERY NEXT Sanskrit verse/main shloka (starting with a new numbering or heading) begins. Treat multi-paragraph commentaries as a single continuous unit. 
You must extract this EXACT visual block as ONE single JSON unit. Do not leak into the next section's translation or commentary. Do not break this visual group.

SEPARATING 'SECTIONS' FROM 'SHLOKA NUMBERS' (CRITICAL FOR RAG)
1. Visual Section vs Content: You must separate the concept of a visual section from the actual shloka numbers.
2. "containedShlokas" Array: Accurately identify which shloka numbers (full or partial) are physically present in the current Sanskrit text block. Output them as an array of strings.
   - Example A: If the block contains Shloka 1 and 2, return "containedShlokas": ["1", "2"].
   - Example B: If the block contains Shloka 3, 4, and the first half of Shloka 5, return "containedShlokas": ["3", "4", "5"].
   - Example C: If the NEXT block contains the second half of Shloka 5, Shloka 6, and Shloka 7, return "containedShlokas": ["5", "6", "7"].
3. "shlokaNumber" String: Give a logical title to this block based on its contents (e.g., "1-2", "3-5", "5-7").

ANTI-HALLUCINATION WARNING (CRITICAL)
If a shloka is cut in half at the end of the visual block, DO NOT use your external knowledge or internet to complete it. Extract ONLY the exact half-lines visible in this specific visual block. 

RESUME & LOOK-AHEAD LOGIC
- We have already saved up to visual block name: '${lastExtractedShloka || 'None'}' in our database for this chapter.
- Locate where the translation/vimarsh for that block ends in the PDF. 
- Start extracting strictly from the VERY NEXT visual block.
- Extract exactly ONE new complete visual block per request.
- If no next section exists, return "shlokaNumber":"COMPLETED" and leave all remaining fields empty.

SOURCE OF TRUTH & OCR
- The uploaded PDF (${samhita}, ${sthana}, Chapter ${chapter}) is the ONLY source of truth.
- Correct only: Sanskrit spelling, Matra, Halant, Sandhi mistakes caused by OCR. Missing punctuation.

TRANSLATION & VIMARSH
- Simplify the grammar and sentence structure, but STRICTLY RETAIN all original technical Ayurvedic terminology (e.g., Anubandha Chatushtaya, Sthana definitions). Explain complex terms like a top university professor, using structured formats like bullet points for easier memorization,
- Rewrite into simple modern Hindi. Keep every important point.
- Rewrite Vimarsh to be clean and structured. 
- vimarsh may consist of multiple paragraphs. or may be absent. If absent, return empty string "".
- vimarsh may include charts, tables,or structured information. if present, instead of reproducing them as raw table, convert them into clear,well-organised bullet points or numbered lists that are easy to understand and memorize, while preserving all original information.
- Break long paragraphs using double line breaks (\\n\\n).

PADACHEDA & ANVAYA
Provide accurate Hindi and English word meanings. Generate proper Sanskrit anvaya without simplifying grammar.

KNOWLEDGE TAGGING (RAG METADATA)
Create lightweight metadata only if EXPLICITLY present. Return empty arrays [] when absent. Never infer or hallucinate.

JSON OUTPUT
Always return valid JSON. Never wrap inside markdown. Never use \`\`\`json. Return only JSON.

Required JSON Schema:
{
  "shlokaNumber": "String. Label for this block (e.g., '13', '14-15') OR 'COMPLETED'.",
  "containedShlokas": ["Array of Strings. All numbers present fully or partially in this block, e.g., ['14', '15']"],
  "originalShloka": "String. Corrected Sanskrit text EXACTLY as seen in this block with \\n",
  "easyToReadShloka": "String. Sandhi-vichhed yukt saral shlok",
  "words": [
    {
      "text": "word1",
      "hasSandhi": true,
      "sandhiComponents": ["part1", "part2"],
      "meaningHindi": "Hindi meaning",
      "meaningEnglish": "English meaning"
    }
  ],
  "anvaya": "String. Logical Sanskrit Syntax",
  "translationHindi": "String. Simple modern Hindi translation with \\n\\n",
  "vimarsh": "String. Rewritten easy commentary with \\n\\n",
  "metadata": {
    "dosha": ["Array of Strings"],
    "dhatu": ["Array of Strings"],
    "mala": ["Array of Strings"],
    "srotas": ["Array of Strings"],
    "agni": ["Array of Strings"],
    "vyadhi": ["Array of Strings"],
    "lakshana": ["Array of Strings"],
    "nidana": ["Array of Strings"],
    "dravya": ["Array of Strings"],
    "karma": ["Array of Strings"],
    "keywords": ["Array of Strings"]
  }
}
`;

    const aiResponseText = await generateWithFallback(systemPrompt, pdfPart);
    
    let shlokaData;
    try {
      const cleanedText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      shlokaData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Parse Error. Raw Output:", aiResponseText);
      return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
    }

    if (shlokaData.shlokaNumber === "COMPLETED") {
       return NextResponse.json({ success: true, message: "Chapter Completed", data: shlokaData }, { status: 200 });
    }

    // Default missing arrays to empty if AI omits them
    const safeMetadata = {
      dosha: shlokaData.metadata?.dosha || [],
      dhatu: shlokaData.metadata?.dhatu || [],
      mala: shlokaData.metadata?.mala || [],
      srotas: shlokaData.metadata?.srotas || [],
      agent: shlokaData.metadata?.agni || [],
      vyadhi: shlokaData.metadata?.vyadhi || [],
      lakshana: shlokaData.metadata?.lakshana || [],
      nidana: shlokaData.metadata?.nidana || [],
      dravya: shlokaData.metadata?.dravya || [],
      karma: shlokaData.metadata?.karma || [],
      keywords: shlokaData.metadata?.keywords || []
    };

    const newShlokaDraft = new Shloka({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter),
      shlokaNumber: shlokaData.shlokaNumber,
      containedShlokas: shlokaData.containedShlokas || [],
      originalShloka: shlokaData.originalShloka,
      easyToReadShloka: shlokaData.easyToReadShloka,
      words: shlokaData.words,
      anvaya: shlokaData.anvaya,
      translationHindi: shlokaData.translationHindi,
      vimarsh: shlokaData.vimarsh,
      metadata: safeMetadata,
      status: "PENDING"
    });

    await newShlokaDraft.save();

    return NextResponse.json({ 
      success: true, 
      message: `Section ${shlokaData.shlokaNumber} extracted safely.`, 
      data: newShlokaDraft 
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

/*import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/mongodb";
import Shloka from "@/models/Shloka";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is missing.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_FALLBACK_LIST = [
  
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

async function generateWithFallback(systemPrompt: string, pdfPart: any) {
  let lastError;
  for (const modelName of MODEL_FALLBACK_LIST) {
    try {
      console.log(`[AyushGyaan Engine] Try model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      });

      const result = await model.generateContent([systemPrompt, pdfPart]);
      return result.response.text();
    } catch (error: any) {
      console.error(`[AyushGyaan Engine] Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error?.status === 429 || error?.status === 404 || error?.status === 503) continue;
      throw error;
    }
  }
  throw new Error(`Extraction failed across all models. Last error: ${lastError?.message}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, samhita, sthana, chapter, lastExtractedShloka } = body;

    if (!pdfBase64 || !samhita || !chapter) {
      return NextResponse.json({ error: "Required fields or PDF missing." }, { status: 400 });
    }

    await connectToDatabase();

    const pdfPart = {
      inlineData: { data: pdfBase64, mimeType: "application/pdf" },
    };

    const systemPrompt = `
You are NOT a chatbot. You are an AI Knowledge Extraction Engine, great knowlege of authentic deep ayurvedic taxt (charak samhita,shushrut and all others) and ayurvedic sanskritwhose only job is to convert scanned Ayurvedic books into a highly structured knowledge base.
Your highest priority is DATA QUALITY, STRICT VISUAL GROUPING, and ZERO HALLUCINATION.

WHAT IS A "SECTION"? (STRICT VISUAL GROUPING)
The PDF contains images of physical book pages. A "Section" is strictly a visual block on the page containing: 
[Sanskrit Text (one, multiple, or partial shlokas)] + [Its Hindi Translation (Anuwad)] + [Its Commentary (Vimarsh)].
A visual block ends ONLY when the VERY NEXT Sanskrit verse/main shloka (starting with a new numbering or heading) begins. Treat multi-paragraph commentaries as a single continuous unit. 
You must extract this EXACT visual block as ONE single JSON unit. Do not leak into the next section's translation or commentary. Do not break this visual group.

SEPARATING 'SECTIONS' FROM 'SHLOKA NUMBERS' (CRITICAL FOR RAG)
1. Visual Section vs Content: You must separate the concept of a visual section from the actual shloka numbers.
2. "containedShlokas" Array: Accurately identify which shloka numbers (full or partial) are physically present in the current Sanskrit text block. Output them as an array of strings.
   - Example A: If the block contains Shloka 1 and 2, return "containedShlokas": ["1", "2"].
   - Example B: If the block contains Shloka 3, 4, and the first half of Shloka 5, return "containedShlokas": ["3", "4", "5"].
   - Example C: If the NEXT block contains the second half of Shloka 5, Shloka 6, and Shloka 7, return "containedShlokas": ["5", "6", "7"].
3. "shlokaNumber" String: Give a logical title to this block based on its contents (e.g., "1-2", "3-5", "5-7").

ANTI-HALLUCINATION WARNING (CRITICAL)
If a shloka is cut in half at the end of the visual block, DO NOT use your external knowledge or internet to complete it. Extract ONLY the exact half-lines visible in this specific visual block. 

RESUME & LOOK-AHEAD LOGIC
- We have already saved up to visual block name: '${lastExtractedShloka || 'None'}' in our database for this chapter.
- Locate where the translation/vimarsh for that block ends in the PDF. 
- Start extracting strictly from the VERY NEXT visual block.
- Extract exactly ONE new complete visual block per request.
- If no next section exists, return "shlokaNumber":"COMPLETED" and leave all remaining fields empty.

SOURCE OF TRUTH & OCR
- The uploaded PDF (${samhita}, ${sthana}, Chapter ${chapter}) is the ONLY source of truth.
- Correct only: Sanskrit spelling, Matra, Halant, Sandhi mistakes caused by OCR. Missing punctuation.

TRANSLATION & VIMARSH
- Simplify the grammar and sentence structure, but STRICTLY RETAIN all original technical Ayurvedic terminology (e.g., Anubandha Chatushtaya, Sthana definitions). Explain complex terms like a top university professor, using structured formats like bullet points for easier memorization,
- Rewrite into simple modern Hindi. Keep every important point.
- Rewrite Vimarsh to be clean and structured. 
- vimarsh may consist of multiple paragraphs. or may be absent. If absent, return empty string "".
- vimarsh may include charts, tables,or structured information. if present, instead of reproducing them as raw table, convert them into clear,well-organised bullet points or numbered lists that are easy to understand and memorize, while preserving all original information.
- Break long paragraphs using double line breaks (\\n\\n).

PADACHEDA & ANVAYA
Provide accurate Hindi and English word meanings. Generate proper Sanskrit anvaya without simplifying grammar.

KNOWLEDGE TAGGING (RAG METADATA)
Create lightweight metadata only if EXPLICITLY present. Return empty arrays [] when absent. Never infer or hallucinate.

JSON OUTPUT
Always return valid JSON. Never wrap inside markdown. Never use \`\`\`json. Return only JSON.

Required JSON Schema:
{
  "shlokaNumber": "String. Label for this block (e.g., '13', '14-15') OR 'COMPLETED'.",
  "containedShlokas": ["Array of Strings. All numbers present fully or partially in this block, e.g., ['14', '15']"],
  "originalShloka": "String. Corrected Sanskrit text EXACTLY as seen in this block with \\n",
  "easyToReadShloka": "String. Sandhi-vichhed yukt saral shlok",
  "words": [
    {
      "text": "word1",
      "hasSandhi": true,
      "sandhiComponents": ["part1", "part2"],
      "meaningHindi": "Hindi meaning",
      "meaningEnglish": "English meaning"
    }
  ],
  "anvaya": "String. Logical Sanskrit Syntax",
  "translationHindi": "String. Simple modern Hindi translation with \\n\\n",
  "vimarsh": "String. Rewritten easy commentary with \\n\\n",
  "metadata": {
    "dosha": ["Array of Strings"],
    "dhatu": ["Array of Strings"],
    "mala": ["Array of Strings"],
    "srotas": ["Array of Strings"],
    "agni": ["Array of Strings"],
    "vyadhi": ["Array of Strings"],
    "lakshana": ["Array of Strings"],
    "nidana": ["Array of Strings"],
    "dravya": ["Array of Strings"],
    "karma": ["Array of Strings"],
    "keywords": ["Array of Strings"]
  }
}
`;

    const aiResponseText = await generateWithFallback(systemPrompt, pdfPart);
    
    let shlokaData;
    try {
      const cleanedText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      shlokaData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Parse Error. Raw Output:", aiResponseText);
      return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
    }

    if (shlokaData.shlokaNumber === "COMPLETED") {
       return NextResponse.json({ success: true, message: "Chapter Completed", data: shlokaData }, { status: 200 });
    }

    // Default missing arrays to empty if AI omits them
    const safeMetadata = {
      dosha: shlokaData.metadata?.dosha || [],
      dhatu: shlokaData.metadata?.dhatu || [],
      mala: shlokaData.metadata?.mala || [],
      srotas: shlokaData.metadata?.srotas || [],
      agni: shlokaData.metadata?.agni || [],
      vyadhi: shlokaData.metadata?.vyadhi || [],
      lakshana: shlokaData.metadata?.lakshana || [],
      nidana: shlokaData.metadata?.nidana || [],
      dravya: shlokaData.metadata?.dravya || [],
      karma: shlokaData.metadata?.karma || [],
      keywords: shlokaData.metadata?.keywords || []
    };

    const newShlokaDraft = new Shloka({
      samhitaName: samhita,
      sthana: sthana,
      chapter: parseInt(chapter),
      shlokaNumber: shlokaData.shlokaNumber,
      containedShlokas: shlokaData.containedShlokas || [], // <-- Mapping new field
      originalShloka: shlokaData.originalShloka,
      easyToReadShloka: shlokaData.easyToReadShloka,
      words: shlokaData.words,
      anvaya: shlokaData.anvaya,
      translationHindi: shlokaData.translationHindi,
      vimarsh: shlokaData.vimarsh,
      metadata: safeMetadata,
      status: "PENDING"
    });

    await newShlokaDraft.save();

    return NextResponse.json({ 
      success: true, 
      message: `Section ${shlokaData.shlokaNumber} extracted safely.`, 
      data: newShlokaDraft 
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}*/
