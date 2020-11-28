const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/documentType.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');

class DocumentType {
  constructor (object) {
    // Check if object is an object
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.documentType.properties) {
      this[i] = object[i];
    }
  }

  /**
     * initializes the schema validator.and db connection
     * * Must be called before using this class
     */
  static async init () {
    if (!collections.DOCUMENTTYPE_COLL) {
      throw new Error('Missing env variable');
    }
    DocumentType.COLLECTION = collections.DOCUMENTTYPE_COLL;
    DocumentType.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await DocumentType.validator.init({ schemas: [schema] });

    DocumentType.db = instance.getDb();
  }

  /**
 * Create a documentType
 */
  static async create (documentType) {
    if (typeof documentType !== 'object') {
      throw new Error('Bad Parameter');
    }

    // Create a new documentType
    const db = await Mongo.instance().getDb();

    return db.collection(DocumentType.COLLECTION).insertOne({
      ...documentType
    });
  };

  /**
   * Get all documentType.
   */
  static async allDocumentsTypes () {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const results = db
      .collection(DocumentType.COLLECTION)
      .find({}, { projection: { language: 0 } })
      .sort({ label: 1 })
      .toArray();

    const [documentsTypes] = await Promise.all([results]);

    if (!documentsTypes) {
      return null;
    }

    return documentsTypes;
  };

  /**
   * Update a documentType.
   */
  static async updateDocumentType (id, label) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const documentType = await db.collection(DocumentType.COLLECTION).updateOne(
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

    if (!documentType) {
      return null;
    }

    return documentType;
  };

  /**
  * Delete one DocumentType.
  */
  static async deleteDocType (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // DeleteOne documentType.
    const res = await db.collection(DocumentType.COLLECTION).deleteOne({
      _id: ObjectId(id)
    });
    return res;
  };
}

module.exports = DocumentType;
