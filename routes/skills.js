require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const skillsController = require('../controllers/skillsController');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');
/**
 * Get all skills and  status.
 */
api.get(
  '/',
  (req, res, next) => {
    checkRight.rightMiddleware(['DEGRADED'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  skillsController.getSkills
);

/**
 * Start one skill.
 */
api.post(
  '/start',
  (req, res, next) => {
    checkRight.rightMiddleware(['DEGRADED'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  skillsController.startSkills
);

/**
 * Stop one skill.
 */
api.post(
  '/stop',
  (req, res, next) => {
    checkRight.rightMiddleware(['DEGRADED'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  skillsController.stopSkills
);

module.exports = api;
