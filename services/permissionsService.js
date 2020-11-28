const { Mongo } = require('../app/class/mongo');
const collections = require('../utils/collections');

class Permission {
/**
* Get all permissions.
*/
  static async allPermissions () {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const getAllPermissions = await db.collection(collections.PERMISSION_COLL)
      .find()
      .toArray();

    if (!getAllPermissions) {
      return new Error('Can not found permissions');
    }

    return getAllPermissions;
  };
}
module.exports = Permission;
