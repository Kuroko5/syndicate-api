require('dotenv-safe').config();
const express = require('express');

const app = express();
const host = process.env.HOST || undefined;
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');
const morgan = require('morgan');
require('./passport-strategy');
const debug = require('debug');
const routes = require('./routes');

const log = {
  info: debug('server:info'),
  error: debug('server:error'),
  debug: debug('server:debug'),
};
const main = require('./main');

let server;
/**
 * Middlewares.
 */
app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api', routes);

/**
 * Middlewares to catch error.
 */
app.use((err, req, res) => {
  log.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: 'failed',
    error: err.message,
  });
});

/**
 * Catch all other routes and return the index file.
 */
app.get('*', (req, res) => {
  res.sendStatus(404);
});

/**
 * Connexion to server and mongo database.
 */

const onServerReady = async () => {
  log.info(
    'API running on',
    `${server.address().address}:${server.address().port}`,
  );
  main();
};

server = host ? app.listen(port, host, onServerReady) : app.listen(port, onServerReady);
server.on('error', (err) => {
  if (err.errno === 'EADDRINUSE') {
    log.warn('Port busy');
  } else {
    log.error(err);
  }
});

module.exports = app;
