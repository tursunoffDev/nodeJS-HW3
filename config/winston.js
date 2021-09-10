// const winston = require('winston');
// const { format } = require('winston');
// require('winston-mongodb');
// const config = require('config');

// const logger = winston.createLogger({
//   level: 'info',
//   format: format.json(),
//   transports: [
//     new winston.transports.MongoDB({
//       level: 'info',
//       db: config.get('mongoUrl'),
//       collection: 'infoLogs',
//     }),
//     new winston.transports.MongoDB({
//       level: 'error',
//       db: config.get('mongoUrl'),
//       collection: 'errorLogs',
//     }),
//     new winston.transports.Console({
//       format: format.simple(),
//     }),
//   ],
// });

// logger.stream = {
//   write: function (message) {
//     logger.info(message);
//   },
// };

// module.exports = logger;
