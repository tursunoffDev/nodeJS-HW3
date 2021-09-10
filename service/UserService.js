const {
  EMAIL_TAKEN,
  WRONG_CREDENTIALS,
  WRONG_OLD_PASSWORD,
} = require('../constants/errors');
const bcrypt = require('bcrypt');
const config = require('config');
const User = require('../model/user.model');
const Driver = require('../model/driver.model');
const Shipper = require('../model/shipper.model');
const { SHIPPER, DRIVER } = require('../constants/userRoles');
const HttpError = require('../utils/HttpError');
const {
  USER_LACKS_AUTHORITY,
  PASSWORD_TOKEN_NOT_VALID,
} = require('../constants/errors');
const crypto = require('crypto');
const util = require('util');
const { tokenValidFor } = require('../constants/resetPasswordToken');
const MailService = require('../service/MailService');
const { RESET_PASSWORD } = require('../constants/emails/emailTypes');

class UserService {
  async findByCredentials({ email, password }) {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      throw new HttpError(400, WRONG_CREDENTIALS);
    }

    const passwordsMatch = await bcrypt.compare(password, foundUser.password);
    if (!passwordsMatch) {
      throw new HttpError(400, WRONG_CREDENTIALS);
    }
    return foundUser;
  }

  async findByEmail(email) {
    const foundUser = await User.findOne({ email }).select('-password');
    if (!foundUser) {
      throw new HttpError(400, USER_LACKS_AUTHORITY);
    }

    return foundUser;
  }

  async createUserOfRole({ email, password, role }) {
    await this.checkUserUniqueness({ email });

    const UserModel = this.getUserModel(role);
    const hashedPassword = await this.encodePassword(password);

    const createdUser = await UserModel.create({
      email,
      password: hashedPassword,
    });
    delete createdUser.password;

    return createdUser;
  }

  async isEmailTaken(email) {
    return User.exists({ email });
  }

  async checkUserUniqueness({ email }) {
    const isEmailTaken = await this.isEmailTaken(email);

    if (isEmailTaken) {
      throw new HttpError(400, EMAIL_TAKEN);
    }
  }

  remove(user) {
    return User.findByIdAndDelete(user);
  }

  getUserModel(role) {
    switch (role) {
      case DRIVER:
        return Driver;
      case SHIPPER:
        return Shipper;
    }
  }

  async changePassword(user, oldPassword, newPassword) {
    const editedUser = await User.findById(user.id);
    const passwordsMatch = await bcrypt.compare(
      oldPassword,
      editedUser.password
    );

    if (!passwordsMatch) {
      throw new HttpError(400, WRONG_OLD_PASSWORD);
    }

    await this.updateUserPassword(editedUser, newPassword);
  }

  encodePassword(password) {
    const saltRounds = config.get('saltRounds');

    return bcrypt.hash(password, saltRounds);
  }

  async updateUserPassword(user, newPassword) {
    const hashedPassword = await this.encodePassword(newPassword);
    await user.update({
      password: hashedPassword,
      passwordLastChanged: Date.now(),
    });
  }

  async sendPasswordResetToken(email) {
    const user = await this.findByEmail(email);
    const userWithToken = await this.setPasswordResetToken(user);

    const mailConfig = {
      token: userWithToken.resetPasswordToken.token,
      to: user.email,
    };
    const mailService = new MailService();

    return mailService.createEmailOfType(RESET_PASSWORD, mailConfig).sendMail();
  }

  async resetPassword(token, password) {
    const user = await this.findByResetPasswordToken(token);
    await this.updateUserPassword(user, password);
    user.resetPasswordToken = undefined;
    await user.save();
  }

  async generateResetToken() {
    const randomBytesGenerator = util.promisify(crypto.randomBytes);
    const buf = await randomBytesGenerator(20);
    return buf.toString('hex');
  }

  async setPasswordResetToken(user) {
    user.resetPasswordToken.token = await this.generateResetToken();
    user.resetPasswordToken.expirationDate = Date.now() + tokenValidFor;
    return user.save();
  }

  async findByResetPasswordToken(token) {
    const foundUser = await User.findOne({
      'resetPasswordToken.token': token,
      'resetPasswordToken.expirationDate': { $gt: Date.now() },
    });

    if (!foundUser) {
      throw new HttpError(400, PASSWORD_TOKEN_NOT_VALID);
    }

    return foundUser;
  }
}

module.exports = new UserService();
