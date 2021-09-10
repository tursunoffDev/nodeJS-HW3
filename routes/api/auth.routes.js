const express = require('express');
const router = express.Router();
const userService = require('../../service/UserService');
const authService = require('../../service/AuthService');
const registerValidation = require('../validation/auth/registerValidation');
const loginValidation = require('../validation/auth/loginValidation');
const emailForResetPasswordValidation = require('../validation/auth/emailForResetPasswordValidation');
const resetPasswordValidation = require('../validation/auth/resetPasswordValidation');
const {
  USER_REGISTERED,
  USER_AUTHENTICATED,
  PASSWORD_RESET_EMAIL_SENT,
  PASSWORD_CHANGED,
} = require('../../constants/responseStatuses');

router.post('/login', loginValidation, async (req, res, next) => {
  const userData = req.body;

  try {
    const user = await userService.findByCredentials(userData);
    const token = authService.generateToken(user);

    res.json({ message: USER_AUTHENTICATED, token });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', registerValidation, async (req, res, next) => {
  const registerUserDto = req.body;

  try {
    await userService.createUserOfRole(registerUserDto);
    res.json({ message: USER_REGISTERED });
  } catch (err) {
    console.log('error')
    return next(err);
  }
});

router.post(
  '/forgot_password',
  emailForResetPasswordValidation,
  async (req, res, next) => {
    const { email } = req.body;
    try {
      await userService.sendPasswordResetToken(email);
      res.json({ message: PASSWORD_RESET_EMAIL_SENT });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/password/:token',
  resetPasswordValidation,
  async (req, res, next) => {
    const { password } = req.body;
    const { token } = req.params;
    try {
      await userService.resetPassword(token, password);
      res.json({ message: PASSWORD_CHANGED });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
