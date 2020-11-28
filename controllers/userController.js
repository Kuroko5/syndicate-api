require('dotenv-safe').config();
require('../passport-strategy');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWTSECRET;
const usersService = require('../services/usersService');
const profileService = require('../services/profileService');
const collections = require('../utils/collections');
const jwtoken = require('../utils/jwt');
const serviceUtils = require('../utils/utils');
const { ObjectId } = require('mongodb');
const samplesService = require('../services/samplesService');
const constants = require('../utils/constants');
const cardsService = require('../services/cardsService');

/**
 * Create a new user.
 */
const createNewUser = async (req, res) => {
  const user = req.body;

  // Username, password are required.
  if (!user.username || !user.password || !user.profiles) {
    return res.status(404).send({ code: 400, message: 'Username and password are required' });
  }

  // Must have at least one profile.
  if (!user.profiles.length) {
    return res.status(404).send({ code: 400, message: 'User must have at least one profile.' });
  }

  // Check if the user already exist.
  const getUser = await usersService.getUserByUsername(user.username);

  if (getUser !== null) {
    return res.status(404).send({ code: 400, message: ' A user already exist with the same username' });
  }

  // Check password.
  const username = user.username.toLowerCase();
  const regex = /^[\D]+\.{1}[\D]+/;
  const check = regex.test(username);

  if (!check) {
    return res.status(400).send({ code: 400, message: 'Data do not have the correct format' });
  }

  // Create user.
  const addUser = await usersService.createNewUser(user.username, user.password, user.profiles);

  if (addUser instanceof Error) {
    return res.status(400).send({ code: 400, message: addUser.message });
  }
  return res.status(200).send({ code: 200, message: 'New user has been created' });
};

/**
 * Get user's rights
 * @param {*} req
 * @param {*} res
 */
const getUserRight = async (req, res) => {
  const token = req.headers.authorization;

  // Decode token to get username.
  const payload = jwtoken.jwtTokenDecode(token);
  const username = payload.username;

  /* Check if the user already exists */
  const user = await usersService.getUserByUsername(username);

  if (!user) {
    res.status(400).send({ message: 'User not found !' });
  }

  const allProfiles = [];
  const allPermissions = new Set();

  user.profiles.forEach(profile => {
    allProfiles.push(profile._id);
  });

  const profiles = await profileService.getProfiles(allProfiles);

  if (profiles instanceof Error) {
    return res.status(405).send({ code: 405, message: profiles.message });
  }

  profiles.forEach(profile => {
    profile.permissions.forEach(permission => {
      allPermissions.add(permission.code);
    });
  });

  const result = {
    username: username,
    permissions: [...allPermissions]
  };

  return res.status(200).json(result);
};
/**
 * Login user.
 */
const loginUser = (req, res) => {
  passport.authenticate('local', { session: false }, (err, user, message) => {
    if (err || !user) {
      return res.status(400).send({ error: err, message: 'Login failed' });
    }
    req.login(user, { session: false }, loginErr => {
      if (loginErr) {
        return res.send(loginErr);
      }
      const username = user.username;
      const token = jwt.sign(user, jwtSecret, { expiresIn: constants.TOKEN_VALIDITY });
      return res.json({ username, token });
    });
    return undefined;
  })(req, res);
};

/**
 * Get all users.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await serviceUtils.getAllResults(req.query, collections.USER_COLL);

    if (users instanceof Error) {
      return res.status(404).send({ code: 404, message: users.message });
    }
    return res.status(200).send({ code: 200, data: users });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a user
 * @param id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: 'Wrong id' });
    }

    // Check if all required fields are completed.
    if (!user.username) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    // Check username format
    const regex = /^[\D]+\.{1}[\D]+/;
    const check = regex.test(user.username.toLowerCase());

    if (!check) {
      res.status(400).json('Data do not have the correct format');
    }

    if (!user.profiles || !user.profiles.length) {
      return res.status(404).send({ message: 'The user needs at least one profile.' });
    }

    const oldUsername = await usersService.getUserById(id);
    // Check if username has changed
    // If username has changed, check if new username already exists
    if (oldUsername.username !== user.username) {
      const exist = await usersService.getUserByUsername(user.username);
      if (exist) {
        return res.status(404).send({ message: 'A user with this username already exists.' });
      }
    }

    // Check if each profile exists
    user.profiles.map(async (profile) => {
      // Check if the id is valid.
      if (profile._id.length !== 24) {
        return res.status(400).send({ message: 'Wrong profile id' });
      }
      profile._id = ObjectId(profile._id);
      const checkprofile = await serviceUtils.isExist(profile._id, collections.PROFILE_COLL);
      if (checkprofile instanceof Error) {
        return res.status(400).send({ code: 400, message: checkprofile.message });
      }
    });

    // If a password is given, hash it
    if (user.password !== null) {
      // Hash password.
      const hashPassword = await serviceUtils.hashUserPassword(user.password);

      if (!hashPassword) {
        return new Error('Error creation password');
      };

      user.password = hashPassword;
    } else {
      user.password = oldUsername.password;
    }

    const result = await usersService.updateUser(id, user);
    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }

    return res.status(200).send({ code: 200, message: 'User updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete one user
 * @param username
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  // Get all object user.
  const getUser = await usersService.getUserById(id);

  if (!getUser) {
    return res.status(404).send({ code: 400, message: 'Can not found this user' });
  }

  // Decode token to compare user and user to delete.
  const payload = jwtoken.jwtTokenDecode(req.headers.authorization);
  const currentUser = payload.username;

  if ((String(currentUser)) === (String(getUser.username))) {
    return res.status(400).send({ code: 400, message: 'You can not delete your own user account' });
  }

  const deleteOneUser = await usersService.hardDeleteUser(getUser.username);

  if (!deleteOneUser) {
    return res.status(400).send({ code: 400, message: 'Can not delete this user' });
  }

  return res.status(200).send({ code: 200, message: 'Ok user deleted' });
};

/**
 * Modify the position of each user'views..
 * @param {*} views
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const updateUserviews = async (req, res, next) => {
  try {
    // Get array of views id
    const { views } = req.body;

    // Check if each id of views is valid.
    const element = views.every(i => (typeof i === 'string') && (i.length === 24));
    if (!element) {
      return res.status(404).send('Wrong format');
    }

    // Find username of the user.
    const payload = jwtoken.jwtTokenDecode(req.headers.authorization);
    const userIdentity = payload.username;

    // Get user.
    const user = await usersService.getUserByUsername(userIdentity);

    if (!user) {
      return res.status(404).send({ code: 404, message: 'Can not found user with this username' });
    }
    // Update user.
    const updateUserViews = await usersService.saveViewsForUsers(user, views);

    if (!updateUserViews) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    }
    return res.status(200).send({ code: 200, message: 'Views position has been updated with success' });
  } catch (e) {
    next(e);
  }
};

const getViewsByUser = async (req, res, next) => {
  const token = req.headers.authorization;

  // Decode token to get username.
  const payload = jwtoken.jwtTokenDecode(token);
  const currentUser = payload.username;

  const results = await usersService.getViewsByUser(currentUser);

  if (results instanceof Error) {
    return res.status(405).send({ code: 405, message: results.message });
  }

  return res.status(200).send({ code: 200, views: results });
};

/**
 * Get current user's views
 * For each views, the number of default and alert
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getViewsCardByUser = async (req, res, next) => {
  const token = req.headers.authorization;

  // Decode token to get username.
  const payload = jwtoken.jwtTokenDecode(token);
  const currentUser = payload.username;

  // Get views of current user
  const userViews = await usersService.getViewsByUser(currentUser);

  if (userViews instanceof Error) {
    return res.status(405).send({ code: 405, message: userViews.message });
  }

  // Get card of equipment type
  const equipmentCard = await cardsService.getCardByType(constants.EQUIPMENT);

  if (equipmentCard instanceof Error) {
    return res.status(405).send({ code: 405, message: equipmentCard.message });
  }

  // Filters views by equipment card views and sort by position
  const results = userViews.filter((el) => {
    return equipmentCard.views.indexOf(el._id.toString()) >= 0;
  }).sort((a, b) => a.position > b.position);

  // Count default and alert variable for each view
  const promise = results.map(async (view) => {
    const result = {
      default: 0,
      alert: 0
    };
    if (view.cards.some(card => card.type === 'alert' || card.type === 'default')) {
      const toPromise = view.cards.map(async (card) => {
        if (card.type === 'alert' || card.type === 'default') {
          const variables = card.variables.map((variable) => {
            return variable._id;
          });
          const samples = await samplesService.getSelectedSamples(card.type, variables);
          result[card.type] += samples.count;
        }
      });

      await Promise.all(toPromise);
    }

    view.result = result;
    delete view.cards;
  });
  await Promise.all(promise);

  return res.status(200).send({ code: 200, views: results });
};

module.exports = {
  createNewUser,
  getUserRight,
  loginUser,
  getAllUsers,
  getViewsByUser,
  updateUser,
  deleteUser,
  updateUserviews,
  getViewsCardByUser
};
