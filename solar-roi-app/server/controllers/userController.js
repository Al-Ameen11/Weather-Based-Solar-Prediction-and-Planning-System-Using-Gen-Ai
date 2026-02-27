const { loadPredictions } = require('../models/predictionStore');
const { buildExistingUserOperationalView } = require('../services/solarService');
const { getAiExplanation } = require('../services/aiService');

async function getExistingUserDashboard(req, res) {
  try {
    const { location, monthlyBill, systemSizeKW } = req.query;

    if (!location || !monthlyBill) {
      return res.status(400).json({ error: 'location and monthlyBill are required' });
    }

    const operational = await buildExistingUserOperationalView({
      location,
      monthlyBill: Number(monthlyBill),
      requestedSystemSize: systemSizeKW ? Number(systemSizeKW) : undefined
    });

    const explainer = await getAiExplanation({
      location: operational.calc.location,
      annualGeneration: operational.calc.annualGeneration.toFixed(0),
      outputCategory: operational.calc.outputCategory,
      paybackPeriod: operational.calc.metrics.paybackPeriod.toFixed(1),
      annualSavings: operational.calc.metrics.annualSavings.toFixed(0),
      systemSizeKW: operational.calc.metrics.systemSizeKW.toFixed(2)
    });

    return res.json({
      profile: {
        location: operational.calc.location,
        monthlyBill: Number(monthlyBill),
        systemSizeKW: Number(operational.calc.metrics.systemSizeKW.toFixed(2))
      },
      roiStatus: {
        paybackPeriod: operational.calc.metrics.paybackPeriod.toFixed(1),
        roiPercent: operational.calc.metrics.roiPercent.toFixed(1),
        annualSavings: operational.calc.metrics.annualSavings.toFixed(0),
        co2Offset: operational.calc.metrics.co2Offset.toFixed(2)
      },
      tomorrowForecast: operational.tomorrowForecast,
      usageAlerts: operational.usageAlerts,
      aiAdvisorSummary: explainer
    });
  } catch (error) {
    console.error('Error loading existing user dashboard:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to load existing user dashboard' });
  }
}

function getSolarGlossary(req, res) {
  return res.json({
    terms: [
      { term: 'kW', meaning: 'kW (kilowatt) is your system power capacity—higher kW means panels can produce more power at a time.' },
      { term: 'On-grid', meaning: 'On-grid means your solar system is connected to the electricity grid and can use grid power when solar is low.' },
      { term: 'ROI', meaning: 'ROI is how much money you gain back over time compared to what you invest in solar.' }
    ]
  });
}

async function getLatestRoiStatus(req, res) {
  const records = await loadPredictions();
  if (!records.length) return res.json({ exists: false });
  return res.json({ exists: true, latest: records[0] });
}

module.exports = { getExistingUserDashboard, getSolarGlossary, getLatestRoiStatus };
