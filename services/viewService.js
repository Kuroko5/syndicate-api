const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const collections = require('../utils/collections');

class View {
  /**
 * Create a view
 */
  static async createView (view) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Insert position of the view.
    const countViews = await db.collection(collections.VIEW_COLL).countDocuments();

    if (countViews === 0) {
      view.position = Number(1);
    }
    view.position = Number(countViews) + 1;

    const result = await db.collection(collections.VIEW_COLL).insertOne(
      {
        ...view
      }
    );
    if (!result) {
      return new Error('Can not create this view');
    }

    return result;
  };

  /**
   * Edit a view
   */
  static async updateView (id, view) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // const res = await db.collection("Profiles").findOne({ name: profile });
    const updateView = await db.collection(collections.VIEW_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          ...view
        }
      }
    );

    if (!updateView) {
      return new Error('Can not update this view');
    }
    return updateView;
  };

  /**
 * Delete a view
 */
  static async hardDeleteView (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const profilesUpdates = await db.collection(collections.PROFILE_COLL).update(
      {},
      { $pull: { views: { _id: ObjectId(id) } } },
      { multi: true }
    );

    if (!profilesUpdates) {
      return new Error('Error occured in update of profiles');
    }

    const usersUpdates = await db.collection(collections.USER_COLL).update(
      {},
      { $pull: { views: { _id: ObjectId(id) } } },
      { multi: true }
    );

    if (!usersUpdates) {
      return new Error('Error occured in update of users');
    }

    // Delete the view
    const res = await db.collection(collections.VIEW_COLL).deleteOne({
      _id: ObjectId(id)
    });
    return res;
  };

  /**
   * Modify the position of a view
   */
  static async position (id, position) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Update the position of a view
    const view = await db.collection(collections.VIEW_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          position
        }
      }
    );

    if (!view.matchedCount) {
      return null;
    }

    return view;
  };
}
module.exports = View;
