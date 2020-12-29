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
  var request = require("request");
  const result = [];
  var options = {
    method: 'GET',
    url: 'https://v3.football.api-sports.io/teams',
    qs: {league: '39', season: '2020'},
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': '01f8ab22246f26612dcff7958fb0e51a'
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    return res.status(200).send({ code: 200, data: JSON.parse(body)})

  });
};

module.exports = {
  createTeam,
  getAllTeams
};
