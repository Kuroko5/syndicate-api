const { Mongo } = require('../app/class/mongo');
const schema = require('../src/collections/schemas/user.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const { ObjectId } = require('mongodb');

class User {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.user.properties) {
      this[i] = object[i];
    }
  }

  /**
    * initializes the schema validator.and db connection
    * * Must be called before using this class
  */
  static async init () {
    if (!collections.USER_COLL) {
      throw new Error('Missing env variable');
    }
    User.COLLECTION = collections.USER_COLL;
    User.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await User.validator.init({ schemas: [schema] });

    User.db = instance.getDb();
  }

  /**
    *  Create new user.
    */
  static async createNewUser (username, password, profiles) {
    // Retrieve instance of Mongo.
    const db = await Mongo.instance().getDb();

    // Check if each profiles is valid.
    profiles.forEach(async (profile) => {
      // Valid id.
      if (profile._id.length !== 24) {
        return new Error('Wrong id');
      }
      profile._id = ObjectId(profile._id);
      const validProfile = await serviceUtils.isExist(profile._id, collections.PROFILE_COLL);
      if (validProfile instanceof Error) {
        return new Error('Can not find this specific user');
      }
    });
    // Hash password.
    const hashPassword = await serviceUtils.hashUserPassword(password);

    if (!hashPassword) {
      return new Error('Error creation password');
    };

    /* Create the new user */
    const user = {
      username,
      password: hashPassword,
      profiles,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save the new user.
    const newUser = db.collection(User.COLLECTION).insertOne({ ...user });

    if (!newUser) {
      return new Error('Can not create this user');
    };
    return newUser;
  };

  /**
   * Get a user by username.
   */
  static async getUserByUsername (username) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const result = await db.collection(collections.USER_COLL).findOne({ username });

    if (!result) {
      return null;
    }

    return result;
  };

  /**
   * Get a user by id.
   */
  static async getUserById (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const result = await db.collection(User.COLLECTION).findOne({ _id: ObjectId(id) });

    if (!result) {
      return null;
    }

    return result;
  };

  /**
   * Update a user
   */
  static async updateUser (id, user) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // UpdateOne User
    const res = await db.collection(User.COLLECTION).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          ...user,
          updatedAt: new Date()
        }
      }
    );

    if (!res) {
      return new Error('Can not update user');
    }

    return res;
  };

  /**
   * Delete one user
   */
  static async hardDeleteUser (username) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // DeleteOne User
    const result = await db.collection(User.COLLECTION).deleteOne({
      username: username
    });
    if (!result) {
      return new Error('Can not delete this user');
    }
    return result;
  };

  /**
   * Updated array of user's views.
   */
  static async saveViewsForUsers (user, viewsIds) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Get all views for current user.
    const views = [];
    for (let i = 0; i < viewsIds.length; i += 1) {
      const getView = await serviceUtils.isExist(viewsIds[i], collections.VIEW_COLL);

      if (getView instanceof Error) {
        return new Error('Can not found this view');
      }

      getView.position = Number(i) + 1;
      getView._id = ObjectId(getView._id);
      views.push(getView);
    }
    // Update user's views.

    user.views = [...views];
    const userUpdated = await db.collection(User.COLLECTION).updateOne(
      {
        _id: ObjectId(user._id)
      },
      {
        $set: {
          ...user,
          updatedAt: new Date()
        }
      }
    );

    if (!userUpdated) {
      return new Error('Can not update user');
    }

    return userUpdated;
  };

  /**
  * Get views of the user
  * @param {*} username - the username of the user
  */
  static async getViewsByUser (username) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // get User
    const user = await db.collection(User.COLLECTION).findOne({ username });

    if (!user) {
      return new Error('Can not find this user');
    }

    if (!user.profiles && !user.profiles.length) {
      return new Error('This user can not have profile, we can not retrieve his view');
    }

    // set all id of views in a new array
    const allViewsId = [];

    const toPromise = await user.profiles.map(async (profile) => {
      // retrieve profile for get all his views
      const getProfile = await db.collection(collections.PROFILE_COLL).findOne({
        _id: ObjectId(profile._id)
      });

      // for all views, push id in the array
      if (getProfile.views && getProfile.views.length) {
        getProfile.views.map((view) => {
          allViewsId.push(ObjectId(view._id));
        });
      }
    });

    await Promise.all(toPromise);

    const getViews = await db.collection(collections.VIEW_COLL)
      .find({
        _id: { $in: allViewsId }
      })
      .toArray();

    // check if user has views, so return views
    if (user.views && user.views.length) {
      user.views.map(async (view) => {
        const viewObject = await db.collection(collections.VIEW_COLL)
          .findOne({
            _id: ObjectId(view._id)
          });

        return viewObject;
      });

      // check if all views is in the array of the user's views
      const onlyInB = getViews.filter(this.compare(user.views));

      onlyInB.map((v) => {
        // set new position for view not in array of user
        v.position = user.views.length + 1;

        // push the view in the array of views user
        user.views.push(v);
      });

      // Use profiles views but set user positions
      user.views = getViews.filter((item) => {
        return user.views.find((element) => {
          if (String(element._id) === String(item._id)) {
            item.position = element.position;
            return element;
          }
        });
      });

      return user.views;
    }

    return getViews;
  };

  /**
   * Compare current object in a other Array
   * @param {*} otherArray - array to compare with the current object
   */
  static compare (otherArray) {
    return function (current) {
      return otherArray.filter(function (other) {
        return String(other._id) === String(current._id);
      }).length === 0;
    };
  }
}
module.exports = User;
