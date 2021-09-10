const config = require('config');

const resetPasswordEmailData = (token) => ({
  subject: 'Ship-Me App Password Reset',
  text: `Dear,
  
    You are receiving this because you (or someone else) have requested the reset of the password for your account.
    
    Please, click on the following link, or paste this into your browser to complete the process:
    
    If you did not request this, please ignore this email and your password will remain unchanged.`,
});

module.exports = {
  resetPasswordEmailData,
};
