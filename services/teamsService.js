const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/team.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const constants = require('../utils/constants');

class Team {
  constructor (object) {
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
  static async init () {
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
  static async getTeams () {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const getTeams = await db.collection(collections.TEAM_COLL).find().toArray();

    if (!getTeams) {
      return new Error('Can not found teams');
    }

    return getTeams;
  };

  /**
  * Create a Team.
  */
  static async createTeam (team) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Create team in BDD.
    const createOneTeam = await db.collection(collections.DASHBOARDCARD_COLL).insertOne({ ...team });

    if (!createOneTeam) {
      return new Error('Can not create this team');
    }

    return createOneTeam;
  };

}
module.exports = Team;
