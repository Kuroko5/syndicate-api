const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const permissionsService = require('../services/permissionsService');
class Profile {
  /**
   *  Get all profiles
   */
  static async allProfiles (query) {
    // Get all profiles.
    const listProfiles = await serviceUtils.getAllResults(query, collections.PROFILE_COLL);
    if (listProfiles instanceof Error) {
      return new Error('Can not found any profiles');
    }
    const result = listProfiles.result;
    const count = listProfiles.count;

    // Get all permissions for each profile.
    const categoriesPermissions = await this.getAllCategoriesPermissions();

    await result.map(async (profile) => {
      const finalpermissions = [];

      // we filtered permission by the current category
      categoriesPermissions.map(async (category) => {
        const permissionFiltered = await this.filterByCategory(category, profile.permissions);

        // push all filtered permission into a new array for remove duplicate
        finalpermissions.push(permissionFiltered);

        // remove duplicate category and value null
        let temps = [...new Set(finalpermissions)];
        temps = temps.filter((e) => e);

        profile.permissions = temps;
      });
    });

    return { count, result };
  };

  /**
   * Create a profile
   */
  static async createProfile (profile) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    if (!profile.label || !profile.description) {
      return new Error('Data do not have the correct format');
    }
    const getProfile = await serviceUtils.isExist(profile.label, collections.PROFILE_COLL);

    if (getProfile && getProfile.label) {
      return new Error('A profile with this name already exists.');
    }

    // Set isDefault to false if is not in the body
    if (!profile.isDefault) {
      profile.isDefault = false;
    }

    if (!profile.permissions || !profile.permissions.length) {
      return new Error('The profile needs at least one permission.');
    }

    const defaultpermissions = await permissionsService.allPermissions();

    const permissions = [];
    profile.permissions.forEach((p) => {
      const f = defaultpermissions.find(defaultp => {
        return defaultp.code === p.code;
      });

      if (!f) {
        permissions.push(new Error(`the permission '${p.code}' does not exist`));
      } else {
        p = { ...f };
        permissions.push(p);
      }

      return p;
    });

    profile.permissions = permissions;

    if (profile.permissions.find((e) => e instanceof Error)) {
      return new Error('One of the permission does not exist');
    }

    // Check for all views if exist, and reset the value
    if (profile.views && profile.views.length) {
      const toPromise = profile.views.map(async (view) => {
        const existView = await serviceUtils.isExist(view.label, collections.VIEW_COLL);

        if (!existView) {
          return new Error(`the view '${view.label}' does not exist`);
        }
        existView._id = ObjectId(existView._id);
        view = { ...existView };

        return view;
      });

      const results = await Promise.all(toPromise);

      const error = results.find((e) => e instanceof Error);

      if (error) {
        return error;
      }

      profile.views = results;
    }

    // Create profil
    const res = await db.collection(collections.PROFILE_COLL).insertOne(
      {
        ...profile,
        createdAt: new Date()
      }
    );

    if (!res) {
      return new Error('Can not create profile');
    }

    return res;
  };

  /**
   * Edit a profile
   */
  static async updateProfile (id, profile) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const defaultpermissions = await permissionsService.allPermissions();

    const permissions = [];
    profile.permissions.forEach((permission) => {
      const exist = defaultpermissions.find(defaultpermission => {
        return defaultpermission.code === permission.code;
      });

      if (!exist) {
        permissions.push(new Error(`the permission '${permission.code}' does not exist`));
      } else {
        permission = { ...exist };
        permissions.push(permission);
      }

      return permission;
    });

    profile.permissions = permissions;

    if (profile.permissions.find((e) => e instanceof Error)) {
      return new Error('One of the permission does not exist');
    }

    // Check for all views if exist, and reset the value
    if (profile.views && profile.views.length) {
      const toPromise = profile.views.map(async (view) => {
        const existView = await serviceUtils.isExist(view.label, collections.VIEW_COLL);

        if (!existView) {
          return new Error(`the view '${view.label}' does not exist`);
        }

        existView._id = ObjectId(existView._id);
        view = { ...existView };
        return view;
      });

      const results = await Promise.all(toPromise);
      const error = results.find((e) => e instanceof Error);

      if (error) {
        return error;
      }
      profile.views = results;
    }

    // Update profile
    const res = await db.collection(collections.PROFILE_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          ...profile,
          updatedAt: new Date()
        }
      }
    );

    if (!res) {
      return new Error('Can not update profile');
    }

    return res;
  };

  /**
   * Delete a profile by id.
   */
  static async hardDeleteProfile (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // DeleteOne profile.
    const result = await db.collection(collections.PROFILE_COLL).deleteOne({
      _id: ObjectId(id)
    });

    if (!result) {
      return new Error('Can not delete this profile');
    }
    return result;
  };

  /**
  * Get all users with specific profile.
  */
  static async getAllUsersWithProfiles (label) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Get all users with this profile.
    const usersList = await db.collection(collections.USER_COLL).find(
      {
        profiles:
         { $elemMatch: { label: label } }
      }
    ).toArray();

    if (!usersList) {
      return new Error('Can not found users with this profile');
    }

    // Delete profile to the list of users profiles
    for (let i = 0; i < usersList.length; i += 1) {
      const profiles = usersList[i].profiles;

      // Filter array profiles.
      const newProfiles = profiles.filter((userProfile) => { return String(userProfile.label) !== String(label); });

      // Update each users with the new list of profiles.
      const updateUsers = await db.collection(collections.USER_COLL).updateOne(
        {
          _id: ObjectId(usersList[i]._id)
        },
        {
          $set: {
            profiles: newProfiles
          }
        }
      );

      if (!updateUsers) {
        return new Error('Can not update the list of profiles for this user');
      }
    }
  }

  static async getAllCategoriesPermissions () {
    const defaultpermissions = await permissionsService.allPermissions();

    const categoriesPermissions = [];
    defaultpermissions.map((perm) => {
      categoriesPermissions.push(perm.category);
    });

    // remove duplicate category
    categoriesPermissions.filter((a) => String(a) !== 'undefined');

    return [...new Set(categoriesPermissions)];
  }

  /**
   * @param category the current category to filtered
   * @param array list of permission of the profile
   */
  static async filterByCategory (category, array) {
    const object = {
      category,
      permissions: []
    };

    if (array && array.length) {
      await array.forEach((permission) => {
        if (permission.category === category) {
          object.permissions.push(permission);
        }
      });
    }

    if (object.permissions && object.permissions.length) {
      return object;
    }

    return null;
  }

  /**
   * Get list of profiles
   * @param profiles - the array of profiles id
   */
  static async getProfiles (profiles) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const result = await db.collection(collections.PROFILE_COLL).find({
      _id: { $in: profiles }
    }).toArray();

    if (!result) {
      return new Error('Can not find a profile');
    }

    return result;
  }
}

module.exports = Profile;
