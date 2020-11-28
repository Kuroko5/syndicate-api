require('dotenv-safe').config();
require('../passport-strategy');
const profileService = require('../services/profileService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
/**
 * Get all profiles.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllProfiles = async (req, res, next) => {
  try {
    const profiles = await profileService.allProfiles(req.query);

    if (profiles instanceof Error) {
      return res.status(404).send({ code: 404, message: profiles.message });
    }
    return res.status(200).send({ code: 200, data: profiles });
  } catch (e) {
    next(e);
  }
};

/**
 * Create a profile
 * @param {*} req
 * @param {*} res
 */
const createProfile = async (req, res) => {
  const profile = req.body;
  const result = await profileService.createProfile(profile);

  if (result instanceof Error) {
    return res.status(400).send({ code: 400, message: result.message });
  }

  return res.status(200).send({ code: 200, message: 'Profile created' });
};

/**
 * Edit a profile
 * @param id
 * @param profile
 * @param {*} req
 * @param {*} res
 */
const updateProfile = async (req, res, next) => {
  // Build objet with informations from body
  try {
    const { id } = req.params;
    const profile = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: 'Wrong id' });
    }

    // Check if all required fields are completed.
    if (!profile.label || !profile.description) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    const oldProfile = serviceUtils.isExist(id, collections.PROFILE_COLL);
    // Check if label has changed
    // If label has changed, check if new label already exists
    if (oldProfile.label !== profile.label) {
      const exist = await serviceUtils.isExist(profile.label, collections.PROFILE_COLL);
      if (exist instanceof Error) {
        return res.status(404).send({ message: exist.message });
      }
    }

    // Set isDefault to false if is not in the body
    if (!profile.isDefault) {
      profile.isDefault = false;
    }

    if (!profile.permissions || !profile.permissions.length) {
      return res.status(404).send({ message: 'The profile needs at least one permission.' });
    }

    const result = await profileService.updateProfile(id, profile);

    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }

    return res.status(200).send({ code: 200, message: 'Profile updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a profile.
 * @param id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteProfile = async (req, res, next) => {
  const { id } = req.params;

  // Check if the id is valid.
  if (id.length !== 24) {
    return res.status(400).send({ message: ' Wrong id' });
  }

  // Get object profile.
  const profile = await serviceUtils.isExist(id, collections.PROFILE_COLL);

  if (profile instanceof Error) {
    return res.status(404).send({ code: 404, message: profile.message });
  }
  // Admin profile can't be deleted.
  if (profile.isDefault) {
    return res.status(200).send({ code: 200, message: 'Can not delete this admin profile' });
  }

  // For each users delete specific profile.
  const updateProfilesUsers = await profileService.getAllUsersWithProfiles(profile.label);

  if (updateProfilesUsers instanceof Error) {
    return res.status(400).send({ code: 400, message: updateProfilesUsers.message });
  }

  // After delete profile in all profiles list of users, delete object profile.
  const deleteProfile = await profileService.hardDeleteProfile(id);

  if (deleteProfile instanceof Error) {
    return res.status(400).send({ code: 400, message: deleteProfile.message });
  }

  return res.status(200).send({ code: 200, message: 'This profile has been deleted' });
};

module.exports = {
  getAllProfiles,
  updateProfile,
  createProfile,
  deleteProfile
};
