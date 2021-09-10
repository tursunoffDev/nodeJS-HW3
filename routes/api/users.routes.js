const express = require('express');
const router = express.Router();
const userService = require('../../service/UserService');
const changePasswordValidation = require('../validation/users/changePasswordValidation');
const { isValidObjectId } = require('../../utils/isValidObjectId');
const HttpError = require('../../utils/HttpError');
const {
  PASSWORD_CHANGED,
  USER_REMOVED,
} = require('../../constants/responseStatuses');
const {
  WRONG_ID_FORMAT,
  USER_LACKS_AUTHORITY,
} = require('../../constants/errors');

router.param('userId', (req, res, next) => {
  const { userId } = req.params;
  if (!isValidObjectId(id)) {
    return next(new HttpError(400, WRONG_ID_FORMAT));
  }
  const authUser = req.user;

  if (userId !== authUser.id) {
    return res.status(400).json({ message: USER_LACKS_AUTHORITY });
  }
  next();
});

router.get('/me', (req, res) => {
  if (!req.user) {
    throw new Error(USER_LACKS_AUTHORITY);
  }
  const user = {
    user: {
      _id: req.user._id,
      role: req.user.role,
      email: req.user.email,
      created_date: req.user.created_date,
    },
  };
  res.json(user);
});

router.patch(
  '/me/password',
  changePasswordValidation,
  async (req, res, next) => {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;

    try {
      await userService.changePassword(user, oldPassword, newPassword);

      res.json({ message: PASSWORD_CHANGED });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/me', async (req, res) => {
  const user = req.user;
  await userService.remove(user);

  res.status(200).json({ status: USER_REMOVED });
});

module.exports = router;
