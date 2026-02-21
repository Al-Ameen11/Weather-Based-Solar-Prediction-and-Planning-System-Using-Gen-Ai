const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuration - Replace with your actual API keys
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

// Solar subsidy data for Indian states (example data)
const subsidyData = {
  'Tamil Nadu': { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  'Karnataka': { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  'Maharashtra': { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  'Gujarat': { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  'Rajasthan': { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  'Default': { subsidy: 30, maxAmount: 30000, description: 'Average 30% subsidy available' }
};

// Calculate solar ROI
app.post('/api/calculate-roi', async (req, res) => {
  try {
    const { location, monthlyBill } = req.body;

    // Get weather data
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const weatherData = weatherResponse.data;
    const state = weatherData.sys.country === 'IN' ? location.split(',')[0] : 'Default';
    
    // Calculate system size based on monthly bill
    // Assumption: ₹6 per unit, average 5 units per day per kW
    const monthlyUnits = monthlyBill / 6;
    const dailyUnits = monthlyUnits / 30;
    const systemSizeKW = dailyUnits / 5;
    
    // Cost calculations
    const costPerKW = 50000; // ₹50,000 per kW
    const totalCost = systemSizeKW * costPerKW;
    
    // Get subsidy info
    const subsidy = subsidyData[state] || subsidyData['Default'];
    const subsidyAmount = Math.min((totalCost * subsidy.subsidy) / 100, subsidy.maxAmount);
    const netCost = totalCost - subsidyAmount;
    
    // Calculate savings
    const annualSavings = monthlyBill * 12 * 0.9; // 90% of current bill
    const paybackPeriod = netCost / annualSavings;
    const twentyYearSavings = (annualSavings * 20) - netCost;
    
    // Solar generation estimation (simplified)
    const avgSunHours = 5; // Average for India
    const annualGeneration = systemSizeKW * avgSunHours * 365;
    
    res.json({
      location: weatherData.name,
      state: state,
      weatherData: {
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
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
        co2Offset: (annualGeneration * 0.82 / 1000).toFixed(2) // tons per year
      },
      subsidy: subsidy,
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

    const systemPrompt = `You are a helpful solar energy advisor. You help users understand solar panel installation, ROI calculations, government subsidies, and make informed decisions about solar energy. Be concise, friendly, and informative.`;

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
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});