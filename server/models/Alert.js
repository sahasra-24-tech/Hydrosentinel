import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    districtName: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    threshold: { type: String, enum: ["Orange", "Red"], required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
