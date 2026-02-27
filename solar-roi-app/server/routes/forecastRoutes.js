const express = require('express');
const { getWeatherForecast } = require('../controllers/forecastController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/weather-forecast', optionalAuth, getWeatherForecast);

module.exports = router;
