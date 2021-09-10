const { celebrate, Joi, Segments } = require('celebrate');

const querySchema = Joi.object().keys({
  city: Joi.string().required(),
});

module.exports = celebrate({
  [Segments.QUERY]: querySchema,
});
