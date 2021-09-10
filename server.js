const express = require('express');
const app = express();
const morgan = require('morgan');
const winston = require('./config/winston');
const { errors } = require('celebrate');
const config = require('config');
const trucksRouter = require('./routes/api/trucks.routes');
const authRouter = require('./routes/api/auth.routes');
const loadsRouter = require('./routes/api/load.routes');
const usersRouter = require('./routes/api/users.routes');
const weatherRouter = require('./routes/api/weather.routes');
const authMiddleware = require('./routes/middleware/auth');
const errorHandler = require('./routes/middleware/errorHandler');
const requireRole = require('./routes/middleware/requireUserRole');
const mongoose = require('mongoose');
const { DRIVER, SHIPPER } = require('./constants/userRoles');
const cors = require('cors');

const mongoUrl = config.get('mongoUrl');
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('open', console.log.bind(console, 'MongoDB connected successfully'));

app.use(cors());
app.use(morgan('combined', { stream: winston.stream }));
app.use(express.json());
const port = config.get('Port');

app.get('/', (req, res) => {
  res.json({ message: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/weather', weatherRouter);

app.use(authMiddleware);

app.use('/api/users', usersRouter);
app.use('/api/trucks', requireRole(DRIVER), trucksRouter);
app.use('/api/loads', requireRole([DRIVER, SHIPPER]), loadsRouter);

app.use(errors());
app.use(errorHandler);
app.listen(port, () => {
  console.log('Server is running on port', port);
});
