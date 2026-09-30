import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

const colorByRisk = {
  Green: "#22c55e",
  Yellow: "#facc15",
  Orange: "#fb923c",
  Red: "#ef4444"
};

function RecenterMap({ center, zoom = 5 }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(center) || center.length < 2 || center[0] == null || center[1] == null) return;
    map.flyTo([center[0], center[1]], zoom, { duration: 1.2 });
  }, [center, map, zoom]);

  return null;
}

export default function MapView({ districts = [], center, zoom = 5, selectedDistrict }) {
  const mapCenter = Array.isArray(center) && center.length >= 2 ? center : [22.9734, 78.6569];

  return (
    <div className="map-shell">
      <MapContainer center={mapCenter} zoom={zoom} className="map-view">
        <RecenterMap center={center} zoom={zoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {districts.map((district) => {
          const isSelected = selectedDistrict
            ? selectedDistrict.toLowerCase() === district.name.toLowerCase()
            : Array.isArray(center) && center.length >= 2 && Math.abs(district.lat - center[0]) < 0.0001 && Math.abs(district.lng - center[1]) < 0.0001;

          return (
            <CircleMarker
              key={district.name}
              center={[district.lat, district.lng]}
              radius={isSelected ? 13 : 8}
              pathOptions={{ color: colorByRisk[district.riskLevel] ?? "#60a5fa", fillColor: colorByRisk[district.riskLevel] ?? "#60a5fa", fillOpacity: isSelected ? 0.95 : 0.5, opacity: isSelected ? 1 : 0.45, weight: isSelected ? 3 : 1 }}
            >
              <Popup>
                <strong>{district.name}</strong>
                <br />
                Risk: {district.riskLevel}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
