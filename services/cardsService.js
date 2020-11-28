const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/station.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const serviceVariables = require('./variablesService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const constants = require('../utils/constants');

class Card {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.card.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator
   * Must be called before using this class
   */
  static async init () {
    if (!collections.DASHBOARDCARD_COLL) {
      throw new Error('Missing env variable');
    }

    Card.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Card.validator.init({ schemas: [schema] });

    Card.db = instance.getDb();
  }

  /**
  * Get all cards of dashboard.
  */
  static async getCards (username) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();
    const user = await db.collection(collections.USER_COLL).findOne({ username });

    if (!user) {
      return new Error('Can not found this user');
    }

    if (!user.profiles) {
      return new Error('User does not have a profile');
    }

    const getCards = await db.collection(collections.DASHBOARDCARD_COLL).find().toArray();

    if (!getCards) {
      return new Error('Can not found cards');
    }

    const allPermissionUser = [];
    const toPromise = user.profiles.map(async (p) => {
      const profile = await db.collection(collections.PROFILE_COLL).findOne({ _id: ObjectId(p._id) });
      profile.permissions.map((perm) => allPermissionUser.push(perm.code));
    });

    await Promise.all(toPromise);

    // if User has permission AdminDashboard, we return all cards
    if (allPermissionUser.includes('ADMIN_DASHBOARD')) {
      return getCards;
    }

    const finalCards = [];

    if (allPermissionUser.includes('DASHBOARD_ALERTS')) {
      const card = getCards.find((c) => c.type === constants.ALERT);
      finalCards.push(card);
    }

    if (allPermissionUser.includes('DASHBOARD_MACHINES')) {
      const card = getCards.find((c) => c.type === constants.MACHINE);
      finalCards.push(card);
    }

    if (allPermissionUser.includes('DASHBOARD_REPORTS')) {
      const card = getCards.find((c) => c.type === constants.REPORT);
      finalCards.push(card);
    }

    if (allPermissionUser.includes('DASHBOARD_CONDITIONS')) {
      const card = getCards.find((c) => c.type === constants.CONDITION);
      finalCards.push(card);
    }

    if (allPermissionUser.includes('DASHBOARD_DEFAULTS')) {
      const card = getCards.find((c) => c.type === constants.DEFAULT);
      finalCards.push(card);
    }

    if (allPermissionUser.includes('DASHBOARD_EQUIPMENTS')) {
      const card = getCards.find((c) => c.type === constants.EQUIPMENT);
      finalCards.push(card);
    }

    return finalCards;
  };

  /**
  * Get a card by type.
  */
  static async getCardByType (type) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const getOneCard = await db.collection(collections.DASHBOARDCARD_COLL).findOne({ type });

    if (!getOneCard) {
      return new Error('Can not found this card with this type');
    }
    return getOneCard;
  };

  /**
  * Create a card.
  */
  static async createCard (card) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    if (card.type === constants.MACHINE) {
      if (!card.variables) {
        return new Error('This card must have a list of variables');
      }

      const variables = card.variables;

      if (variables.length > 30) {
        return new Error('You can not have more than 30 variables.');
      }

      // Control each variables
      for (let i = 0; i < variables.length; i += 1) {
        const checkVariable = await serviceVariables.getVariable(variables[i].vId);
        if (checkVariable === null) {
          return new Error(`Variable '${variables[i].vId}' does not exist`);
        }

        // If variable is boolean, we must have two values in array.
        if (checkVariable.format === 'bool' && variables[i].values.length < 2) {
          return new Error('This variable must have two values');
        }
      }
    } else if (card.type === constants.EQUIPMENT) {
      if (!card.views) {
        return new Error('This card must have a list of views');
      }

      // Control each views.
      const views = card.views;

      for (let index = 0; index < views.length; index += 1) {
        const checkViews = await serviceUtils.isExist(views[index], collections.VIEW_COLL);

        if (checkViews instanceof Error) {
          return new Error('Can not found this view with this id');
        }
      }
    }

    // Insert position of the card.
    const countCards = await db.collection(collections.DASHBOARDCARD_COLL).countDocuments();

    if (countCards === 0) {
      card.position = Number(1);
    }
    card.position = Number(countCards) + 1;
    // Create card in BDD.
    const createOneCard = await db.collection(collections.DASHBOARDCARD_COLL).insertOne({ ...card });

    if (!createOneCard) {
      return new Error('Can not create this card');
    }

    return createOneCard;
  };

  /**
  * Delete a card.
  */
  static async delete (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Delete card in BDD.
    const deletedCard = await db.collection(collections.DASHBOARDCARD_COLL).remove({ _id: ObjectId(id) });

    if (!deletedCard) {
      return new Error('An error occurred while deleting the card');
    }

    return deletedCard;
  };

  /**
   * Updated position for each cards.
   */
  static async position (id, position) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Update card.
    const upPosition = await db.collection(collections.DASHBOARDCARD_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          position
        }
      }
    );

    if (!upPosition) {
      return new Error('Can not update this card');
    }
    return upPosition;
  };

  /**
  * Update a card.
  */
  static async updateOneCard (id, card) {
  // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    if (card.type === constants.MACHINE) {
      if (!card.variables) {
        return new Error('This card must have a list of variables');
      }

      const variables = card.variables;

      if (variables.length > 30) {
        return new Error('You can not have more than 30 variables.');
      }

      // Control each variables
      for (let i = 0; i < variables.length; i += 1) {
        const checkVariable = await serviceVariables.getVariable(variables[i].vId);
        if (checkVariable === null) {
          return new Error(`Variable '${variables[i].vId}' does not exist`);
        }

        // If variable is boolean, we must have two values in array.
        if (checkVariable.format === 'bool' && variables[i].values.length < 2) {
          return new Error('This variable must have two values');
        }
      }
    } else if (card.type === constants.EQUIPMENT) {
      if (!card.views) {
        return new Error('This card must have a list of views');
      }

      // Control each views.
      const views = card.views;

      for (let index = 0; index < views.length; index += 1) {
        const checkViews = await serviceUtils.isExist(views[index], collections.VIEW_COLL);

        if (checkViews instanceof Error) {
          return new Error('Can not found this view with this id');
        }
      }
    }

    // Update card in BDD.
    const modifyCard = await db.collection(collections.DASHBOARDCARD_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          ...card
        }
      }
    );

    if (!modifyCard) {
      return new Error('Can not update this card');
    }

    return modifyCard;
  };
}
module.exports = Card;
