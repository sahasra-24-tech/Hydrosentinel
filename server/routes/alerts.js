import { Router } from "express";
import Alert from "../models/Alert.js";
import { sendAdvisoryEmail } from "../utils/notifications.js";

const router = Router();

router.post("/subscribe", async (req, res) => {
  try {
    const { email, district, threshold, lat, lng } = req.body;
    if (!email || !district || !threshold || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "email, district, threshold, lat and lng are required" });
    }

    const alert = await Alert.create({
      email: email.toLowerCase(),
      districtName: district,
      threshold,
      lat,
      lng,
      active: true
    });

    await sendAdvisoryEmail({
      to: email,
      districtName: district,
      score: 0,
      riskLevel: "Green"
    }).catch(() => null);

    return res.status(201).json({ success: true, alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to subscribe to alerts" });
  }
});

export default router;
