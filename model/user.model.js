const mongoose = require('mongoose');

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    passwordLastChanged: { type: Date, default: Date.now },
    created_date: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: {
      token: String,
      expirationDate: Date,
    },
  },
  baseOptions
);

const User = mongoose.model('User', userSchema);

module.exports = User;
