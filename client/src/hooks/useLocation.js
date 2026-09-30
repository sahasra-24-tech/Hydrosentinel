import { useState } from "react";
import { resolveCoordinatesLocation, resolveDistrictLocation } from "../lib/geocoding.js";

export function useLocation() {
  const [locationLoading, setLocationLoading] = useState(false);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      throw new Error("Your browser does not support location access. Please search for a district instead.");
    }

    setLocationLoading(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
      });

      return await resolveCoordinatesLocation(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      if (error?.code === 1) {
        throw new Error("Location access was denied. Please choose a district manually.");
      }

      throw new Error(error?.message || "Unable to access your current location. Please choose a district manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const resolveDistrict = async (districtName) => {
    return resolveDistrictLocation(districtName);
  };

  return { getCurrentLocation, resolveDistrict, locationLoading };
}