require('dotenv-safe').config();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { Mongo } = require('./app/class/mongo');
const collections = require('./utils/collections');
const {
  Strategy: JWTStrategy,
  ExtractJwt: ExtractJWT
} = require('passport-jwt');
const jwtSecret = process.env.JWTSECRET;

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  done(null, id);
});

/**
 * Configuration passport.
 * @param {*} req
 * @param {*} res
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    (username, password, cb) => {
      const db = Mongo.instance().getDb();
      db.collection(collections.USER_COLL).findOne({ username: username }, (err, result) => {
        if (err) {
          return cb(null, false, {
            message: `We crashed, here is the message : ${err}`
          });
        }
        const user = result;
        if (!user) {
          return cb(null, false, {
            message: 'Incorrect username.'
          });
        } else {
          bcrypt.compare(password, user.password, (errBcrypt, result) => {
            if (result === true) {
              return cb(
                null,
                { username: user.username },
                { message: 'Logged In Successfully' }
              );
            } else {
              return cb(null, false, {
                message: 'Incorrect password.'
              });
            }
          });
        }
      });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    },
    (jwtPayload, cb) => {
      const user = jwtPayload;
      return cb(null, user);
    }
  )
);
