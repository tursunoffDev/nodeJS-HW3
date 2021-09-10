const {celebrate, Joi, Segments} = require('celebrate');
const {
  DRIVER,
  SHIPPER,
} = require('../../../constants/userRoles');

const registerValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid(DRIVER, SHIPPER),
});

module.exports = celebrate({
  [Segments.BODY]: registerValidation,
});
