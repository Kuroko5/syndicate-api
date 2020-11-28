'use-strict';
/* global module */
/** @module SchemaValidator */
const AJV = require('ajv');
const path = require('path');
const async = require('async');
const fs = require('fs');

class AJVHelper {
  constructor () {
    this.schemas = null;
    this.dbClient = null;
    this.ajv = null;
  }

  /**
  * Loads AJV schemas based on config
  * @async
  * @param {object} config configuration object
  */
  init (config) {
    return new Promise((resolve, reject) => {
      if (config.schemas && Array.isArray(config.schemas)) {
        try {
          this.initAjv(config.schemas);
        } catch (e) {
          return reject(e);
        }
        return resolve(true);
      }
      this.fetch(config, (err, schemas) => {
        if (err) {
          return reject(err);
        }
        try {
          this.initAjv(schemas);
        } catch (e) { return reject(e); }
        resolve(true);
      });
    });
  }

  initAjv (schemas) {
    this.ajv = new AJV({
      schemas: schemas
    });
    try {
      this.ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07'));
    } catch (e) {}// in case draft 07 is already default
    this.schemas = schemas;
  }

  fetch (config, callback) {
    this.fetchLocal(config.pathToSchemas, callback);
  }

  /**
  * Fetches schemas locally
  * @param {string} folder: the folder to be scanned recursively
  * @param {function} callback
  */
  fetchLocal (folder, callback) {
    const self = this;
    async.waterfall(
      [
        (callback) => {
          fs.readdir(folder, callback);
        },
        (filenames, callback) => {
          async.map(
            filenames,
            (filename, callback) => {
              fs.stat(path.join(folder, filename), callback);
            },
            (err, statsarray) => {
              if (err) {
                return callback(err);
              }
              var files = [];
              filenames.forEach((name, key) => {
                files.push({
                  name: name,
                  stats: statsarray[key]
                });
              });
              return callback(null, files);
            }
          );
        },
        (files, callback) => {
          async.map(
            files,
            (f, callback) => {
              var current = path.join(folder, f.name);
              switch (true) {
                case f.stats.isDirectory():
                  return self.fetchLocal(current, callback);
                case f.stats.isFile() && path.extname(f.name) === '.json':
                  return self.parseFile(current, callback);
              }
            },
            (err, result) => {
              if (err) {
                return callback(err);
              }
              return callback(null, [].concat(...result)); // flatten array (multi-dimension) result
            }
          );
        }
      ],
      callback
    );
  }

  parseFile (path, callback) {
    fs.readFile(path, (err, data) => {
      if (err) {
        return callback(err);
      }
      let json;
      try {
        json = JSON.parse(data);
      } catch (e) {
        return callback(e);
      }
      return callback(null, json);
    });
  }

  getSchema (schema) {
    if (!schema) {
      return null;
    }
    if (!this.ajv) {
      throw Error('not ready');
    }
    return this.ajv.getSchema(schema);
  }

  /**
  * Checks if js object matches the schema
  * @param {string} schema name of the schema
  * @param {object} json js object to be validated
  * @returns {Promise} resolves validation result which is a boolean value
  * @memberof SamsSchemaValidator
  */
  validate (schema, json) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (!self.ajv) {
        reject(new Error('ajv engine not ready.'));
      }
      if (!json || !schema) {
        return reject(new Error('Unexpected arguments '));
      }
      const schemaName = schema.split('.')[0];
      var validator = self.getSchema(schema).schema.definitions[schemaName];

      if (!validator) {
        return reject(new Error('Schema Not Found'));
      }

      return resolve({
        valid: this.ajv.validate(validator, json),
        error: this.ajv.errors ? this.errorResponse(this.ajv.errors) : ''
      });
    });
  }

  /**
  * Checks if js object matches the schema (sync)
  * @param {string} schema name of the schema
  * @param {object} json js object to be validated
  * @returns {boolean} validation result
  * @memberof SamsSchemaValidator
*/
  validateSync (schema, json) {
    if (!json || !schema) {
      throw new Error('Unexpected arguments ');
    }
    var validator = this.getSchema(schema);
    if (!validator) {
      throw new Error('Schema Not Found');
    }
    return validator(json);
  }

  /**
   * Format error responses
   * @param {Object} schemaErrors - array of json-schema errors, describing each validation failure
   * @return {String} formatted api response
   */
  errorResponse (schemaErrors) {
    const errors = schemaErrors.map((error) => {
      return {
        path: error.dataPath,
        message: error.message
      };
    });
    return errors;
  }
}
module.exports = AJVHelper;
