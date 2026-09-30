import dotenv from "dotenv";
import mongoose from "mongoose";
import DemoData from "./models/DemoData.js";
import { demoSeedData } from "./data/demoData.js";

dotenv.config();

const runSeed = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await DemoData.deleteMany({});
  await DemoData.insertMany(demoSeedData);

  console.log(`Seeded ${demoSeedData.length} demo weather records.`);
  await mongoose.disconnect();
};

runSeed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
  }
  process.exit(1);
});
