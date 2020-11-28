require('dotenv-safe').config();
const { MongoClient } = require('mongodb');
const uuid = require('uuid/v4');

const debug = require('debug');
const log = {
  info: debug('mongo:info'),
  error: debug('mongo:error'),
  debug: debug('mongo:debug')
};

const DATABASE = process.env.MONGO_DBNAME;
const APPNAME = process.env.MONGODB_APPNAME;

const SINGLETON_ENFORCER = uuid();

/**
 * Mongo Class
 *
 * How to use:
 * const mongodb = Mongo.instance();
 * const db = mongodb.connect();
 */
class Mongo {
  /**
   * Don't use de constructor
   *
   * Restrict the constructor to something that has access to a special singletonEnforcer that is not exposed outside
   * of the module. That way, the constructor fails if anyone other than the singleton tries to "new" it up.
   *
   * @param enforcer
   */
  constructor (enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Cannot construct singleton');
    }
    this.urlConnection = process.env.MONGO_URI || null;
    this.dbName = process.env.MONGO_DBNAME || null;
    this.mongoClient = null;
    this.connection = null;

    this.graceful();
  }

  /**
   * Singleton instance
   *
   * @returns {Mongo} Return instance
   */
  static instance () {
    if (!this._instance) {
      this._instance = new Mongo(SINGLETON_ENFORCER);
    }

    return this._instance;
  }

  getDbName () {
    return this.dbName;
  }

  getDb () {
    return this.connection;
  }

  /**
   * Check if MongoClient is connected
   *
   * @returns {Boolean}
   */
  isConnected () {
    if (this.mongoClient) {
      return this.mongoClient.isConnected();
    } else {
      return false;
    }
  }

  async connectAdvanced (uri, config) {
    const defaultConnectionConfig = {
      ignoreUndefined: true,
      useNewUrlParser: true,
      appname: APPNAME || DATABASE
    };

    try {
      if (!config) {
        config = defaultConnectionConfig;
        log.debug('Added a default config');
      }

      // Check if environment variable is set and the config don't have already a CA
      if (process.env.MONGO_CA && !config.ca) {
        config.ssl = true;
        config.sslCA = process.env.MONGO_CA;
        log.debug('Added CA');
      }
    } catch (e) {
      log.error(e);
      process.exit(1);
    }

    if (!this.mongoClient && !this.connection) {
      try {
        this.mongoClient = await MongoClient.connect(uri, config).catch(error =>
          log.error(error)
        );
        if (this.mongoClient) {
          this.connection = this.mongoClient.db(this.dbName);
        }
        log.info('MongoDB connected');
      } catch (error) {
        log.error(error);
        this.mongoClient = null;
        this.connection = null;
        throw error;
      }

      return this.connection;
    }
  }

  /**
   * Connect to MongoDB using a url at https://docs.mongodb.com/manual/reference/connection-string/
   * Create a new Db instance sharing the current socket connections.
   *
   * @returns {Promise<*|undefined>} db instance
   */
  async connect () {
    const defaultConnectionConfig = {
      ignoreUndefined: true,
      useNewUrlParser: true,
      appname: APPNAME || DATABASE
    };

    if (!this.mongoClient && !this.connection) {
      this.mongoClient = await MongoClient.connect(
        this.urlConnection,
        defaultConnectionConfig
      );
      this.connection = this.mongoClient.db(this.dbName);
      log.info('MongoDB connected');
    }

    return this.connection;
  }

  /**
   * Close the current db connection, including all the child db instances.
   */
  close () {
    if (this.mongoClient && this.mongoClient.isConnected()) {
      this.mongoClient.close();
      log.info('MongoDB closed');
      process.exit();
    }
    this.mongoClient = null;
    this.connection = null;
  }

  /**
   * Graceful shutdown
   *
   * Close the db connection on following signals
   * - exit
   * - SIGINT
   * - SIGTERM
   * - uncaughtException
   */
  graceful () {
    // do something when app is closing
    process.on('exit', () => {
      this.close();
      process.exit();
    });

    // catches ctrl+c event
    process.on('SIGINT', () => {
      this.close();
      process.exit();
    });
    process.on('SIGTERM', () => {
      this.close();
      process.exit();
    });
  }
}

module.exports = {
  Mongo
};
