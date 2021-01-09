require('dotenv-safe').config();
const express = require('express');

const api = express.Router({ mergeParams: true });
const passport = require('passport');
const teamsController = require('../controllers/teamsController');
const checkRight = require('../middlewares/rightMiddleware');

/**
* Create a new team.
*/
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_TEAMS_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    teamsController.createTeam,
  )
  .get(
    // (req, res, next) => {
    //   checkRight.rightMiddleware(['TEAMS', 'ADMIN_TEAMS'], req, res, next);
    // },
    passport.authenticate('jwt', { session: false }),
    teamsController.getAllTeams,
  );

module.exports = api;
