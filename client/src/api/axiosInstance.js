import axios from "axios";
import { BASE_URL } from "./config.js";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("hydrosentinel_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
