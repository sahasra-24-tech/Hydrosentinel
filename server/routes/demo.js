import { Router } from "express";
import DemoData from "../models/DemoData.js";
import { demoSeedData } from "../data/demoData.js";

const router = Router();

router.get("/data", async (req, res) => {
  try {
    const districtName = typeof req.query.district === "string" ? req.query.district.trim() : "";

    if (districtName) {
      const demo = DemoData.db.readyState === 1 ? await DemoData.findOne({ districtName }) : demoSeedData.find((item) => item.districtName === districtName);

      if (!demo) {
        return res.status(404).json({ success: false, message: "Demo data not found for the requested district" });
      }

      return res.json({ success: true, mode: "demo", data: demo });
    }

    const data = DemoData.db.readyState === 1 ? await DemoData.find().sort({ districtName: 1 }) : demoSeedData;
    return res.json({ success: true, mode: "demo", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to load demo data" });
  }
});

export default router;
