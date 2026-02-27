const { buildSolarCalculation } = require('../services/solarService');
const { getAiExplanation } = require('../services/aiService');
const { savePrediction } = require('../models/predictionStore');

async function calculateRoi(req, res) {
  try {
    const { location, monthlyBill, systemSizeKW: requestedSystemSize } = req.body;

    if (!location || !monthlyBill || Number(monthlyBill) <= 0) {
      return res.status(400).json({ error: 'location and monthlyBill are required' });
    }

    if (requestedSystemSize !== undefined && (Number(requestedSystemSize) <= 0 || Number(requestedSystemSize) > 100)) {
      return res.status(400).json({ error: 'systemSizeKW must be between 0 and 100' });
    }

    const calc = await buildSolarCalculation({
      location,
      monthlyBill: Number(monthlyBill),
      requestedSystemSize
    });

    const explanation = await getAiExplanation({
      location: calc.location,
      annualGeneration: calc.annualGeneration.toFixed(0),
      outputCategory: calc.outputCategory,
      paybackPeriod: calc.metrics.paybackPeriod.toFixed(1),
      annualSavings: calc.metrics.annualSavings.toFixed(0),
      systemSizeKW: calc.metrics.systemSizeKW.toFixed(2)
    });

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      location: calc.location,
      input: {
        location,
        monthlyBill: Number(monthlyBill),
        systemSizeKW: Number(calc.metrics.systemSizeKW.toFixed(2))
      },
      prediction: {
        systemSizeKW: Number(calc.metrics.systemSizeKW.toFixed(2)),
        recommendedSystemSizeKW: Number(calc.metrics.recommendedSystemSizeKW.toFixed(2)),
        annualGeneration: Number(calc.annualGeneration.toFixed(0)),
        outputCategory: calc.outputCategory,
        paybackPeriod: Number(calc.metrics.paybackPeriod.toFixed(1)),
        annualSavings: Number(calc.metrics.annualSavings.toFixed(0)),
        roiPercent: Number(calc.metrics.roiPercent.toFixed(1)),
        co2Offset: Number(calc.metrics.co2Offset.toFixed(2))
      }
    };

    await savePrediction(record);

    return res.json({
      location: calc.location,
      state: calc.state,
      weatherData: {
        temp: calc.weatherData.main.temp,
        humidity: calc.weatherData.main.humidity,
        cloudPercent: calc.weatherData.clouds?.all ?? 0,
        description: calc.weatherData.weather[0].description,
        coordinates: calc.weatherData.coord
      },
      solarROI: {
        systemSizeKW: calc.metrics.systemSizeKW.toFixed(2),
        recommendedSystemSizeKW: calc.metrics.recommendedSystemSizeKW.toFixed(2),
        totalCost: calc.metrics.totalCost.toFixed(0),
        subsidyPercent: calc.subsidy.subsidy,
        subsidyAmount: calc.metrics.subsidyAmount.toFixed(0),
        netCost: calc.metrics.netCost.toFixed(0),
        annualSavings: calc.metrics.annualSavings.toFixed(0),
        paybackPeriod: calc.metrics.paybackPeriod.toFixed(1),
        twentyYearSavings: calc.metrics.twentyYearSavings.toFixed(0),
        roiPercent: calc.metrics.roiPercent.toFixed(1),
        annualGeneration: calc.annualGeneration.toFixed(0),
        outputCategory: calc.outputCategory,
        co2Offset: calc.metrics.co2Offset.toFixed(2)
      },
      assumptions: calc.metrics.assumptions,
      mlPrediction: calc.mlPrediction,
      subsidy: calc.subsidy,
      aiExplanation: explanation,
      applianceRecommendations: calc.applianceRecommendations,
      recommendation: {
        recommended: calc.metrics.paybackPeriod < 8,
        message: calc.metrics.paybackPeriod < 8
          ? 'Highly recommended! Great ROI potential.'
          : 'Consider solar for long-term savings and environmental benefits.'
      }
    });
  } catch (error) {
    console.error('Error calculating ROI:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to calculate ROI. Please check the location.' });
  }
}

module.exports = { calculateRoi };
