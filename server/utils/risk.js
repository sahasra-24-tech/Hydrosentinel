import { districtsByName } from "../data/districts.js";

export const riskOrder = ["Green", "Yellow", "Orange", "Red"];

export const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

export const calculateEma = (values, alpha = 0.5) => {
  if (!values?.length) return 0;
  return values.reduce((ema, current, index) => (index === 0 ? current : alpha * current + (1 - alpha) * ema), 0);
};

export const determineRiskLevel = (score) => {
  if (score >= 75) return "Red";
  if (score >= 50) return "Orange";
  if (score >= 25) return "Yellow";
  return "Green";
};

export const buildRiskScore = ({ rainfallMm, humidity, temperature, windSpeed, rainfallTrend }) => {
  const contributors = [];
  let score = 0;

  if (rainfallMm > 100) {
    score += 40;
    contributors.push({ label: "Rainfall", points: 40 });
  } else if (rainfallMm >= 50) {
    score += 20;
    contributors.push({ label: "Rainfall", points: 20 });
  }

  if (humidity > 85) {
    score += 20;
    contributors.push({ label: "Humidity", points: 20 });
  }

  if (temperature > 42) {
    score += 20;
    contributors.push({ label: "Temperature", points: 20 });
  }

  if (windSpeed > 60) {
    score += 20;
    contributors.push({ label: "Wind Speed", points: 20 });
  }

  if (rainfallTrend > 10) {
    score += 10;
    contributors.push({ label: "Rainfall Trend", points: 10 });
  }

  score = Math.min(100, score);
  const dominantWeatherCondition = contributors.sort((a, b) => b.points - a.points)[0]?.label ?? "Stable conditions";

  return { score, dominantWeatherCondition };
};

export const getDistrictCoordinates = (districtName) => districtsByName[districtName?.toLowerCase?.() ?? ""];
