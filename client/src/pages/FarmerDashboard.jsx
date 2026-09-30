import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance.js";
import { districts } from "../data/districts.js";
import { calculateRiskFromWeather } from "../lib/risk.js";
import MapView from "../components/MapView.jsx";
import WeatherCards from "../components/WeatherCards.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import AdvisoryBox from "../components/AdvisoryBox.jsx";
import ClaimAlertBanner from "../components/ClaimAlertBanner.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { useLocation } from "../hooks/useLocation.js";
import { useSpeechAdvisory } from "../hooks/useSpeechAdvisory.js";

const cropOptions = ["Paddy", "Cotton", "Maize", "Chilli", "Groundnut", "Sugarcane"];
const growthStageOptions = ["Sowing", "Growing", "Harvesting"];
const defaultHyderabadCoords = { lat: 17.38, lng: 78.48 };
const defaultLocation = { districtName: "Hyderabad", lat: defaultHyderabadCoords.lat, lng: defaultHyderabadCoords.lng };

const advisoryCacheKey = (district, language, crop, growthStage) => `${district.toLowerCase()}__${language}__${crop}__${growthStage}`;

const buildLocalAdvisory = ({ district, riskLevel, weather, advisoryLanguage = "en", crop, growthStage }) => {
  const rainfall = weather?.current?.precipitation_sum ?? 0;
  const humidity = weather?.current?.relative_humidity_2m ?? 0;
  const toneEn = riskLevel === "Red" ? "Very high risk" : riskLevel === "Orange" ? "High risk" : riskLevel === "Yellow" ? "Moderate risk" : "Low risk";
  const toneTe = riskLevel === "Red" ? "అత్యధిక ప్రమాదం" : riskLevel === "Orange" ? "అధిక ప్రమాదం" : riskLevel === "Yellow" ? "మధ్యస్థ ప్రమాదం" : "తక్కువ ప్రమాదం";

  if (advisoryLanguage === "te") {
    return `${district}: ${crop} పంటకు ${growthStage} దశలో ${toneTe}. వర్షపాతం సుమారు ${rainfall} mm, తేమ ${humidity}% ఉంది. పొలాల్లో నీరు నిల్వ కాకుండా నికాసం మార్గాలను పరిశీలించండి, పంటను కాపాడండి, అవసరం లేకుండా పిచికారీ చేయవద్దు. తాజా హెచ్చరికలను గమనించండి.`;
  }

  return `${district}: ${toneEn} for ${crop} during ${growthStage}. Rainfall is about ${rainfall} mm and humidity is ${humidity}%. Keep field drainage open, protect the crop, and avoid spraying during heavy rain. Check the next update before irrigation.`;
};

export default function FarmerDashboard() {
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
  const [activeTab, setActiveTab] = useState("farmer");
  const [crop, setCrop] = useState("Paddy");
  const [growthStage, setGrowthStage] = useState("Growing");
  const [advisoryText, setAdvisoryText] = useState("");
  const [speechNote, setSpeechNote] = useState("");

  const { getCurrentLocation, resolveDistrict, locationLoading } = useLocation();
  const { speaking, toggleSpeech } = useSpeechAdvisory({ text: advisoryText, language: advisoryLanguage });
  const currentCoords = selectedLocation ?? defaultLocation;
  const currentAdvisoryCacheKey = advisoryCacheKey(selectedDistrict, advisoryLanguage, crop, growthStage);
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

  const handleCurrentLocation = async () => {
    try {
      const resolvedLocation = await getCurrentLocation();
      setSelectedLocation({ districtName: resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName, lat: resolvedLocation.lat, lng: resolvedLocation.lng });
      setSearch(resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName);
      setSelectedDistrict(resolvedLocation.districtName || resolvedLocation.displayName || defaultLocation.districtName);
    } catch (error) {
      setSpeechNote(error.message);
    }
  };

  const loadWeather = async (districtName) => {
    const requestedDistrict = districtName?.trim() || defaultLocation.districtName;
    setLoading(true);
    setSpeechNote("");
    try {
      const resolvedLocation = currentCoords.districtName?.toLowerCase() !== requestedDistrict.toLowerCase() ? await resolveDistrict(requestedDistrict) : currentCoords;
      setSelectedLocation({ districtName: resolvedLocation.districtName || requestedDistrict, lat: resolvedLocation.lat, lng: resolvedLocation.lng });
      const weatherResponse = await axiosInstance.get(`/weather/${resolvedLocation.lat}/${resolvedLocation.lng}`);
      const payload = weatherResponse.data.weather;
      setWeather(payload);
      const riskResponse = await axiosInstance.post("/risk/score", { lat: resolvedLocation.lat, lng: resolvedLocation.lng, district: requestedDistrict, weatherData: payload });
      setRisk({ riskScore: riskResponse.data.riskScore, riskLevel: riskResponse.data.riskLevel, dominantWeatherCondition: riskResponse.data.dominantWeatherCondition });
      setAdvisoryText(buildLocalAdvisory({ district: requestedDistrict, riskLevel: riskResponse.data.riskLevel, weather: payload, advisoryLanguage, crop, growthStage }));
    } catch (error) {
      setSpeechNote(error.response?.data?.message || error.message || "Unable to load district weather");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWeather(selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    setAdvisoryText(advisoryCache[currentAdvisoryCacheKey] || buildLocalAdvisory({ district: selectedDistrict, riskLevel: risk.riskLevel, weather, advisoryLanguage, crop, growthStage }));
  }, [activeTab, selectedDistrict, risk.riskLevel, weather, advisoryLanguage, advisoryCache, currentAdvisoryCacheKey, crop, growthStage]);

  const advisorySource = "farmer";

  const getAdvisory = async (language = advisoryLanguage) => {
    setAdvisoryLoading(true);
    setSpeechNote("");
    try {
      const { data } = await axiosInstance.post("/ai/advisory", {
        district: selectedDistrict,
        weatherData: weather,
        riskLevel: risk.riskLevel,
        userType: "farmer",
        crop,
        growthStage,
        language
      });
      setAdvisoryCache((currentCache) => ({ ...currentCache, [advisoryCacheKey(selectedDistrict, language, crop, growthStage)]: data.advisory }));
      setAdvisoryText(data.advisory);
    } catch (error) {
      setSpeechNote(error.response?.data?.message || "Unable to fetch advisory");
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const handleAdvisoryLanguageToggle = () => {
    const nextLanguage = advisoryLanguage === "en" ? "te" : "en";
    setAdvisoryLanguage(nextLanguage);
    const cachedAdvisory = advisoryCache[advisoryCacheKey(selectedDistrict, nextLanguage, crop, growthStage)];
    setAdvisoryText(cachedAdvisory || buildLocalAdvisory({ district: selectedDistrict, riskLevel: risk.riskLevel, weather, advisoryLanguage: nextLanguage, crop, growthStage }));
    if (!cachedAdvisory) {
      void getAdvisory(nextLanguage);
    }
  };

  const mapDistricts = districts.map((item) => ({ ...item, riskLevel: item.name === selectedDistrict ? risk.riskLevel : "Green" }));

  const severityByField = {
    temperature_2m: weather?.current?.temperature_2m > 42 ? "high" : "normal",
    relative_humidity_2m: weather?.current?.relative_humidity_2m > 85 ? "high" : "normal",
    precipitation_sum: weather?.current?.precipitation_sum > 100 ? "high" : "normal",
    windspeed_10m: weather?.current?.windspeed_10m > 60 ? "high" : "normal"
  };

  const handleGenerateFloodEvidenceReport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString();
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
    doc.text("Flood Evidence Report", 15, 40);

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
    <main className="dashboard-page farmer-dashboard-page">
      <section className="dashboard-topbar farmer-topbar">
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
        <select className="dark-select" value={crop} onChange={(event) => setCrop(event.target.value)}>
          {cropOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select className="dark-select" value={growthStage} onChange={(event) => setGrowthStage(event.target.value)}>
          {growthStageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button className={`toggle-btn ${advisoryLanguage === "te" ? "active" : ""}`} onClick={handleAdvisoryLanguageToggle}>{advisoryLanguage === "en" ? "English / తెలుగు" : "తెలుగు / English"}</button>
      </section>

      {speechNote ? <div className="offline-banner">{speechNote}</div> : null}
      <ClaimAlertBanner riskLevel={risk.riskLevel} onGenerateReport={handleGenerateFloodEvidenceReport} />

      <section className="dashboard-grid">
        <div className="map-column panel">
          {loading ? <div className="spinner-box"><div className="spinner" /></div> : <MapView districts={mapDistricts} center={[selectedLocation.lat, selectedLocation.lng]} zoom={11} selectedDistrict={selectedDistrict} />}
        </div>
        <div className="info-column">
          <WeatherCards weather={weather?.current} severityByField={severityByField} />
          <RiskBadge riskLevel={risk.riskLevel} riskScore={risk.riskScore} />
          <div className="action-row">
            <button className="btn btn-primary full-width farmer-primary" onClick={getAdvisory} disabled={advisoryLoading}>{advisoryLoading ? "Generating..." : "Get AI Advisory"}</button>
            <button className="btn btn-secondary full-width" onClick={toggleSpeech}>{speaking ? "⏸ Stop" : "🔊 Listen to Advisory"}</button>
          </div>
          <AdvisoryBox loading={advisoryLoading} advisory={advisoryText} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TrendChart historical={weather?.historical ?? []} forecast={weather?.forecast ?? []} />
          <div className="detail-line">Crop: {crop} | Stage: {growthStage}</div>
          <div className="detail-line">Dominant condition: {risk.dominantWeatherCondition}</div>
        </div>
      </section>
    </main>
  );
}