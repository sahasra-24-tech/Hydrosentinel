import { Router } from "express";
import { resolveDistrictLocation, reverseGeocodeLocation } from "../utils/geocoding.js";

const router = Router();

router.get("/resolve", async (req, res) => {
  try {
    const district = typeof req.query.district === "string" ? req.query.district.trim() : "";
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : Number.NaN;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : Number.NaN;

    if (district) {
      const location = await resolveDistrictLocation(district);

      if (!location) {
        return res.status(404).json({ success: false, message: `No data available for ${district}` });
      }

      return res.json({ success: true, location });
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const location = await reverseGeocodeLocation(lat, lng);

      if (!location) {
        return res.status(404).json({ success: false, message: "No data available for the selected location" });
      }

      return res.json({ success: true, location });
    }

    return res.status(400).json({ success: false, message: "district or lat/lng is required" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to resolve location" });
  }
});

export default router;