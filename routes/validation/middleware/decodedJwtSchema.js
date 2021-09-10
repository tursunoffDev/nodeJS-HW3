const { DRIVER, SHIPPER } = require('../../../constants/userRoles');
const { Joi } = require('celebrate');

const decodedJwtSchema = Joi.object({
  role: Joi.string().valid(DRIVER, SHIPPER),
  iat: Joi.date().required(),
});

module.exports = {
  decodedJwtSchema,
};
