const bcrypt = require('bcrypt');
const salt = 12;
const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const collections = require('./collections');
const { Parser } = require('json2csv');

/**
 *  Hash new password.
 * @param {*} password - The password to hash
 */
exports.hashUserPassword = async function hashUserPassword (password) {
  const hash = await bcrypt.hash(password, salt);

  if (!hash) {
    return new Error('Error hash password');
  }
  return hash;
};

/**
 *  Check if the object already exists with id of label
 * @param {*} value - The query ( id or label)
 * @param {*} collection - The collection to query
 */
exports.isExist = async function isExist (value, collection) {
  // Retrieve instance of Mongo
  const db = await Mongo.instance().getDb();
  const query = {};

  // Check if value is a label or id.
  if (ObjectId.isValid(value)) {
    query._id = ObjectId(value);
  } else {
    query.label = value;
  }

  // Get object.
  const getObject = await db.collection(collection).findOne(query);

  if (!getObject) {
    return new Error('Can not found this specific object');
  }
  return getObject;
};

/**
 * Convert json to csv
 * @param {*} data - The list of objects
 * @param {*} fields - The list of fields
 */
exports.json2csv = async function json2csv (data, fields) {
  const opts = { fields, quote: '', delimiter: ';', withBOM: true };
  const parser = new Parser(opts);
  return parser.parse(data);
};

/**
 * Generic getAll to find all documents regarding type, search, pagination
 * @param {*} params - The query object with all params.
 * @param {*} collection - The collection to query
 */
exports.getAllResults = async function getAllResults (params = {}, collection) {
  // Retrieve instance of Mongo
  const db = await Mongo.instance().getDb();

  // Prepare the query regarding params.
  let query = {};

  // Search by label, name, title, username regarding collection.
  const searchQuery = params.search || '';

  if (searchQuery && searchQuery !== '') {
    switch (collection) {
      case collections.DOCUMENT_COLL:
        query.title = { $regex: searchQuery, $options: 'i' };
        break;
      case collections.REPORT_COLL:
        query.name = { $regex: searchQuery, $options: 'i' };
        break;
      case collections.USER_COLL:
        query.username = { $regex: searchQuery, $options: 'i' };
        break;
      case collections.VARIABLE_COLL:
        query.vId = { $regex: searchQuery, $options: 'i' };
        break;
      default:
        query.label = { $regex: searchQuery, $options: 'i' };
    }
  }

  // Prepare the return projection and filter with category or type.
  let projection = false;

  switch (collection) {
    case collections.DOCUMENT_COLL:
      // Filter by category or type.
      if (params.category && params.category !== 'all') {
        query = { ...query, 'documentCategory._id': ObjectId(params.category) };
      }

      if (params.type && params.type !== 'all') {
        query = { ...query, 'documentType.label': params.type };
      }
      projection = false;
      break;

    case collections.PROFILE_COLL:
      projection = { label: 1, description: 1, permissions: 1, views: 1, isDefault: 1, createdAt: 1 };
      break;

    case collections.VARIABLE_COLL:
      projection = false;
      // Set params filters
      if (params.equipmentId) {
        query = { ...query, 'device.equipmentId': params.equipmentId };
      }
      if (params.machineId) {
        query = { ...query, 'device.machineId': params.machineId };
      }
      if (params.deviceId) {
        query = { ...query, deviceId: params.deviceId };
      }
      break;

    case collections.REPORT_COLL:
      projection = { name: 1, operator: 1, createdAt: 1, reportType: 1 };
      // Filter by type.
      if (params.type && params.type !== 'all') {
        query = { ...query, 'reportType.label': params.type };
      }
      break;

    case collections.REPORTTYPE_COLL:
      projection = { label: 1 };
      break;

    default:
      if (params.type && params.type !== 'all') {
        query.type = params.type;
      }
      // Filter by category.
      if (params.category && params.category !== 'all') {
        query.category = params.category;
      }
      projection = false;
  }

  // Prepare sorting by column.
  let customSort = {};
  if (params.column) {
    customSort[params.column] = parseInt(params.sort);
    customSort._id = 1;
  } else {
    // default sorting
    customSort = { _id: 1 };
  }

  // Prepare pagination and several params.
  const currentPage = parseInt(params.page) || 1;
  const currentLimit = parseInt(params.limit) || 25;
  const skip = (currentPage - 1) * currentLimit;

  let resultQuery = db
    .collection(collection)
    .aggregate(
      projection ? [
        { $match: query },
        { $project: projection },
        { $sort: customSort },
        { $skip: skip },
        { $limit: currentLimit }
      ]
        : [
          { $match: query },
          { $sort: customSort },
          { $skip: skip },
          { $limit: currentLimit }
        ])
    .toArray();

  let countQuery = db.collection(collection).find(query).count();
  if (collection === collections.VARIABLE_COLL) {
    resultQuery = db
      .collection(collection)
      .aggregate([
        {
          $lookup: {
            from: 'Devices',
            localField: 'deviceId',
            foreignField: '_id',
            as: 'device'
          }
        },
        { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
        { $match: query },
        { $sort: customSort },
        { $skip: skip },
        { $limit: currentLimit }
      ])
      .toArray();
    countQuery = db
      .collection(collection)
      .aggregate([
        {
          $lookup: {
            from: 'Devices',
            localField: 'deviceId',
            foreignField: '_id',
            as: 'device'
          }
        },
        { $match: query },
        { $count: 'total' }
      ])
      .toArray();
  }
  // getting result and total count.
  let [result, count] = await Promise.all([
    resultQuery,
    countQuery
  ]);

  if (!result) {
    return new Error('Can not find results for this search.');
  }

  if (collection === collections.VARIABLE_COLL) {
    count = count[0] ? count[0].total : 0;
  }

  return { count, result };
};
