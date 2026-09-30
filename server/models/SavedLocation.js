import mongoose from "mongoose";

const savedLocationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    districtName: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { timestamps: { createdAt: "savedAt", updatedAt: false } }
);

export default mongoose.model("SavedLocation", savedLocationSchema);
