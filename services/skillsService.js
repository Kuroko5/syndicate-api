require('dotenv-safe').config();
const request = require('request');

class Skill {
/**
 * Call the micro-service to get all the skills.
 */
  static async getAllSkills () {
    const options = {
      method: 'GET',
      url: `${process.env.DATA_ACQUISITION}/api/v0/skill/all`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
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
  };

  /**
 * Get the status of each skills.
 */
  static async getStatus () {
    const options = {
      method: 'GET',
      url: `${process.env.DATA_ACQUISITION}/api/v0/skill/all/status`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
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
  };

  /**
 * Start one skill after get the id.
 */
  static async startOneSkill (idSkill, username) {
    const options = {
      method: 'POST',
      url: `${process.env
      .DATA_ACQUISITION}/api/v0/skill/${idSkill}?operator=${username}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };
    // promise
    return new Promise((resolve, reject) => {
    // request to user api
      request(options, (error, response, body) => {
      // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve([response, body]);
      });
    });
  };

  /**
 *  Stop One skill after get the id.
 */
  static async stopOneSkill (idSkill, username) {
    const options = {
      method: 'POST',
      url: `${process.env
      .DATA_ACQUISITION}/api/v0/skill/${idSkill}/deactivate?operator=${username}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };
    // promise
    return new Promise((resolve, reject) => {
    // request to user api
      request(options, (error, response, body) => {
      // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve([response, body]);
      });
    });
  };
}

module.exports = Skill;
