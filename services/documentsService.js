const { Mongo } = require('../app/class/mongo');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/document.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const debug = require('debug');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const DocumentCategory = require('./documentsCategoriesService');
const log = {
  info: debug('document:info'),
  error: debug('document:error'),
  debug: debug('document:debug')
};

class Document {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.document.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator.and db connection
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.DOCUMENT_COLL) {
      throw new Error('Missing env variable');
    }
    Document.COLLECTION = collections.DOCUMENT_COLL;
    Document.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Document.validator.init({ schemas: [schema] });

    Document.db = instance.getDb();
  }

  /**
 * Add a new document in database.
 */
  static async addANewDocument (document) {
    if (typeof document !== 'object') {
      throw new Error('Bad Parameter');
    }

    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();
    const isValid = await Document.isDocument(document);
    if (isValid.valid) {
      // Create a new document
      return db.collection(Document.COLLECTION).insertOne({
        ...document,
        createdAt: moment().toDate(),
        updatedAt: moment().toDate()
      });
    } else {
      log.debug('Warning - couldn\'t insert document \n', document);
      return null;
    }
  };

  /**
 * Delete one document.
 */
  static async deleteDocument (id) {
    // Retrieve instance of Mongo.
    const db = await Mongo.instance().getDb();

    // Find the document to have the fileName.
    const res = await db.collection(Document.COLLECTION).deleteOne({
      _id: ObjectId(id)
    });

    return res;
  };

  /**
 * Update one document with metadata and file.
 */
  static async modifyDocument (id, document) {
    if (typeof document !== 'object') {
      throw new Error('Bad Parameter');
    }
    const db = await Mongo.instance().getDb();
    const isValid = await Document.isDocument(document);
    if (isValid.valid) {
      // Create a new document
      // Uploaded document with new informations.
      const res = await db.collection(Document.COLLECTION).updateOne(
        {
          _id: ObjectId(id)
        },
        {
          $set: {
            ...document,
            updatedAt: moment().toDate()
          }
        }
      );
      return res;
    } else {
      log.debug('Warning - couldn\'t modify document \n', document);
      return null;
    }
  };

  /**
 * Get one Document.
 */
  static async getDocument (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();
    // Find Document
    const result = await db.collection(Document.COLLECTION).findOne(ObjectId(id));

    // If a document is found.
    if (result) {
      return result;
    }
    return null;
  };

  /**
 * Get one file uploaded.
 */
  static async getFileUploaded (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Find Document in database.
    const document = await db.collection(Document.COLLECTION).findOne(ObjectId(id));

    // If no document found.
    if (!document) {
      return null;
    }
    // Transform buffer.
    const result = Buffer.from(document.file.buffer);
    return result;
  };

  /**
  * Update all document from a documentCategoryId with a new category Id
  */
  static async transferAllDocumentInNewCategory (current, newCategoryId) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Find Current Category in database.
    const currentDocumentCategory = await serviceUtils.isExist(ObjectId(current), collections.DOCUMENTCATEGORY_COLL);

    if (currentDocumentCategory.isDefault) {
      return new Error('Could not update or delete a default category');
    }

    // Find new Category in database.
    const newDocumentCategory = await serviceUtils.isExist(ObjectId(newCategoryId), collections.DOCUMENTCATEGORY_COLL);

    if (!newDocumentCategory) {
      return new Error('Could not find the new category');
    }

    newDocumentCategory._id = ObjectId(newDocumentCategory._id);

    // Find Documents in database.
    let documents = await db.collection(Document.COLLECTION).find({
      'documentCategory._id': ObjectId(currentDocumentCategory._id)
    })
      .toArray();

    documents = documents.map((d) => ObjectId(d._id));

    // If no documents found.
    if (!documents || !documents.length) {
      log.debug('Does not have documents to update');
    }

    const results = await db.collection(Document.COLLECTION).update(
      {
        _id: { $in: documents }
      },
      {
        $set: {
          documentCategory: newDocumentCategory,
          updatedAt: moment().toDate()
        }
      },
      { multi: true }
    );

    return results;
  };

  /**
 * Delete all documents from a documentCategoryId
 */
  static async deleteDocumentsFromCategory (documentCategoryId) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Find Documents in database.
    const currentDocumentCategory = await db.collection(DocumentCategory.COLLECTION).findOne({
      _id: ObjectId(documentCategoryId)
    });

    if (currentDocumentCategory.isDefault) {
      log.debug('Could not update or delete a default category');
      return null;
    }

    const results = await db.collection(Document.COLLECTION).remove(
      {
        'documentCategory._id': ObjectId(currentDocumentCategory._id)
      }
    );

    if (!results) {
      return null;
    }

    return results;
  };

  static async isDocument (object) {
    return Document.validator.validate('document.schema.json', object);
  }
}

module.exports = Document;
