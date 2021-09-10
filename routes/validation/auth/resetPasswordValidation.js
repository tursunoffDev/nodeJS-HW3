const {celebrate, Joi, Segments} = require('celebrate');

const resetPasswordValidation = Joi.object().keys({
  password: Joi.string().required(),
});

module.exports = celebrate({
  [Segments.BODY]: resetPasswordValidation,
});
