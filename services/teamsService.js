const request = require('request');
const { Mongo } = require('../app/class/mongo');
const schema = require('../src/collections/schemas/team.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');

class Team {
  constructor(object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }

    for (const i in schema.definitions.team.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator
   * Must be called before using this class
   */
  static async init() {
    if (!collections.TEAM_COLL) {
      throw new Error('Missing collection team');
    }

    Team.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Team.validator.init({ schemas: [schema] });

    Team.db = instance.getDb();
  }

  /**
  * Get all teams.
  */
  static async all(query = {}) {
    const options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/teams',
      qs: { league: '39', season: '2020' } || query,
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': '01f8ab22246f26612dcff7958fb0e51a',
      },
    };
    // Return conditions.
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve([response, body]);
      });
    });
  }

  /**
  * Create a Team.
  */
  static async createTeam(team) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Create team in BDD.
    const createOneTeam = await db
      .collection(collections.DASHBOARDCARD_COLL)
      .insertOne({ ...team });

    if (!createOneTeam) {
      return new Error('Can not create this team');
    }

    return createOneTeam;
  }
}
module.exports = Team;
