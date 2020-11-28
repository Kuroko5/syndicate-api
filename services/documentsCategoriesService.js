const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/documentCategory.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const debug = require('debug');
const log = {
  info: debug('DocumentCategory:info'),
  error: debug('DocumentCategory:error'),
  debug: debug('DocumentCategory:debug')
};

class DocumentCategory {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.documentCategory.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator.and db connection
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.DOCUMENTCATEGORY_COLL) {
      throw new Error('Missing env variable');
    }
    DocumentCategory.COLLECTION = collections.DOCUMENTCATEGORY_COLL;
    DocumentCategory.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await DocumentCategory.validator.init({ schemas: [schema] });

    DocumentCategory.db = instance.getDb();
  }

  /**
   * Get all categories
   */
  static async allDocumentsCategories () {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const documentsCategoriesQuery = db
      .collection(DocumentCategory.COLLECTION)
      .find({})
      .sort({ label: 1 })
      .toArray();

    const [documentsCategories] = await Promise.all([documentsCategoriesQuery]);

    if (!documentsCategories) {
      return null;
    }

    return documentsCategories;
  };

  /**
 * Create a category
 */
  static async create (document) {
    if (typeof document !== 'object') {
      throw new Error('Bad Parameter');
    }

    // Set default = false if is not a default folder
    if (!document.isDefault) {
      document.isDefault = false;
    }

    const isValid = await DocumentCategory.isDocument(document);

    if (!isValid) {
      log.debug('Warning - couldn\'t insert document \n', document);
      return null;
    }

    // Create a new document
    const db = await Mongo.instance().getDb();

    return db.collection(DocumentCategory.COLLECTION).insertOne({
      ...document
    });
  };

  /**
   * Get a category by label
   */
  static async one (id) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const documentCategory = await db.collection(DocumentCategory.COLLECTION).findOne(
      {
        _id: ObjectId(id)
      }
    );

    if (!documentCategory) {
      return null;
    }

    return documentCategory;
  };

  /**
   * Modify a category
   */
  static async modifyDocumentCategory (id, label) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const documentCategoryFound = await serviceUtils.isExist(id, DocumentCategory.COLLECTION);

    // if document Category with id exist
    if (!documentCategoryFound) {
      return new Error('This category does not exists');
    }

    // if document category is default, update is impossible
    if (documentCategoryFound.isDefault) {
      return new Error('This category is an default category, can not be update');
    }

    // check if label is the same of the category to update
    if (label === documentCategoryFound.label) {
      return documentCategoryFound;
    }

    const exist = await serviceUtils.isExist(label, DocumentCategory.COLLECTION);

    if (exist && exist.label) {
      return new Error('This category already exists');
    }

    const documentCategory = await db.collection(DocumentCategory.COLLECTION).updateOne(
      {
        _id: ObjectId(id),
        language: 'fr-fr'
      },
      {
        $set: {
          label: label
        }
      }
    );

    if (!documentCategory.matchedCount) {
      return null;
    }

    return documentCategory;
  };

  /**
   * delete a category
   */
  static async deleteDocumentCategory (id) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const documentCategory = await serviceUtils.isExist(id, DocumentCategory.COLLECTION);

    if (documentCategory instanceof Error) {
      return new Error('Can not found this category');
    }

    if (documentCategory.isDefault) {
      log.debug('Could not delete a default category');
      return null;
    }

    const result = await db.collection(DocumentCategory.COLLECTION).remove({ _id: ObjectId(id) }, true);

    if (!result) {
      return null;
    }

    return result;
  };

  static async isDocument (object) {
    return DocumentCategory.validator.validate('documentCategory.schema.json', object);
  }
}

module.exports = DocumentCategory;
