import { Router } from "express";
import { fetchWeatherData } from "../utils/weather.js";

const router = Router();

router.get("/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const weather = await fetchWeatherData(lat, lng);
    return res.json({ success: true, weather });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch weather" });
  }
});

export default router;
