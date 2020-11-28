require('dotenv-safe').config();
const request = require('request');

class Condition {
  /**
   *  Call the micro-service to get all the conditions.
   */
  static async checkConditions () {
    const options = {
      method: 'GET',
      url: `${process.env.CONDITIONS_URL}/api/v0/eval/rule/all`,
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
 *  Call the micro-service to get the detail for one condition.
 */
  static async getConditionById (id) {
    const options = {
      method: 'GET',
      url: `${process.env.CONDITIONS_URL}/api/v0/eval/rule/${id}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };

    // Return condition required.
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
   *  Call the micro-service to get selected conditions.
   */
  static async getSelectedConditions (array) {
    const [, body] = await this.checkConditions();
    const allConditions = JSON.parse(body);

    const toPromise = array.map((condition) => {
      const toReturn = allConditions.find((elem) => String(elem.rule) === String(condition));

      if (!toReturn) {
        return new Error(`The condition ${condition} does not exist`);
      }

      delete toReturn.stack;
      condition = toReturn;
      return condition;
    });

    await Promise.all(toPromise);
    if (toPromise.find((e) => e instanceof Error)) {
      return toPromise.find((e) => e instanceof Error);
    }

    return toPromise;
  };
}

module.exports = Condition;
