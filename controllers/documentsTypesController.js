const documentsTypesService = require('../services/documentsTypesService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
/**
 * Add a new documentType.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createDocType = async (req, res, next) => {
  try {
    const data = req.body;

    // Label is required.
    if (!data.label) {
      return res.status(404).send({ code: 404, message: 'The label is required' });
    }

    // Check if a documentType do not already exist before create.
    const isExist = await serviceUtils.isExist(data.label, collections.DOCUMENTTYPE_COLL);

    if (isExist && isExist.label) {
      return res.status(404).send({ code: 404, message: 'This type already exists' });
    }

    // Add language.
    const documentType = {
      ...data,
      language: 'fr-fr'
    };

    const result = await documentsTypesService.create(documentType);

    if (!result) {
      return res.status(406).send({ code: 406, message: 'Can not create this documentType' });
    }
    return res.status(200).send({ code: 200, message: 'New document type added' });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all documentType.
 * @param {*} req
 * @param {*} res
 * @param {*} res
 */
const getAllDocumentTypes = async (req, res, next) => {
  try {
    const allDocumentsTypes = await serviceUtils.getAllResults(req.query, collections.DOCUMENTTYPE_COLL);

    if (allDocumentsTypes instanceof Error) {
      return res.status(404).send({ code: 404, message: allDocumentsTypes.message });
    }
    return res.status(200).send({ code: 200, data: allDocumentsTypes.result });
  } catch (e) {
    next(e);
  }
};

/**
 * Get one documentType by Id.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getOneDoc = async (req, res, next) => {
  try {
    const { id } = req.params;

    const documentType = await serviceUtils.isExist(id, collections.DOCUMENTTYPE_COLL);

    if (documentType instanceof Error) {
      return res.status(404).send({ code: 404, message: document });
    }
    return res.status(200).send({ code: 200, data: documentType });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a documentType.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const updateDocType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }

    // Check if all fields are completed.
    if (!label) {
      return res.status(404).send({ message: 'The label is required' });
    }

    const documentType = await documentsTypesService.updateDocumentType(id, label);

    if (documentType instanceof Error) {
      return res.status(404).send({ code: 404, message: document.message });
    }

    return res.status(200).send({ message: 'DocumentType updated with success' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete one documentType.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const deleteOneDocType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }

    const result = await documentsTypesService.deleteDocType(id);
    if (!result) {
      return res.status(400).send({ code: 400, message: 'Can not delete this documentType' });
    }
    return res.status(200).send({ code: 200, message: 'DocumentType deleted with sucess' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createDocType,
  getAllDocumentTypes,
  getOneDoc,
  updateDocType,
  deleteOneDocType
};
