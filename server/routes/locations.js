import { Router } from "express";
import SavedLocation from "../models/SavedLocation.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/save", requireAuth, async (req, res) => {
  try {
    const { districtName, lat, lng } = req.body;
    if (!districtName || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "districtName, lat and lng are required" });
    }

    const savedLocation = await SavedLocation.create({
      userId: req.user.id,
      districtName,
      lat,
      lng
    });

    return res.status(201).json({ success: true, savedLocation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to save location" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const locations = await SavedLocation.find({ userId: req.params.userId }).sort({ savedAt: -1 });
    return res.json({ success: true, locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch locations" });
  }
});

export default router;
