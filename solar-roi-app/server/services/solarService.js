const axios = require('axios');
const { OPENWEATHER_API_KEY, ML_SERVICE_URL } = require('../config/constants');

const subsidyData = {
  'Tamil Nadu': { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Karnataka: { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  Maharashtra: { subsidy: 30, maxAmount: 30000, description: 'Up to 30% subsidy on solar panel installation' },
  Gujarat: { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Rajasthan: { subsidy: 40, maxAmount: 40000, description: 'Up to 40% subsidy on solar panel installation' },
  Default: { subsidy: 30, maxAmount: 30000, description: 'Average 30% subsidy available' }
};

function extractStateFromLocation(locationInput = '') {
  const parts = String(locationInput).split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const candidate = parts[1].replace(/\b(india|in)\b/gi, '').trim();
  return candidate || null;
}

async function getIndianStateFromCoordinates(lat, lon) {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') return null;

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

function getForecastUsageAlerts(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) return [];

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
        level: 'efficiency-mode',
        message: 'Cloudy/monsoon-like conditions expected. Use grid-saving mode and defer heavy appliance usage.'
      }
    ];
  }

  return [{
    level: 'high-solar-window',
    message: 'High solar window detected. Run heavy appliances in the following periods for maximum free solar usage.',
    windows: highPotentialSlots
  }];
}

async function getMlSolarPrediction(temperature, cloudPercent) {
  const irradiation = Math.max(0, Math.min(1.5, (100 - cloudPercent) / 100));

  try {
    const mlResponse = await axios.post(ML_SERVICE_URL, { temperature, irradiation }, { timeout: 6000 });
    return { source: 'ml-service', irradiation, predictedKw: mlResponse.data?.predicted_ac_power_kw || 0 };
  } catch (error) {
    console.warn('ML prediction service unavailable, using fallback heuristic:', error.message);
    const temperatureFactor = Math.max(0.6, 1 - Math.abs(temperature - 30) * 0.01);
    const predictedKw = Number((irradiation * 4.5 * temperatureFactor).toFixed(3));
    return { source: 'heuristic-fallback', irradiation, predictedKw };
  }
}

async function fetchCurrentWeather(location) {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
  );
  return response.data;
}

async function fetchForecast(lat, lon) {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
  );
  return response.data.list || [];
}

async function buildSolarCalculation({ location, monthlyBill, requestedSystemSize }) {
  const weatherData = await fetchCurrentWeather(location);

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

  return {
    location: weatherData.name,
    state,
    weatherData,
    subsidy,
    mlPrediction,
    annualGeneration,
    outputCategory,
    metrics: {
      systemSizeKW,
      recommendedSystemSizeKW,
      totalCost,
      subsidyAmount,
      netCost,
      annualSavings,
      paybackPeriod,
      twentyYearSavings,
      roiPercent,
      co2Offset: annualGeneration * 0.82 / 1000,
      assumptions: {
        costPerKW,
        avgSunHours,
        tariffPerUnit: 6,
        savingsFactor: 0.9,
        subsidyDisclaimer: 'Subsidy schemes vary by policy updates and may change over time. Verify with official state and MNRE portals before purchase.'
      }
    },
    applianceRecommendations: getApplianceRecommendations(outputCategory)
  };
}

async function buildExistingUserOperationalView(input) {
  const calc = await buildSolarCalculation(input);
  const rawForecast = await fetchForecast(calc.weatherData.coord.lat, calc.weatherData.coord.lon);

  const tomorrowSlot = rawForecast.find((slot) => slot.dt_txt?.includes('12:00:00')) || rawForecast[0];
  const tomorrowCloud = tomorrowSlot?.clouds?.all ?? 50;
  const tomorrowTemp = tomorrowSlot?.main?.temp ?? calc.weatherData.main.temp;
  const tomorrowMl = await getMlSolarPrediction(tomorrowTemp, tomorrowCloud);

  const tomorrowGenerationKwh = Number((calc.metrics.systemSizeKW * Math.max(3, 6 - (tomorrowCloud / 30)) * 0.9).toFixed(2));
  const usageAlerts = getForecastUsageAlerts(rawForecast);

  return {
    calc,
    tomorrowForecast: {
      date: tomorrowSlot ? new Date(tomorrowSlot.dt * 1000).toLocaleDateString() : 'N/A',
      cloudPercent: tomorrowCloud,
      temperature: tomorrowTemp,
      estimatedGenerationKwh: tomorrowGenerationKwh,
      mlSignalKw: tomorrowMl.predictedKw,
      efficiencyGuidance: tomorrowCloud > 65
        ? 'Cloudy/monsoon risk: run in grid-saving mode and avoid simultaneous heavy loads.'
        : 'Good solar day expected: schedule heavy appliances in daylight windows.'
    },
    usageAlerts
  };
}

module.exports = {
  buildSolarCalculation,
  buildExistingUserOperationalView,
  fetchForecast,
  getForecastUsageAlerts
};
