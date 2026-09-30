import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendChart({ historical = [], forecast = [] }) {
  const labels = [...historical.map((item) => item.date), ...forecast.map((item) => item.date)];
  const data = {
    labels,
    datasets: [
      {
        label: "Past rainfall",
        data: historical.map((item) => item.precipitation_sum),
        borderColor: "#60a5fa",
        backgroundColor: "#60a5fa",
        tension: 0.35
      },
      {
        label: "Forecast rainfall",
        data: [...Array(historical.length).fill(null), ...forecast.map((item) => item.precipitation_sum)],
        borderColor: "#fb923c",
        borderDash: [8, 6],
        backgroundColor: "#fb923c",
        tension: 0.35
      }
    ]
  };

  return (
    <div className="panel chart-panel">
      <Line data={data} options={{ responsive: true, plugins: { legend: { labels: { color: "#e2e8f0" } } }, scales: { x: { ticks: { color: "#cbd5e1" } }, y: { ticks: { color: "#cbd5e1" } } } }} />
    </div>
  );
}
