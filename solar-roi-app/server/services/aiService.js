const axios = require('axios');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/constants');

async function callGemini(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await axios.post(
    endpoint,
    { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
    {
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function getAiExplanation(contextPayload) {
  const { location, annualGeneration, outputCategory, paybackPeriod, annualSavings, systemSizeKW } = contextPayload;

  const fallback = `For ${location}, your ${systemSizeKW} kW solar system can generate about ${annualGeneration} kWh/year (${outputCategory} output). With yearly savings near ₹${annualSavings}, your estimated payback is ${paybackPeriod} years. Final returns depend on actual tariff and usage behavior.`;

  const prompt = `Explain this to a non-technical homeowner in simple language.\nLocation: ${location}\nSystem size: ${systemSizeKW} kW\nEstimated annual generation: ${annualGeneration} kWh\nCategory: ${outputCategory}\nAnnual savings: ₹${annualSavings}\nPayback: ${paybackPeriod} years\nAlso explain one basic term (kW or on-grid) naturally and add a caution to verify subsidies with official portals.`;

  try {
    return (await callGemini(prompt)) || fallback;
  } catch (error) {
    console.error('Gemini explanation failed:', error.response?.data || error.message);
    return fallback;
  }
}

module.exports = { callGemini, getAiExplanation };
