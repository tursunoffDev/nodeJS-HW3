const { celebrate, Joi, Segments } = require('celebrate');

const querySchema = Joi.object().keys({
  limit: Joi.number(),
  offset: Joi.number(),
  status: Joi.string(),
});

module.exports = celebrate({
  [Segments.QUERY]: querySchema,
});
