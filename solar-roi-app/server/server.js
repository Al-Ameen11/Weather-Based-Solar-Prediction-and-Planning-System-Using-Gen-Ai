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

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000/predict';

const MONGODB_DATA_API_URL = process.env.MONGODB_DATA_API_URL || '';
const MONGODB_DATA_API_KEY = process.env.MONGODB_DATA_API_KEY || '';
const MONGODB_DATA_SOURCE = process.env.MONGODB_DATA_SOURCE || 'Cluster0';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'solar_roi';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'predictions';

const dataDir = path.join(__dirname, 'data');
const predictionsFile = path.join(dataDir, 'predictions.json');

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

function hasMongoDataApiConfig() {
  return Boolean(MONGODB_DATA_API_URL && MONGODB_DATA_API_KEY);
}

async function callMongoDataApi(action, payload) {
  const endpoint = `${MONGODB_DATA_API_URL.replace(/\/$/, '')}/action/${action}`;

  const response = await axios.post(
    endpoint,
    {
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATABASE,
      collection: MONGODB_COLLECTION,
      ...payload
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_DATA_API_KEY
      },
      timeout: 8000
    }
  );

  return response.data;
}

function loadPredictionsFromFile() {
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

function savePredictionToFile(record) {
  const records = loadPredictionsFromFile();
  records.unshift(record);

  const trimmed = records.slice(0, 100);
  fs.writeFileSync(predictionsFile, JSON.stringify(trimmed, null, 2), 'utf-8');
}

async function loadPredictions() {
  if (!hasMongoDataApiConfig()) {
    return loadPredictionsFromFile();
  }

  try {
    const response = await callMongoDataApi('find', {
      filter: {},
      sort: { createdAt: -1 },
      limit: 100
    });

    return Array.isArray(response.documents) ? response.documents : [];
  } catch (error) {
    console.error('MongoDB read failed, falling back to local JSON:', error.response?.data || error.message);
    return loadPredictionsFromFile();
  }
}

async function savePrediction(record) {
  if (!hasMongoDataApiConfig()) {
    savePredictionToFile(record);
    return;
  }

  try {
    await callMongoDataApi('insertOne', { document: record });
  } catch (error) {
    console.error('MongoDB write failed, falling back to local JSON:', error.response?.data || error.message);
    savePredictionToFile(record);
  }
}

function getSolarOutputCategory(annualGeneration) {
  if (annualGeneration >= 6500) return 'High';
  if (annualGeneration >= 3500) return 'Medium';
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

function extractStateFromLocation(locationInput = '') {
  const parts = String(locationInput)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;
  const candidate = parts[1].replace(/\b(india|in)\b/gi, '').trim();
  return candidate || null;
}

async function getIndianStateFromCoordinates(lat, lon) {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`,
      { timeout: 6000 }
    );

    return response.data?.[0]?.state || null;
  } catch (error) {
    console.warn('Reverse geocoding state lookup failed:', error.message);
    return null;
  }
}

function getForecastUsageAlerts(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return [];
  }

  const upcomingSlots = forecastList.slice(0, 16);
  const highPotentialSlots = upcomingSlots
    .filter((slot) => slot.clouds?.all <= 35)
    .slice(0, 3)
    .map((slot) => ({
      time: new Date(slot.dt * 1000).toLocaleString(),
      cloudPercent: slot.clouds?.all ?? 0,
      temp: slot.main?.temp ?? 0
    }));

  if (highPotentialSlots.length === 0) {
    return [
      {
        level: 'moderate',
        message: 'Cloud cover is moderate/high in the next day. Prioritize essential loads and avoid heavy daytime deferrable usage.'
      }
    ];
  }

  return [
    {
      level: 'high',
      message: 'High solar window detected. Plan high-consumption appliances during these time blocks.',
      windows: highPotentialSlots
    }
  ];
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await axios.post(
    endpoint,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    },
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
  const {
    location,
    annualGeneration,
    outputCategory,
    paybackPeriod,
    annualSavings,
    systemSizeKW
  } = contextPayload;

  const fallback = `For ${location}, your ${systemSizeKW} kW solar system is expected to deliver about ${annualGeneration} kWh/year (${outputCategory} output). With yearly savings near ₹${annualSavings}, your estimated payback is ${paybackPeriod} years. This indicates a practical long-term investment if daytime usage is optimized.`;

  const prompt = `Explain the following solar prediction in plain language for a homeowner in 3-4 lines.
Location: ${location}
System size: ${systemSizeKW} kW
Estimated annual generation: ${annualGeneration} kWh (${outputCategory})
Annual savings: ₹${annualSavings}
Payback period: ${paybackPeriod} years
Include a short caution that final savings depend on tariffs, installation quality, and usage habits.
Keep it practical and encouraging.`;

  try {
    return (await callGemini(prompt)) || fallback;
  } catch (error) {
    console.error('Gemini explanation failed:', error.response?.data || error.message);
    return fallback;
  }
}

async function getMlSolarPrediction(temperature, cloudPercent) {
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

    const temperatureFactor = Math.max(0.6, 1 - Math.abs(temperature - 30) * 0.01);
    const predictedKw = Number((irradiation * 4.5 * temperatureFactor).toFixed(3));

    return {
      source: 'heuristic-fallback',
      irradiation,
      predictedKw
    };
  }
}

app.post('/api/calculate-roi', async (req, res) => {
  try {
    const { location, monthlyBill, systemSizeKW: requestedSystemSize } = req.body;

    if (!location || !monthlyBill || Number(monthlyBill) <= 0) {
      return res.status(400).json({ error: 'location and monthlyBill are required' });
    }

    if (requestedSystemSize !== undefined && (Number(requestedSystemSize) <= 0 || Number(requestedSystemSize) > 100)) {
      return res.status(400).json({ error: 'systemSizeKW must be between 0 and 100' });
    }

    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const weatherData = weatherResponse.data;

    let state = 'Default';
    if (weatherData.sys.country === 'IN') {
      const reverseState = await getIndianStateFromCoordinates(weatherData.coord.lat, weatherData.coord.lon);
      state = reverseState || extractStateFromLocation(location) || 'Default';
    }

    const monthlyUnits = monthlyBill / 6;
    const dailyUnits = monthlyUnits / 30;
    const recommendedSystemSizeKW = dailyUnits / 5;
    const systemSizeKW = requestedSystemSize ? Number(requestedSystemSize) : recommendedSystemSizeKW;

    const costPerKW = 50000;
    const totalCost = systemSizeKW * costPerKW;

    const subsidy = subsidyData[state] || subsidyData.Default;
    const subsidyAmount = Math.min((totalCost * subsidy.subsidy) / 100, subsidy.maxAmount);
    const netCost = totalCost - subsidyAmount;

    const systemCoverageFactor = Math.max(0.35, Math.min(1, systemSizeKW / recommendedSystemSizeKW));
    const annualSavings = monthlyBill * 12 * 0.9 * systemCoverageFactor;
    const paybackPeriod = netCost / annualSavings;
    const twentyYearSavings = (annualSavings * 20) - netCost;
    const roiPercent = netCost > 0 ? (twentyYearSavings / netCost) * 100 : 0;

    const cloudPercent = weatherData.clouds?.all ?? 40;
    const mlPrediction = await getMlSolarPrediction(weatherData.main.temp, cloudPercent);

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

    const assumptions = {
      costPerKW,
      avgSunHours,
      tariffPerUnit: 6,
      savingsFactor: 0.9,
      subsidyDisclaimer: 'Subsidy schemes vary by policy updates and may change over time. Verify with official state and MNRE portals before purchase.'
    };

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      location: weatherData.name,
      input: {
        location,
        monthlyBill: Number(monthlyBill),
        systemSizeKW: Number(systemSizeKW.toFixed(2))
      },
      prediction: {
        systemSizeKW: Number(systemSizeKW.toFixed(2)),
        recommendedSystemSizeKW: Number(recommendedSystemSizeKW.toFixed(2)),
        annualGeneration: Number(annualGeneration.toFixed(0)),
        outputCategory,
        paybackPeriod: Number(paybackPeriod.toFixed(1)),
        annualSavings: Number(annualSavings.toFixed(0)),
        roiPercent: Number(roiPercent.toFixed(1))
      }
    };

    await savePrediction(record);

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
        recommendedSystemSizeKW: recommendedSystemSizeKW.toFixed(2),
        totalCost: totalCost.toFixed(0),
        subsidyPercent: subsidy.subsidy,
        subsidyAmount: subsidyAmount.toFixed(0),
        netCost: netCost.toFixed(0),
        annualSavings: annualSavings.toFixed(0),
        paybackPeriod: paybackPeriod.toFixed(1),
        twentyYearSavings: twentyYearSavings.toFixed(0),
        roiPercent: roiPercent.toFixed(1),
        annualGeneration: annualGeneration.toFixed(0),
        outputCategory,
        co2Offset: (annualGeneration * 0.82 / 1000).toFixed(2)
      },
      mlPrediction,
      subsidy,
      assumptions,
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
    console.error('Error calculating ROI:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to calculate ROI. Please check the location.' });
  }
});

app.get('/api/predictions', async (req, res) => {
  const records = await loadPredictions();
  res.json({ count: records.length, records });
});

app.get('/api/weather-forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const rawList = forecastResponse.data.list || [];
    const forecast = rawList.filter((item, index) => index % 8 === 0).map((item) => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      temp: item.main.temp,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      clouds: item.clouds.all,
      windSpeed: item.wind.speed
    }));

    const usageAlerts = getForecastUsageAlerts(rawList);

    res.json({ forecast, usageAlerts });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const systemPrompt = 'You are a helpful solar energy advisor. You help users understand solar panel installation, ROI calculations, government subsidies, and informed decisions about clean energy. Keep responses concise, practical, and friendly. Always add a short disclaimer that estimates and subsidies should be verified with local installer quotes and government portals.';

    const fullPrompt = context
      ? `Context: User is considering a ${context.systemSizeKW}kW solar system in ${context.location} with a payback period of ${context.paybackPeriod} years.\n\nUser question: ${message}`
      : `User question: ${message}`;

    const aiResponse = await callGemini(`${systemPrompt}\n\n${fullPrompt}`);

    if (!aiResponse) {
      return res.json({
        response: 'I can help with solar sizing, ROI, subsidy eligibility, and installation planning. Add your GEMINI_API_KEY in the server environment to enable real-time Gemini answers. Please verify final costs and subsidies with local installers and official government portals.'
      });
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error with Gemini API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    storage: hasMongoDataApiConfig() ? 'mongodb-data-api' : 'local-json-fallback',
    geminiModel: GEMINI_MODEL
  });
});

app.listen(PORT, () => {
  ensureDataStore();
  console.log(`Server running on port ${PORT}`);
  if (hasMongoDataApiConfig()) {
    console.log('MongoDB integration enabled via Data API.');
  } else {
    console.warn('MongoDB Data API env vars are missing; using local JSON fallback storage.');
  }
});
