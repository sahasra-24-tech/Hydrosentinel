import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance.js";
import { districts } from "../data/districts.js";
import { calculateRiskFromWeather } from "../lib/risk.js";
import { resolveCoordinatesLocation, resolveDistrictLocation } from "../lib/geocoding.js";
import MapView from "../components/MapView.jsx";
import WeatherCards from "../components/WeatherCards.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import AdvisoryBox from "../components/AdvisoryBox.jsx";
import ClaimAlertBanner from "../components/ClaimAlertBanner.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { useLocation } from "../hooks/useLocation.js";
import { useSpeechAdvisory } from "../hooks/useSpeechAdvisory.js";

const getWeatherSeverity = (value, key) => {
  if (key === "temperature_2m" && value > 42) return "high";
  if (key === "relative_humidity_2m" && value > 85) return "high";
  if (key === "precipitation_sum" && value > 100) return "high";
  if (key === "windspeed_10m" && value > 60) return "high";
  return "normal";
};

const cacheKey = (district) => `hydrosentinel_cache_${district.toLowerCase()}`;
const advisoryCacheKey = (district, language) => `${district.toLowerCase()}__${language}`;
const defaultHyderabadCoords = { lat: 17.38, lng: 78.48 };
const defaultLocation = { districtName: "Hyderabad", lat: defaultHyderabadCoords.lat, lng: defaultHyderabadCoords.lng };

const buildLocalAdvisory = ({ district, riskLevel, userType, weather, rainfallSimulation, advisoryLanguage = "en" }) => {
  const rainfall = rainfallSimulation ?? weather?.current?.precipitation_sum ?? 0;
  const humidity = weather?.current?.relative_humidity_2m ?? 0;
  const toneEn = riskLevel === "Red" ? "Very high risk" : riskLevel === "Orange" ? "High risk" : riskLevel === "Yellow" ? "Moderate risk" : "Low risk";
  const toneTe = riskLevel === "Red" ? "అత్యధిక ప్రమాదం" : riskLevel === "Orange" ? "అధిక ప్రమాదం" : riskLevel === "Yellow" ? "మధ్యస్థ ప్రమాదం" : "తక్కువ ప్రమాదం";

  if (advisoryLanguage === "te") {
    if (userType === "farmer") {
      return `${district}: ${toneTe}. వర్షపాతం సుమారు ${rainfall} mm, తేమ ${humidity}% ఉంది. పొలాల్లో నీరు నిల్వ కాకుండా నికాసం మార్గాలను పరిశీలించండి, విత్తనాలను కాపాడండి, భారీ వానలో పిచికారీని వాయిదా వేయండి. కట్టలను బలపరచి వ్యవసాయ సామగ్రిని పొడి ప్రదేశానికి మార్చండి. నీటిపారుదల ముందు తాజా అప్‌డేట్‌ను చూసుకోండి.`;
    }

    return `${district}: ${toneTe}. వర్షపాతం సుమారు ${rainfall} mm, తేమ ${humidity}% ఉంది. లోతట్టు దారులను దాటకుండా ఉండండి, అవసరమైన వస్తువులు దగ్గర ఉంచుకోండి, తీవ్రమైన వాన సమయంలో ఇంట్లోనే ఉండండి. ఫోన్ ఛార్జ్‌లో ఉంచి స్థానిక హెచ్చరికలను అనుసరించండి. నీటి మట్టం పెరిగితే వెంటనే సురక్షిత ప్రాంతానికి వెళ్లండి.`;
  }

  if (userType === "farmer") {
    return `${district}: ${toneEn}. Rainfall is about ${rainfall} mm and humidity is ${humidity}%. Keep field drainage open, protect seeds, and avoid spraying during heavy rain. Check bunds and move farm inputs to dry storage. Watch the next update before irrigation.`;
  }

  return `${district}: ${toneEn}. Rainfall is around ${rainfall} mm with humidity at ${humidity}%. Avoid low-lying roads, carry essentials, and stay indoors during intense showers. Keep phones charged and follow local alerts. If water rises, move to safer ground quickly.`;
};

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState(defaultLocation.districtName);
  const [search, setSearch] = useState(defaultLocation.districtName);
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState({ riskScore: 0, riskLevel: "Green", dominantWeatherCondition: "Stable conditions" });
  const [advisory, setAdvisory] = useState("");
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryLanguage, setAdvisoryLanguage] = useState("en");
  const [advisoryCache, setAdvisoryCache] = useState({});
  const [activeTab, setActiveTab] = useState("general");
  const [demoMode, setDemoMode] = useState(false);
  const [rainfallSimulation, setRainfallSimulation] = useState(0);
  const [offlineBanner, setOfflineBanner] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [alertOn, setAlertOn] = useState(false);
  const [advisoryText, setAdvisoryText] = useState("");
  const { speaking, toggleSpeech } = useSpeechAdvisory({ text: advisoryText, language: advisoryLanguage });

  const currentCoords = selectedLocation ?? defaultLocation;
  const currentAdvisoryCacheKey = advisoryCacheKey(selectedDistrict, advisoryLanguage);
  const district = useMemo(() => districts.find((item) => item.name.toLowerCase() === selectedDistrict.toLowerCase()) ?? { name: selectedDistrict, state: "India", lat: currentCoords.lat, lng: currentCoords.lng }, [selectedDistrict, currentCoords.lat, currentCoords.lng]);
  const filteredDistricts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return districts;
    return districts.filter((item) => item.name.toLowerCase().includes(query) || item.state.toLowerCase().includes(query));
  }, [search]);

  const handleDistrictSelection = (value) => {
    const nextDistrict = value.trim() || defaultLocation.districtName;
    setSearch(nextDistrict);
    setSelectedDistrict(nextDistrict);
    setIsDropdownOpen(false);
    setAdvisoryCache({});
  };

  const { getCurrentLocation, resolveDistrict, locationLoading } = useLocation();

  const handleCurrentLocation = async () => {
    setError("");
    try {
      const resolvedLocation = await getCurrentLocation();
      setSelectedLocation({
        districtName: resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng
      });
      setSearch(resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName);
      setSelectedDistrict(resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName);
    } catch (locationError) {
      setError(locationError.message || "Unable to access your current location. Please choose a district manually.");
    }
  };

  const loadWeather = async (districtName) => {
    const requestedDistrict = districtName?.trim() || defaultLocation.districtName;
    setLoading(true);
    setError("");
    setOfflineBanner("");
    setAdvisoryCache({});

    try {
      let resolvedLocation = currentCoords;
      if (resolvedLocation.districtName?.toLowerCase() !== requestedDistrict.toLowerCase()) {
        resolvedLocation = await resolveDistrict(requestedDistrict);
      }

      setSelectedLocation({
        districtName: resolvedLocation.districtName || requestedDistrict,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng
      });

      if (demoMode) {
        const demoResponse = await axiosInstance.get("/demo/data", { params: { district: resolvedLocation.districtName || requestedDistrict } });
        const demo = demoResponse.data.data;

        if (!demo) {
          throw new Error("Demo data is not available");
        }

        const currentWeather = {
          temperature_2m: demo.weather.temperature_2m,
          relative_humidity_2m: demo.weather.relative_humidity_2m,
          precipitation: demo.weather.precipitation_sum,
          precipitation_sum: demo.weather.precipitation_sum,
          windspeed_10m: demo.weather.windspeed_10m
        };
        const payload = {
          current: currentWeather,
          historical: demo.historical ?? [],
          forecast: demo.forecast ?? []
        };

        setWeather(payload);
        const computed = calculateRiskFromWeather({
          rainfallMm: demo.weather.precipitation_sum,
          humidity: demo.weather.relative_humidity_2m,
          temperature: demo.weather.temperature_2m,
          windSpeed: demo.weather.windspeed_10m,
          rainfallSimulation
        });
        setRisk({ riskScore: demo.riskScore ?? computed.riskScore, riskLevel: demo.riskLevel ?? computed.riskLevel, dominantWeatherCondition: "Seeded demo data" });
        localStorage.setItem(cacheKey(demo.districtName), JSON.stringify({ weather: payload, risk: { riskScore: demo.riskScore, riskLevel: demo.riskLevel, dominantWeatherCondition: "Seeded demo data" } }));
        setAdvisoryText(buildLocalAdvisory({ district: demo.districtName, riskLevel: demo.riskLevel, userType: activeTab, weather: payload, rainfallSimulation, advisoryLanguage }));
        return;
      }

      const weatherResponse = await axiosInstance.get(`/weather/${resolvedLocation.lat}/${resolvedLocation.lng}`);
      const payload = weatherResponse.data.weather;
      setWeather(payload);

      const riskResponse = await axiosInstance.post("/risk/score", {
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        district: requestedDistrict,
        weatherData: payload
      });

      setRisk({
        riskScore: riskResponse.data.riskScore,
        riskLevel: riskResponse.data.riskLevel,
        dominantWeatherCondition: riskResponse.data.dominantWeatherCondition
      });
      setAdvisoryText(buildLocalAdvisory({ district: requestedDistrict, riskLevel: riskResponse.data.riskLevel, userType: activeTab, weather: payload, rainfallSimulation, advisoryLanguage }));
      localStorage.setItem(cacheKey(requestedDistrict), JSON.stringify({ weather: payload, risk: riskResponse.data }));
    } catch (fetchError) {
      const cached = localStorage.getItem(cacheKey(requestedDistrict));
      if (cached) {
        const parsed = JSON.parse(cached);
        setWeather(parsed.weather);
        setRisk(parsed.risk);
        setOfflineBanner("Showing last known data.");
        setAdvisoryText(buildLocalAdvisory({ district: requestedDistrict, riskLevel: parsed.risk.riskLevel, userType: activeTab, weather: parsed.weather, rainfallSimulation, advisoryLanguage }));
      } else {
        setError(fetchError.response?.status === 404 ? fetchError.response?.data?.message || `No data available for ${requestedDistrict}` : fetchError.response?.data?.message || "Unable to load district weather");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedDistrict);
  }, [selectedDistrict, demoMode]);

  // FIXED: was causing an infinite render loop because it depended on
  // `weather` and `risk.riskLevel` while also calling setWeather/setRisk inside.
  // Now only runs when the rainfall slider actually changes.
  useEffect(() => {
    if (rainfallSimulation > 0) {
      const computed = calculateRiskFromWeather({
        rainfallMm: rainfallSimulation,
        humidity: weather?.current?.relative_humidity_2m ?? weather?.current?.humidity ?? 0,
        temperature: weather?.current?.temperature_2m ?? 0,
        windSpeed: weather?.current?.windspeed_10m ?? 0,
        rainfallSimulation
      });
      setRisk({ ...computed, dominantWeatherCondition: "Simulated rainfall" });
      setWeather((current) => current ? { ...current, current: { ...(current.current ?? {}), precipitation_sum: rainfallSimulation, precipitation: rainfallSimulation } } : current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainfallSimulation]);

  useEffect(() => {
    const cachedAdvisory = advisoryCache[currentAdvisoryCacheKey];
    setAdvisoryText(cachedAdvisory || buildLocalAdvisory({ district: selectedDistrict, riskLevel: risk.riskLevel, userType: activeTab, weather, rainfallSimulation, advisoryLanguage }));
  }, [activeTab, selectedDistrict, risk.riskLevel, weather, rainfallSimulation, advisoryLanguage, advisoryCache, currentAdvisoryCacheKey]);

  const advisorySource = activeTab === "farmer" ? "farmer" : "general public";

  const getAdvisory = async (language = advisoryLanguage) => {
    const requestedDistrict = selectedDistrict;
    setAdvisoryLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.post("/ai/advisory", {
        district: requestedDistrict,
        weatherData: weather,
        riskLevel: risk.riskLevel,
        userType: advisorySource === "farmer" ? "farmer" : "general",
        language
      });
      setAdvisoryCache((currentCache) => ({ ...currentCache, [advisoryCacheKey(requestedDistrict, language)]: data.advisory }));
      setAdvisoryText(data.advisory);
    } catch (advisoryError) {
      setError(advisoryError.response?.data?.message || "Unable to fetch advisory");
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const handleAdvisoryLanguageToggle = () => {
    const nextLanguage = advisoryLanguage === "en" ? "te" : "en";
    setAdvisoryLanguage(nextLanguage);
    const cachedAdvisory = advisoryCache[advisoryCacheKey(selectedDistrict, nextLanguage)];
    setAdvisoryText(cachedAdvisory || buildLocalAdvisory({ district: selectedDistrict, riskLevel: risk.riskLevel, userType: activeTab, weather, rainfallSimulation, advisoryLanguage: nextLanguage }));

    if (!cachedAdvisory) {
      void getAdvisory(nextLanguage);
    }
  };

  const saveLocation = async () => {
    setSaving(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("hydrosentinel_user") || "null");
      if (!user) throw new Error("Please login first");
      await axiosInstance.post("/locations/save", {
        districtName: selectedDistrict,
        lat: currentCoords.lat,
        lng: currentCoords.lng
      });
    } catch (locationError) {
      setError(locationError.response?.data?.message || locationError.message || "Unable to save location");
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async () => {
    setAlertOn((value) => !value);
    if (alertOn) return;
    try {
      const user = JSON.parse(localStorage.getItem("hydrosentinel_user") || "null");
      if (!user?.email) throw new Error("Login is required for alerts");
      await axiosInstance.post("/alerts/subscribe", {
        email: user.email,
        district: selectedDistrict,
        threshold: risk.riskLevel === "Red" ? "Red" : "Orange",
        lat: currentCoords.lat,
        lng: currentCoords.lng
      });
    } catch (alertError) {
      setError(alertError.response?.data?.message || alertError.message || "Unable to subscribe for alerts");
    }
  };

  const mapDistricts = districts.map((item) => ({
    ...item,
    riskLevel: item.name === selectedDistrict ? risk.riskLevel : "Green"
  }));

  const severityByField = {
    temperature_2m: getWeatherSeverity(weather?.current?.temperature_2m ?? 0, "temperature_2m"),
    relative_humidity_2m: getWeatherSeverity(weather?.current?.relative_humidity_2m ?? 0, "relative_humidity_2m"),
    precipitation_sum: getWeatherSeverity(weather?.current?.precipitation_sum ?? 0, "precipitation_sum"),
    windspeed_10m: getWeatherSeverity(weather?.current?.windspeed_10m ?? 0, "windspeed_10m")
  };

  const handleGenerateFloodEvidenceReport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString();
    const reportTitle = "Flood Evidence Report";
    const currentWeather = weather?.current ?? {};

    doc.setFillColor(10, 24, 41);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("HydroSentinel", 15, 16);

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1.2);
    doc.line(15, 25, 195, 25);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(reportTitle, 15, 40);

    doc.setFillColor(219, 234, 254);
    doc.roundedRect(15, 45, 180, 25, 4, 4, "F");
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(11);
    doc.text("Village / District", 20, 56);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(selectedDistrict, 20, 65);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`Coordinates: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`, 15, 82);
    doc.text(`Date / Time: ${currentDate}`, 15, 90);
    doc.text(`Temperature: ${currentWeather.temperature_2m ?? "N/A"}°C`, 15, 98);
    doc.text(`Rainfall: ${currentWeather.precipitation_sum ?? currentWeather.precipitation ?? "N/A"} mm`, 15, 106);
    doc.text(`Wind Speed: ${currentWeather.windspeed_10m ?? "N/A"} km/h`, 15, 114);
    doc.text(`Risk Level: ${risk.riskLevel}`, 15, 122);

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(15, 135, 195, 135);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Official flood evidence generated by HydroSentinel for field and insurance claim review.", 15, 148, { maxWidth: 180 });

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("This document is intended as supporting evidence and should be reviewed with local records.", 15, 170, { maxWidth: 180 });

    doc.save(`${selectedDistrict.replace(/\s+/g, "-").toLowerCase()}-flood-evidence-report.pdf`);
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-topbar">
        <div className="search-wrap">
          <input className="search-input" placeholder="Search district by name" value={search} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 120)} onChange={(event) => { setSearch(event.target.value); setIsDropdownOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter") { handleDistrictSelection(search); } }} />
          {isDropdownOpen && filteredDistricts.length > 0 ? (
            <ul className="district-dropdown" role="listbox">
              {filteredDistricts.slice(0, 8).map((item) => (
                <li key={item.name} role="option" onClick={() => handleDistrictSelection(item.name)}>
                  <span>{item.name}</span>
                  <small>{item.state}</small>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button className="btn btn-secondary" onClick={() => handleDistrictSelection(search)}>Load District</button>
        <button className="btn btn-secondary" onClick={handleCurrentLocation} disabled={locationLoading}>{locationLoading ? "Locating..." : "Use Current Location"}</button>
        <button className={`toggle-btn ${activeTab === "farmer" ? "active" : ""}`} onClick={() => setActiveTab("farmer")}>I am a Farmer</button>
        <button className={`toggle-btn ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>General User</button>
        <button className={`toggle-btn ${demoMode ? "active" : ""}`} onClick={() => setDemoMode((value) => !value)}>Demo Mode</button>
      </section>

      <section className="slider-card panel">
        <label>Simulate Rainfall Intensity</label>
        <input type="range" min="0" max="300" value={rainfallSimulation} onChange={(event) => setRainfallSimulation(Number(event.target.value))} />
        <div className="slider-value">{rainfallSimulation} mm</div>
      </section>

      {offlineBanner ? <div className="offline-banner">{offlineBanner}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      <ClaimAlertBanner riskLevel={risk.riskLevel} onGenerateReport={handleGenerateFloodEvidenceReport} />

      <section className="dashboard-grid">
        <div className="map-column panel">
          {loading ? <div className="spinner-box"><div className="spinner" /></div> : <MapView districts={mapDistricts} center={[selectedLocation.lat, selectedLocation.lng]} zoom={11} selectedDistrict={selectedDistrict} />}
        </div>
        <div className="info-column">
          <WeatherCards weather={weather?.current} severityByField={severityByField} />
          <RiskBadge riskLevel={risk.riskLevel} riskScore={risk.riskScore} />
          <button className="btn btn-primary full-width" onClick={() => getAdvisory()} disabled={advisoryLoading}>{advisoryLoading ? "Generating..." : "Get AI Advisory"}</button>
          <button className="btn btn-secondary small" onClick={handleAdvisoryLanguageToggle} disabled={advisoryLoading}>{advisoryLanguage === "en" ? "English / తెలుగు" : "తెలుగు / English"}</button>
          <AdvisoryBox loading={advisoryLoading} advisory={advisoryText} activeTab={activeTab} setActiveTab={setActiveTab} />
          <button className="btn btn-secondary full-width" onClick={toggleSpeech}>{speaking ? "⏸ Stop" : "🔊 Listen to Advisory"}</button>
          <TrendChart historical={weather?.historical ?? []} forecast={weather?.forecast ?? []} />
          <div className="action-row">
            <button className="btn btn-secondary" onClick={saveLocation} disabled={saving}>{saving ? "Saving..." : "Save Location"}</button>
            <button className={`btn ${alertOn ? "btn-primary" : "btn-secondary"}`} onClick={toggleAlert}>{alertOn ? "Alert Subscribed" : "Email Alert Toggle"}</button>
          </div>
          <div className="detail-line">Dominant condition: {risk.dominantWeatherCondition}</div>
        </div>
      </section>
    </main>
  );
}