const {celebrate, Joi, Segments} = require('celebrate');

const emailForResetPasswordValidation = Joi.object().keys({
  email: Joi.string().email().required(),
});

module.exports = celebrate({
  [Segments.BODY]: emailForResetPasswordValidation,
});
