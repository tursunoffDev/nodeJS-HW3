const { celebrate, Joi, Segments } = require('celebrate');

const loginValidation = Joi.object()
  .keys({
    email: Joi.string().email(),
    password: Joi.string().required(),
  })
  .or('email');

module.exports = celebrate({
  [Segments.BODY]: loginValidation,
});
