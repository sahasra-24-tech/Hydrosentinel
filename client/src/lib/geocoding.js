import axiosInstance from "../api/axiosInstance.js";

const unwrapLocation = (data) => {
  if (!data?.location) {
    throw new Error("No data available for the selected district");
  }

  return data.location;
};

export const resolveDistrictLocation = async (districtName) => {
  const response = await axiosInstance.get("/geo/resolve", {
    params: { district: districtName }
  });

  return unwrapLocation(response.data);
};

export const resolveCoordinatesLocation = async (lat, lng) => {
  const response = await axiosInstance.get("/geo/resolve", {
    params: { lat, lng }
  });

  return unwrapLocation(response.data);
};