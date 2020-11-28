const jwt = require('../utils/jwt');
const { Mongo } = require('./../app/class/mongo');
const collections = require('../utils/collections');

/**
 * middleware to check if the user got the right to use this routes
 * @param right (permissions)
 * @param req
 * @param res
 * @param next
 */
exports.rightMiddleware = async (right, req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).send({
      type: 'PERMISSIONS_ERROR_NEEDED'
    });
  }
  const payload = jwt.jwtTokenDecode(token);
  const { exp } = payload;

  if (new Date() >= new Date(exp * 1000)) {
    res.status(498).send({ code: 498, message: 'The token has expired' });
  } else {
    const db = await Mongo.instance().getDb();
    const user = await db.collection(collections.USER_COLL).findOne({ username: payload.username });
    const allProfiles = [];
    const allPermissions = new Set();

    user.profiles.forEach(profile => {
      allProfiles.push(profile._id);
    });

    const profiles = await db.collection(collections.PROFILE_COLL).find({
      _id: { $in: allProfiles }
    }).toArray();

    profiles.forEach(profile => {
      profile.permissions.forEach((permission) => {
        // TODO: update this part after implémentation of the collection Permission
        allPermissions.add(permission.code);
      });
    });

    if (user !== null) {
      const getRight = right.some(r => [...allPermissions].includes(r));
      if (getRight) {
        next();
      } else {
        res.status(401).send({
          type: 'PERMISSIONS_ERROR_NEEDED'
        });
      }
    } else {
      res.status(401).send({
        type: 'PERMISSIONS_ERROR_NEEDED',
        message: 'wrong token'
      });
    }
  }
};
