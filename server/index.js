import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import weatherRoutes from "./routes/weather.js";
import riskRoutes from "./routes/risk.js";
import aiRoutes from "./routes/ai.js";
import userRoutes from "./routes/users.js";
import locationRoutes from "./routes/locations.js";
import alertRoutes from "./routes/alerts.js";
import demoRoutes from "./routes/demo.js";
import geoRoutes from "./routes/geo.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "HydroSentinel server is running" });
});

app.use("/api/weather", weatherRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/geo", geoRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Unexpected server error" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(port, () => {
      console.log(`HydroSentinel server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB Connection Failed', err);
    process.exit(1);
  });
