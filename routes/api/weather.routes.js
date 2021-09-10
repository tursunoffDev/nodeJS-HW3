const express = require('express');
const router = express.Router();
const weatherService = require('./../../service/WeatherService');
const { SUCCESS } = require('../../constants/responseStatuses');
const validateGetWeatherForCity = require('./../validation/weather/getWeatherForCity');

router.get('/', validateGetWeatherForCity, async (req, res, next) => {
  const { city } = req.query;
  try {
    const weatherData = await weatherService.getWeatherByCity(city);

    res.json({ weatherData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
