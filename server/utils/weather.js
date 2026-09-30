const API_URL = "https://api.open-meteo.com/v1/forecast";

const groupDailyMetrics = (hourly) => {
  const days = new Map();

  hourly.time.forEach((time, index) => {
    const dateKey = time.slice(0, 10);
    const bucket = days.get(dateKey) ?? {
      date: dateKey,
      temperatureValues: [],
      humidityValues: [],
      precipitationValues: [],
      windValues: []
    };

    bucket.temperatureValues.push(hourly.temperature_2m[index]);
    bucket.humidityValues.push(hourly.relative_humidity_2m[index]);
    bucket.precipitationValues.push(hourly.precipitation[index]);
    bucket.windValues.push(hourly.windspeed_10m[index]);
    days.set(dateKey, bucket);
  });

  return [...days.values()].map((day) => ({
    date: day.date,
    temperature_2m: Number((day.temperatureValues.reduce((sum, value) => sum + value, 0) / day.temperatureValues.length).toFixed(1)),
    relative_humidity_2m: Number((day.humidityValues.reduce((sum, value) => sum + value, 0) / day.humidityValues.length).toFixed(1)),
    precipitation: Number(day.precipitationValues.reduce((sum, value) => sum + value, 0).toFixed(1)),
    windspeed_10m: Number((day.windValues.reduce((sum, value) => sum + value, 0) / day.windValues.length).toFixed(1)),
    precipitation_sum: Number(day.precipitationValues.reduce((sum, value) => sum + value, 0).toFixed(1))
  }));
};

export const fetchWeatherData = async (lat, lng) => {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    past_days: "7",
    forecast_days: "7",
    timezone: "auto",
    hourly: "temperature_2m,relative_humidity_2m,precipitation,windspeed_10m"
  });

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to fetch weather data");
  }

  const data = await response.json();
  const days = groupDailyMetrics(data.hourly ?? { time: [] });
  const historical = days.slice(0, 7);
  const forecast = days.slice(7, 14);
  const current = historical[historical.length - 1] ?? forecast[0] ?? null;

  return {
    location: { latitude: lat, longitude: lng },
    current,
    historical,
    forecast,
    raw: data
  };
};
