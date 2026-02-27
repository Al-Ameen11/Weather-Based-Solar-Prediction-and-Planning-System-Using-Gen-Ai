const { fetchForecast, getForecastUsageAlerts } = require('../services/solarService');

async function getWeatherForecast(req, res) {
  try {
    const { lat, lon } = req.query;
    const rawList = await fetchForecast(lat, lon);

    const forecast = rawList.filter((item, index) => index % 8 === 0).map((item) => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      temp: item.main.temp,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      clouds: item.clouds.all,
      windSpeed: item.wind.speed
    }));

    const usageAlerts = req.user ? getForecastUsageAlerts(rawList) : [];
    return res.json({
      forecast,
      usageAlerts,
      authMessage: req.user ? null : 'Sign in to unlock smart appliance alerts.'
    });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    return res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
}

module.exports = { getWeatherForecast };
