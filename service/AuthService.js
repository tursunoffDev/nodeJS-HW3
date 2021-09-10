const jwt = require('jsonwebtoken');
const config = require('config');
const salt = config.get('jwtSalt');
const userService = require('./UserService');
const moment = require('moment');
const { TOKEN_EXPIRED } = require('../constants/errors');
const HttpError = require('../utils/HttpError');

class AuthService {
  generateToken({ email, role }) {
    const iat = Date.now();
    return jwt.sign(JSON.stringify({ email, role, iat }), salt);
  }

  async validateUser(token) {
    const { email, iat } = jwt.verify(token, salt);

    const foundUser = await userService.findByEmail(email);

    const isTokenExpired = !this.isTokenCreatedAfterPasswordChange(
      iat,
      foundUser.passwordLastChanged
    );

    if (isTokenExpired) {
      throw new HttpError(400, TOKEN_EXPIRED);
    }

    return foundUser;
  }

  isTokenCreatedAfterPasswordChange(tokenIat, passwordLastChanged) {
    const passwordLastChangedMoment = moment(passwordLastChanged);
    const tokenIatMoment = moment(tokenIat);

    return tokenIatMoment.isAfter(passwordLastChangedMoment);
  }
}

module.exports = new AuthService();
