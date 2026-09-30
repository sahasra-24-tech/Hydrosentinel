import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance.js";
import { districts } from "../data/districts.js";
import MapView from "../components/MapView.jsx";

const telanganaDistricts = districts.filter((district) => district.state === "Telangana");

const riskRank = { Red: 4, Orange: 3, Yellow: 2, Green: 1 };
const riskColor = { Green: "#22c55e", Yellow: "#facc15", Orange: "#fb923c", Red: "#ef4444", Unavailable: "#60a5fa" };

const getWeatherByDistrict = async (district) => {
  const locationResponse = await axiosInstance.get("/geo/resolve", { params: { district: district.name } });
  const location = locationResponse.data.location;
  const weatherResponse = await axiosInstance.get(`/weather/${location.lat}/${location.lng}`);
  const weather = weatherResponse.data.weather;
  const riskResponse = await axiosInstance.post("/risk/score", {
    lat: location.lat,
    lng: location.lng,
    district: district.name,
    weatherData: weather
  });

  return {
    ...district,
    lat: location.lat,
    lng: location.lng,
    weather,
    riskLevel: riskResponse.data.riskLevel,
    riskScore: riskResponse.data.riskScore,
    lastUpdated: new Date().toLocaleString(),
    status: "loaded"
  };
};

export default function StateOverview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("riskLevel");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled(telanganaDistricts.map((district) => getWeatherByDistrict(district)));
      if (!active) return;

      setRows(results.map((result, index) => {
        const district = telanganaDistricts[index];
        if (result.status === "fulfilled") return result.value;
        return {
          ...district,
          lat: district.lat,
          lng: district.lng,
          weather: null,
          riskLevel: "Green",
          riskScore: 0,
          lastUpdated: "data unavailable",
          status: "error"
        };
      }));
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortKey === "riskLevel") {
        const diff = (riskRank[b.riskLevel] ?? 0) - (riskRank[a.riskLevel] ?? 0);
        return sortDirection === "asc" ? -diff : diff;
      }

      const aValue = sortKey === "rainfall" ? (a.weather?.current?.precipitation_sum ?? -1) : sortKey === "temperature" ? (a.weather?.current?.temperature_2m ?? -1) : (a[sortKey] ?? "");
      const bValue = sortKey === "rainfall" ? (b.weather?.current?.precipitation_sum ?? -1) : sortKey === "temperature" ? (b.weather?.current?.temperature_2m ?? -1) : (b[sortKey] ?? "");
      if (typeof aValue === "number" && typeof bValue === "number") return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      return sortDirection === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    });
  }, [rows, sortKey, sortDirection]);

  const mapDistricts = useMemo(() => rows.map((district) => ({ ...district, riskLevel: district.riskLevel })), [rows]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "riskLevel" ? "desc" : "asc");
  };

  return (
    <main className="dashboard-page state-overview-page">
      <section className="panel state-overview-hero">
        <div>
          <div className="eyebrow">State Overview</div>
          <h2>All 33 Telangana districts</h2>
        </div>
        {loading ? <div className="detail-line">Loading district risk data...</div> : <div className="detail-line">Worst risk appears first by default.</div>}
      </section>

      <section className="dashboard-grid state-overview-grid">
        <div className="map-column panel">
          {loading ? <div className="spinner-box"><div className="spinner" /></div> : <MapView districts={mapDistricts} center={[18.123, 79.123]} zoom={7} />}
        </div>
        <div className="panel state-overview-table-panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th><button type="button" onClick={() => toggleSort("name")}>District</button></th>
                  <th><button type="button" onClick={() => toggleSort("riskLevel")}>Risk Level</button></th>
                  <th><button type="button" onClick={() => toggleSort("rainfall")}>Rainfall (mm)</button></th>
                  <th><button type="button" onClick={() => toggleSort("temperature")}>Temperature</button></th>
                  <th><button type="button" onClick={() => toggleSort("lastUpdated")}>Last Updated</button></th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                        <td><span className={`risk-chip risk-${(row.riskLevel || "Unavailable").toLowerCase()}`} style={{ backgroundColor: `${riskColor[row.riskLevel] || riskColor.Unavailable}22` }}>{row.riskLevel}</span></td>
                    <td>{row.status === "error" ? "data unavailable" : row.weather?.current?.precipitation_sum ?? "data unavailable"}</td>
                    <td>{row.status === "error" ? "data unavailable" : row.weather?.current?.temperature_2m ?? "data unavailable"}</td>
                    <td>{row.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}