import { Router } from "express";

const router = Router();

router.post("/advisory", async (req, res) => {
  try {
    const { district, weatherData, riskLevel, userType, language, crop, growthStage } = req.body;

    if (!district || !weatherData || !riskLevel || !userType) {
      return res.status(400).json({ message: "district, weatherData, riskLevel and userType are required" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      const cropSuffixTe = crop && growthStage ? ` ${crop} పంటకు ${growthStage} దశలో` : "";
      const cropSuffixEn = crop && growthStage ? ` for ${crop} during ${growthStage}` : "";
      const fallbackAdvisory = language === "te"
        ? `${district}${cropSuffixTe}: వాతావరణ పరిస్థితులను దగ్గరగా గమనించండి. నీటి మట్టం పెరిగితే సురక్షిత ప్రదేశానికి వెళ్లండి. విలువైన వస్తువులను రక్షించండి మరియు అవసరం లేని ప్రయాణాన్ని నివారించండి. అధికారిక హెచ్చరికలను అనుసరించండి.`
        : `Weather advisory for ${district}${cropSuffixEn}: Keep monitoring conditions closely. Move to safer ground if water rises. Protect valuables and avoid unnecessary travel. Stay updated with official alerts.`;

      return res.json({
        success: true,
        advisory: fallbackAdvisory,
        fallback: true
      });
    }

    const cropContext = crop && growthStage ? `The user is growing ${crop} and is currently in the ${growthStage} stage.` : "Crop and growth stage were not provided.";
    const prompt = language === "te"
      ? `You are a weather advisory system for India. Based on this weather data: ${JSON.stringify(weatherData)} and risk level: ${riskLevel}, give specific advice for a ${userType} in ${district}. ${cropContext} If userType is farmer, give crop and field related advice. If userType is general public, give health and safety advice. Respond entirely in Telugu (తెలుగు), with no English text, and keep the advice to 4-5 concise lines.`
      : `You are a weather advisory system for India. Based on this weather data: ${JSON.stringify(weatherData)} and risk level: ${riskLevel}, give specific advice for a ${userType} in ${district}. ${cropContext} If userType is farmer, give crop and field related advice. If userType is general public, give health and safety advice. Keep advice to 4-5 lines in simple English.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error("Anthropic API request failed");
    }

    const data = await response.json();
    const advisory = data?.content?.map((block) => block.text).join("\n").trim() || "No advisory returned.";

    return res.json({ success: true, advisory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to generate advisory" });
  }
});

export default router;
