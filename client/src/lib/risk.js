export const determineRiskLevel = (score) => {
  if (score >= 75) return "Red";
  if (score >= 50) return "Orange";
  if (score >= 25) return "Yellow";
  return "Green";
};

export const calculateRiskFromWeather = ({ rainfallMm, humidity, temperature, windSpeed, rainfallTrend = 0, rainfallSimulation = null }) => {
  let score = 0;

  const rainfallValue = rainfallSimulation ?? rainfallMm;
  if (rainfallValue >= 200) score += 80;
  else if (rainfallValue >= 100) score += 40;
  else if (rainfallValue >= 50) score += 20;

  if (humidity > 85) score += 20;
  if (temperature > 42) score += 20;
  if (windSpeed > 60) score += 20;
  if (rainfallTrend > 10) score += 10;

  score = Math.min(100, score);
  return { riskScore: score, riskLevel: determineRiskLevel(score) };
};
