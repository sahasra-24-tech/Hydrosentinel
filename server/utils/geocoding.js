import { districtsByName } from "../data/districts.js";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const commonHeaders = {
  "User-Agent": "HydroSentinel/1.0",
  "Accept-Language": "en"
};

const pickDistrictName = (address = {}, displayName = "") => {
  return (
    address.district ||
    address.county ||
    address.state_district ||
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.hamlet ||
    displayName.split(",")[0]?.trim() ||
    "Unknown location"
  );
};

const normalizeLocation = (entry) => {
  if (!entry) return null;

  const lat = Number(entry.lat);
  const lng = Number(entry.lon);
  const address = entry.address ?? {};

  return {
    districtName: pickDistrictName(address, entry.display_name),
    displayName: entry.display_name,
    state: address.state || "",
    country: address.country || "India",
    lat,
    lng,
    source: "nominatim"
  };
};

export const resolveDistrictLocation = async (districtName) => {
  const localMatch = districtsByName[districtName?.toLowerCase?.() ?? ""];

  if (localMatch) {
    return {
      districtName: localMatch.name,
      displayName: `${localMatch.name}, ${localMatch.state}, India`,
      state: localMatch.state,
      country: "India",
      lat: localMatch.latitude,
      lng: localMatch.longitude,
      source: "local"
    };
  }

  const searchParams = new URLSearchParams({
    q: districtName,
    countrycodes: "in",
    format: "jsonv2",
    addressdetails: "1",
    limit: "5"
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${searchParams.toString()}`, {
    headers: commonHeaders
  });

  if (!response.ok) {
    throw new Error("Unable to resolve district location");
  }

  const results = await response.json();
  const match = Array.isArray(results) ? results.find((entry) => entry?.address?.country === "India") ?? results[0] : null;

  return normalizeLocation(match);
};

export const reverseGeocodeLocation = async (lat, lng) => {
  const searchParams = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1"
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${searchParams.toString()}`, {
    headers: commonHeaders
  });

  if (!response.ok) {
    throw new Error("Unable to resolve current location");
  }

  const data = await response.json();
  return normalizeLocation(data);
};