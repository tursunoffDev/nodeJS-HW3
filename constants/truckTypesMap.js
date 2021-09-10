const {SPRINTER, SMALL_STRAIGHT, LARGE_STRAIGHT} = require('./truckTypes');

module.exports = {
  [SPRINTER]: {
    dimensions: {
      width: 250,
      height: 170,
      length: 300,
    },
    maxPayload: 1700,
  },
  [SMALL_STRAIGHT]: {
    dimensions: {
      width: 250,
      height: 170,
      length: 500,
    },
    maxPayload: 2500,
  },
  [LARGE_STRAIGHT]: {
    dimensions: {
      width: 350,
      height: 200,
      length: 700,
    },
    maxPayload: 4000,
  },
};
