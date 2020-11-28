require('dotenv-safe').config();
require('../passport-strategy');
const jwtDecode = require('jwt-decode');
const teamsService = require('../services/teamsService');
const constants = require('../utils/constants');
const { ObjectId } = require('mongodb');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');

/**
 * Create a Team
 * @param {*} req
 * @param {*} res
 */
const createTeam = async (req, res) => {
  const team = req.body;

  // Check if the mandatory data is present.
  if (!team.label) {
    return res.status(400).send({ code: 400, message: 'Label are required' });
  }

  // Create Team.
  const result = await teamsService.createTeam(team);

  if (result instanceof Error) {
    return res.status(400).send({ code: 400, message: result.message });
  }
  return res.status(200).send({ code: 200, message: 'Team created' });
};

/**
 * Get All Teams
 * @param {*} req
 * @param {*} res
 */
const getAllTeams = async (req, res) => {
  // Decode the token to get the operator.
  const token = req.headers.authorization;
  const decoded = jwtDecode(token);
  const username = decoded.username;

  // Get All Teams.
  const teams = await teamsService.getTeams(username);

  if (teams instanceof Error) {
    return res.status(400).send({ code: 400, message: teams.message });
  }

  return res.status(200).send({ code: 200, data: teams });
};

module.exports = {
  createTeam,
  getAllTeams
};
