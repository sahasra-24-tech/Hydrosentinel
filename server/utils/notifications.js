import nodemailer from "nodemailer";
import Alert from "../models/Alert.js";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

const thresholdRank = { Green: 0, Yellow: 1, Orange: 2, Red: 3 };

export const sendAdvisoryEmail = async ({ to, districtName, score, riskLevel }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `HydroSentinel alert for ${districtName}`,
    text: `Risk for ${districtName} is now ${riskLevel} (${score}/100). Please check HydroSentinel for updated guidance.`
  });

  return true;
};

export const dispatchRiskAlerts = async ({ districtName, score, riskLevel }) => {
  const activeAlerts = await Alert.find({ districtName, active: true });
  if (!activeAlerts.length) return;

  for (const alert of activeAlerts) {
    if (thresholdRank[riskLevel] < thresholdRank[alert.threshold]) continue;
    await sendAdvisoryEmail({
      to: alert.email,
      districtName,
      score,
      riskLevel
    });
  }
};
