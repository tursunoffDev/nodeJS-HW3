const mongoose = require('mongoose');
const {
  handleTruckCollectionUpdated,
} = require('../jobs/handleTruckCollectionUpdated');
const {OL, IS} = require('../constants/truckStatuses');
const {DRIVER} = require('../constants/userRoles');

const truckSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [IS, OL],
  },
  name: String,
  type: String,
  dimensions: {
    width: {type: Number, required: true},
    height: {type: Number, required: true},
    length: {type: Number, required: true},
  },
  maxPayload: {type: Number, required: true},
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DRIVER,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DRIVER,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

truckSchema.post('save', handleTruckCollectionUpdated);

const Truck = mongoose.model('Truck', truckSchema);

module.exports = Truck;
