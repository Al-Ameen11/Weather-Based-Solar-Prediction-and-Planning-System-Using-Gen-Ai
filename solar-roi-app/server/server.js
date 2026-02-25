const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuration - Replace with your actual API keys
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000/predict';

// Local JSON file storage (no MongoDB required)
const dataDir = path.join(__dirname, 'data');
const predictionsFile = path.join(dataDir, 'predictions.json');

// Solar subsidy data for Indian states (example data)
const subsidyData = {
  'Tamil Nadu': { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Karnataka: { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  Maharashtra: { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  Gujarat: { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Rajasthan: { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Default: { subsidy: 30, maxAmount: 30000, description: 'Average 30% subsidy available' }
};

function ensureDataStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(predictionsFile)) {
    fs.writeFileSync(predictionsFile, '[]', 'utf-8');
  }
}

function loadPredictions() {
  ensureDataStore();

  try {
    const content = fs.readFileSync(predictionsFile, 'utf-8');
    const records = JSON.parse(content);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Failed to read predictions store:', error.message);
    return [];
  }
}

function savePrediction(record) {
  const records = loadPredictions();
  records.unshift(record);

  // Keep only latest 100 records
  const trimmed = records.slice(0, 100);
  fs.writeFileSync(predictionsFile, JSON.stringify(trimmed, null, 2), 'utf-8');
}

function getSolarOutputCategory(annualGeneration) {
  if (annualGeneration >= 6500) {
    return 'High';
  }

  if (annualGeneration >= 3500) {
    return 'Medium';
  }

  return 'Low';
}

function getApplianceRecommendations(outputCategory) {
  const base = {
    High: [
      'Run high-consumption appliances (AC, washing machine, water heater) during peak daylight hours.',
      'Consider EV charging between 10 AM and 3 PM to maximize solar self-consumption.',
      'Evaluate adding battery backup for evening load shifting.'
    ],
    Medium: [
      'Prioritize daytime usage for medium-load appliances like washing machine and fridge defrost cycles.',
      'Use smart plugs/timers to stagger appliance use and reduce grid dependency.',
      'Target 60-70% self-consumption by aligning usage with sunlight availability.'
    ],
    Low: [
      'Use solar power primarily for essential daytime appliances such as lights, fans, and laptop charging.',
      'Improve efficiency first (LEDs, inverter appliances) before expanding solar capacity.',
      'Consider rooftop maintenance and orientation adjustments to improve output.'
    ]
  };

  return base[outputCategory] || base.Medium;
}

async function getAiExplanation(contextPayload) {
  const {
    location,
    annualGeneration,
    outputCategory,
    paybackPeriod,
    annualSavings,
    systemSizeKW
  } = contextPayload;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return `For ${location}, your ${systemSizeKW} kW solar system is expected to deliver about ${annualGeneration} kWh/year (${outputCategory} output). With yearly savings near ₹${annualSavings}, your estimated payback is ${paybackPeriod} years. This indicates a practical long-term investment if daytime usage is optimized.`;
  }

  const prompt = `Explain the following solar prediction in plain language for a homeowner in 3-4 lines.\nLocation: ${location}\nSystem size: ${systemSizeKW} kW\nEstimated annual generation: ${annualGeneration} kWh (${outputCategory})\nAnnual savings: ₹${annualSavings}\nPayback period: ${paybackPeriod} years\nKeep it practical and encouraging.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Solar results are ready. Consider reviewing appliance usage timing to maximize savings.';
  } catch (error) {
    console.error('Gemini explanation failed:', error.message);
    return `For ${location}, your ${systemSizeKW} kW solar system is expected to generate about ${annualGeneration} kWh/year (${outputCategory} output), with savings of around ₹${annualSavings} per year and payback in ${paybackPeriod} years.`;
  }
}

async function getMlSolarPrediction(temperature, cloudPercent) {
  // Convert cloud cover to a rough irradiation factor in [0, 1.5]
  const irradiation = Math.max(0, Math.min(1.5, (100 - cloudPercent) / 100));

  try {
    const mlResponse = await axios.post(
      ML_SERVICE_URL,
      {
        temperature,
        irradiation
      },
      { timeout: 6000 }
    );

    return {
      source: 'ml-service',
      irradiation,
      predictedKw: mlResponse.data?.predicted_ac_power_kw || 0
    };
  } catch (error) {
    console.warn('ML prediction service unavailable, using fallback heuristic:', error.message);

    // Fallback heuristic using irradiation and temperature
    const temperatureFactor = Math.max(0.6, 1 - Math.abs(temperature - 30) * 0.01);
    const predictedKw = Number((irradiation * 4.5 * temperatureFactor).toFixed(3));

    return {
      source: 'heuristic-fallback',
      irradiation,
      predictedKw
    };
  }
}

// Calculate solar ROI
app.post('/api/calculate-roi', async (req, res) => {
  try {
    const { location, monthlyBill } = req.body;

    if (!location || !monthlyBill || Number(monthlyBill) <= 0) {
      return res.status(400).json({ error: 'location and monthlyBill are required' });
    }

    // Get weather data
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const weatherData = weatherResponse.data;
    const state = weatherData.sys.country === 'IN' ? location.split(',')[0].trim() : 'Default';

    // Calculate system size based on monthly bill
    // Assumption: ₹6 per unit, average 5 units per day per kW
    const monthlyUnits = monthlyBill / 6;
    const dailyUnits = monthlyUnits / 30;
    const systemSizeKW = dailyUnits / 5;

    // Cost calculations
    const costPerKW = 50000; // ₹50,000 per kW
    const totalCost = systemSizeKW * costPerKW;

    // Get subsidy info
    const subsidy = subsidyData[state] || subsidyData.Default;
    const subsidyAmount = Math.min((totalCost * subsidy.subsidy) / 100, subsidy.maxAmount);
    const netCost = totalCost - subsidyAmount;

    // Calculate savings
    const annualSavings = monthlyBill * 12 * 0.9; // 90% of current bill
    const paybackPeriod = netCost / annualSavings;
    const twentyYearSavings = (annualSavings * 20) - netCost;

    // ML + weather-based generation
    const cloudPercent = weatherData.clouds?.all ?? 40;
    const mlPrediction = await getMlSolarPrediction(weatherData.main.temp, cloudPercent);

    // Solar generation estimation (combines system sizing + weather signal)
    const avgSunHours = 5;
    const baseAnnualGeneration = systemSizeKW * avgSunHours * 365;
    const weatherFactor = Math.max(0.75, Math.min(1.15, mlPrediction.predictedKw / 4.0));
    const annualGeneration = baseAnnualGeneration * weatherFactor;
    const outputCategory = getSolarOutputCategory(annualGeneration);

    const explanation = await getAiExplanation({
      location: weatherData.name,
      annualGeneration: annualGeneration.toFixed(0),
      outputCategory,
      paybackPeriod: paybackPeriod.toFixed(1),
      annualSavings: annualSavings.toFixed(0),
      systemSizeKW: systemSizeKW.toFixed(2)
    });

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      location: weatherData.name,
      input: {
        location,
        monthlyBill: Number(monthlyBill)
      },
      prediction: {
        systemSizeKW: Number(systemSizeKW.toFixed(2)),
        annualGeneration: Number(annualGeneration.toFixed(0)),
        outputCategory,
        paybackPeriod: Number(paybackPeriod.toFixed(1)),
        annualSavings: Number(annualSavings.toFixed(0))
      }
    };

    savePrediction(record);

    res.json({
      location: weatherData.name,
      state,
      weatherData: {
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        cloudPercent,
        description: weatherData.weather[0].description,
        coordinates: weatherData.coord
      },
      solarROI: {
        systemSizeKW: systemSizeKW.toFixed(2),
        totalCost: totalCost.toFixed(0),
        subsidyPercent: subsidy.subsidy,
        subsidyAmount: subsidyAmount.toFixed(0),
        netCost: netCost.toFixed(0),
        annualSavings: annualSavings.toFixed(0),
        paybackPeriod: paybackPeriod.toFixed(1),
        twentyYearSavings: twentyYearSavings.toFixed(0),
        annualGeneration: annualGeneration.toFixed(0),
        outputCategory,
        co2Offset: (annualGeneration * 0.82 / 1000).toFixed(2)
      },
      mlPrediction,
      subsidy,
      aiExplanation: explanation,
      applianceRecommendations: getApplianceRecommendations(outputCategory),
      recommendation: {
        recommended: paybackPeriod < 8,
        message: paybackPeriod < 8
          ? 'Highly recommended! Great ROI potential.'
          : 'Consider solar for long-term savings and environmental benefits.'
      }
    });
  } catch (error) {
    console.error('Error calculating ROI:', error.message);
    res.status(500).json({ error: 'Failed to calculate ROI. Please check the location.' });
  }
});

// Fetch last predictions from local JSON store
app.get('/api/predictions', (req, res) => {
  const records = loadPredictions();
  res.json({ count: records.length, records });
});

// Get weather forecast
app.get('/api/weather-forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    // Process forecast data for next 5 days
    const forecast = forecastResponse.data.list.filter((item, index) => index % 8 === 0).map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      temp: item.main.temp,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      clouds: item.clouds.all,
      windSpeed: item.wind.speed
    }));

    res.json({ forecast });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

// Gemini AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    const systemPrompt = 'You are a helpful solar energy advisor. You help users understand solar panel installation, ROI calculations, government subsidies, and make informed decisions about solar energy. Be concise, friendly, and informative.';

    const fullPrompt = context
      ? `Context: User is considering a ${context.systemSizeKW}kW solar system in ${context.location} with a payback period of ${context.paybackPeriod} years.\n\nUser question: ${message}`
      : message;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${fullPrompt}`
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error with Gemini API:', error.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', storage: 'local-json' });
});

app.listen(PORT, () => {
  ensureDataStore();
  console.log(`Server running on port ${PORT}`);
});
