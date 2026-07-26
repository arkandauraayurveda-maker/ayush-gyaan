import mongoose from "mongoose";

const InstitutionSchema = new mongoose.Schema({
  university: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g. "DSRRAU"
  colleges: [{ 
    type: String 
  }], // e.g. ["Govt Ayurved College Jaipur", "NIA Jaipur"]
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Institution || mongoose.model("Institution", InstitutionSchema);