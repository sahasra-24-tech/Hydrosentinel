import { FaTemperatureHigh, FaTint, FaCloudRain, FaWind } from "react-icons/fa";

const items = [
  { key: "temperature_2m", label: "Temperature", unit: "°C", icon: FaTemperatureHigh },
  { key: "relative_humidity_2m", label: "Humidity", unit: "%", icon: FaTint },
  { key: "precipitation_sum", label: "Rainfall", unit: "mm", icon: FaCloudRain },
  { key: "windspeed_10m", label: "Wind Speed", unit: "kmph", icon: FaWind }
];

export default function WeatherCards({ weather, severityByField = {} }) {
  return (
    <div className="weather-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div className={`weather-card severity-${severityByField[item.key] ?? "normal"}`} key={item.key}>
            <div className="weather-card-header">
              <Icon />
              <span>{item.label}</span>
            </div>
            <div className="weather-card-value">
              {weather?.[item.key] ?? "--"} <small>{item.unit}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
