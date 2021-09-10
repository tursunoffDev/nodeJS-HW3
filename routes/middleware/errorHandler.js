const HttpError = require('../../utils/HttpError');

const errorHandler = (err, req, res, next) => {
  if (err) {
    res.status(500).json({ message: err.message });
  }
  next();
};

module.exports = errorHandler;
