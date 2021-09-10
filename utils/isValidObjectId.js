const mongoose = require('mongoose');

const isValidObjectId = mongoose.Types.ObjectId.isValid;

module.exports = {
  isValidObjectId,
};

