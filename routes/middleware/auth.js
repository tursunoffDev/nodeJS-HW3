const authService = require('../../service/AuthService');
const { NOT_AUTHORIZED } = require('../../constants/errors');

module.exports = async (req, res, next) => {
  try {
    const [, token] = req.headers['authorization'].split(' ');
    req.user = await authService.validateUser(token);
    next();
  } catch (err) {
    return res.status(400).json({ message: NOT_AUTHORIZED });
  }
};
