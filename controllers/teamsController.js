require('dotenv-safe').config();
require('../passport-strategy');
const teamsService = require('../services/teamsService');
const constants = require('../utils/constants');

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
const getAllTeams = async (req, res, next) => {
  const { query } = req;
  try {
    const [, body] = await teamsService.all(query);
    const data = JSON.parse(body);
    const result = data.response;
    return res.status(200).send({ code: 200, data: result });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createTeam,
  getAllTeams,
};
