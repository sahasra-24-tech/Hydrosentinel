import { Router } from "express";
import { buildRiskScore, calculateEma, determineRiskLevel, getDistrictCoordinates, haversineDistanceKm } from "../utils/risk.js";
import { fetchWeatherData } from "../utils/weather.js";
import { dispatchRiskAlerts } from "../utils/notifications.js";

const router = Router();

router.post("/score", async (req, res) => {
  try {
    const { lat, lng, district, weatherData } = req.body;

    if (lat === undefined || lng === undefined || !district) {
      return res.status(400).json({ message: "lat, lng and district are required" });
    }

    const weather = weatherData ?? await fetchWeatherData(lat, lng);
    const districtCoordinates = getDistrictCoordinates(district) ?? { latitude: Number(lat), longitude: Number(lng) };
    const distanceKm = haversineDistanceKm(Number(lat), Number(lng), districtCoordinates.latitude, districtCoordinates.longitude);

    const rainfallArray = weather.historical.map((day) => day.precipitation_sum);
    const rainfallEma = calculateEma(rainfallArray);
    const latest = weather.current ?? weather.historical[weather.historical.length - 1] ?? weather.forecast[0] ?? {
      precipitation_sum: 0,
      relative_humidity_2m: 0,
      temperature_2m: 0,
      windspeed_10m: 0
    };

    const { score, dominantWeatherCondition } = buildRiskScore({
      rainfallMm: latest.precipitation_sum,
      humidity: latest.relative_humidity_2m,
      temperature: latest.temperature_2m,
      windSpeed: latest.windspeed_10m,
      rainfallTrend: Math.max(0, latest.precipitation_sum - rainfallEma)
    });

    const riskLevel = determineRiskLevel(score);

    await dispatchRiskAlerts({ districtName: district, score, riskLevel });

    return res.json({
      success: true,
      district,
      distanceKm: Number(distanceKm.toFixed(2)),
      riskScore: score,
      riskLevel,
      dominantWeatherCondition,
      weather
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to calculate risk" });
  }
});

export default router;
