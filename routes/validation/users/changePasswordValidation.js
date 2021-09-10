const { celebrate, Joi, Segments } = require('celebrate');

const changePasswordValidation = Joi.object().keys({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
});

module.exports = celebrate({
  [Segments.BODY]: changePasswordValidation,
});
