const { celebrate, Joi, Segments } = require('celebrate');

const createOrEditLoadSchema = Joi.object().keys({
  name: Joi.string(),
  dimensions: Joi.object()
    .keys({
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required(),
      length: Joi.number().positive().required(),
    })
    .required(),
  payload: Joi.number().positive().required(),
  pickup_address: Joi.string().required(),
  delivery_address: Joi.string().required(),
});

module.exports = celebrate({
  [Segments.BODY]: createOrEditLoadSchema,
});
