const nodemailer = require('nodemailer');
const {resetPasswordEmailData} =
  require('../constants/emails/resetPasswordEmailData');
const {RESET_PASSWORD} = require('../constants/emails/emailTypes');
const config = require('config');
const mailUser = config.get('mailUser');
const mailPassword = config.get('mailPassword');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
    });
    this.sender = mailUser;

    this._email = {
      from: this.sender,
    };
  }

  createEmailOfType(type, mailConfig) {
    switch (type) {
      case RESET_PASSWORD: {
        this._email = {
          ...this._email,
          to: mailConfig.to,
          ...resetPasswordEmailData(mailConfig.token, mailConfig.email),
        };
      }
        break;
      default:
        throw new Error('Unknown email type');
    }

    return this;
  }

  sendMail() {
    return this.transporter.sendMail(this._email);
  }

  getEmailData() {
    return {...this._email};
  }
}

module.exports = MailService;
