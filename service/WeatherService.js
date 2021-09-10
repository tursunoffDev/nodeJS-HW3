const axios = require('axios');
const config = require('config');
const { WEATHER_API } = require('../constants/externalApiLinks');
const weatherApiKey = config.get('weatherApiKey');

class WeatherService {
  getWeatherByCity(city) {
    return axios
      .get(`${WEATHER_API}?q=${city}&appid=${weatherApiKey}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err);
      });
  }
}

module.exports = new WeatherService();
