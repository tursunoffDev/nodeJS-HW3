const mongoose = require('mongoose');
const User = require('./user.model');
const {SHIPPER} = require('../constants/userRoles');

const shipperSpecificSchema = new mongoose.Schema({
  createdLoads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
  }],
});

const Shipper = User.discriminator(SHIPPER, shipperSpecificSchema);

module.exports = Shipper;
