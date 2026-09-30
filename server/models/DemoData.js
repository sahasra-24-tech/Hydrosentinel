import mongoose from "mongoose";

const demoDataSchema = new mongoose.Schema(
  {
    districtName: { type: String, required: true, unique: true, trim: true },
    state: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    weather: {
      temperature_2m: { type: Number, required: true },
      relative_humidity_2m: { type: Number, required: true },
      precipitation_sum: { type: Number, required: true },
      windspeed_10m: { type: Number, required: true }
    },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    historical: {
      type: [
        {
          date: String,
          precipitation_sum: Number
        }
      ],
      default: []
    },
    forecast: {
      type: [
        {
          date: String,
          precipitation_sum: Number
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("DemoData", demoDataSchema);
