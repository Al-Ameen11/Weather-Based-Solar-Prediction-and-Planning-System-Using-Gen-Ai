const express = require('express');
const { getWeatherForecast } = require('../controllers/forecastController');

const router = express.Router();
router.get('/weather-forecast', getWeatherForecast);

module.exports = router;
