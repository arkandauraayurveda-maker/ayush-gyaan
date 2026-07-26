import mongoose, { Schema, Document } from "mongoose";

export interface IShloka extends Document {
  samhitaName: string;
  sthana: string;
  chapter: number;
  shlokaNumber: string; // UI ke liye naam, e.g. "4-5"
  containedShlokas: string[]; // NAYA FIELD RAG ke liye: ["4", "5"]
  
  originalShloka: string;
  easyToReadShloka: string;
  words: {
    text: string;
    hasSandhi: boolean;
    sandhiComponents: string[];
    meaningHindi: string;
    meaningEnglish: string;
  }[];
  anvaya: string;
  translationHindi: string;
  vimarsh: string;

  metadata: {
    dosha: string[];
    dhatu: string[];
    mala: string[];
    srotas: string[];
    agni: string[];
    vyadhi: string[];
    lakshana: string[];
    nidana: string[];
    dravya: string[];
    karma: string[];
    keywords: string[];
  };
  
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const ShlokaSchema = new Schema<IShloka>(
  {
    samhitaName: { type: String, required: true },
    sthana: { type: String, required: true },
    chapter: { type: Number, required: true },
    shlokaNumber: { type: String, required: true },
    containedShlokas: [{ type: String }], // <-- Naya Field Added
    
    originalShloka: { type: String, required: true },
    easyToReadShloka: { type: String },
    words: [
      {
        text: { type: String },
        hasSandhi: { type: Boolean },
        sandhiComponents: [{ type: String }],
        meaningHindi: { type: String },
        meaningEnglish: { type: String }
      }
    ],
    anvaya: { type: String },
    translationHindi: { type: String },
    vimarsh: { type: String },

    metadata: {
      dosha: [{ type: String }],
      dhatu: [{ type: String }],
      mala: [{ type: String }],
      srotas: [{ type: String }],
      agni: [{ type: String }],
      vyadhi: [{ type: String }],
      lakshana: [{ type: String }],
      nidana: [{ type: String }],
      dravya: [{ type: String }],
      karma: [{ type: String }],
      keywords: [{ type: String }]
    },
    
    status: { type: String, default: "PENDING" }
  },
  { timestamps: true }
);

export default mongoose.models.Shloka || mongoose.model<IShloka>("Shloka", ShlokaSchema);