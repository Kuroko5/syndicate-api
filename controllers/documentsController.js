const documentsService = require('../services/documentsService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const path = require('path');
const fs = require('fs-extra');
const { uploadFile } = require('../middlewares/upload');

/**
 * Add a new document.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const addDocument = async (req, res, next) => {
  try {
    // Call service to upload file.
    const upload = await uploadFile(req);

    if (upload.code !== 200) {
      // if upload failed.
      return res.status(400).send(upload);
    }

    if (!req.body.fileName) {
      throw new Error('Bad Parameter');
    }
    // Create document's structure and add the file uploaded.
    const buffer = fs.readFileSync(
      path.join(__dirname, `../uploads/${req.body.fileName}`)
    );

    if (!buffer) {
      return res.status(500).send({ message: 'Error buffer' });
    }

    const { title, documentTypeId, documentCategoryId, operator } = req.body;

    if (!documentTypeId) {
      return res.status(400).send({ message: 'Error document type is empty' });
    }

    // Control if one documentType exist with this id.
    const documentType = await serviceUtils.isExist(documentTypeId, collections.DOCUMENTTYPE_COLL);

    if (documentType instanceof Error) {
      return res.status(404).send({ code: 404, message: documentType.message });
    }

    // Control if one documentType exist with this id.
    const documentCategory = await serviceUtils.isExist(documentCategoryId, collections.DOCUMENTCATEGORY_COLL);

    if (documentCategory instanceof Error) {
      return res.status(404).send({ code: 404, message: documentCategory.message });
    }

    // const categoryId = ObjectId(documentCategoryId);
    const document = {
      title: title,
      documentType,
      documentCategory,
      operator: operator,
      fileName: req.body.fileName,
      fileType: req.body.fileType,
      file: buffer
    };

    const result = await documentsService.addANewDocument(document);
    fs.unlinkSync(path.join(__dirname, `../uploads/${req.body.fileName}`));

    if (!result) {
      return res.status(406).send({ code: 406, message: 'Invalid schema' });
    }

    return res.status(200).send({ code: 200, message: 'A new document has been added' });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all documents with sort, pagination and search by date.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllDocuments = async (req, res, next) => {
  try {
    const allDocumentsCreated = await serviceUtils.getAllResults(req.query, collections.DOCUMENT_COLL);

    if (allDocumentsCreated instanceof Error) {
      return res.status(404).send({ code: 404, message: allDocumentsCreated.message });
    }

    return res.status(200).send({ code: 200, data: allDocumentsCreated });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete one document (metadata and file uploaded).
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteOneFile = async (req, res, next) => {
  const { id } = req.params;

  try {
    await documentsService.deleteDocument(id);
    return res.status(200).send({ code: 200, message: ' The file is deleted' });
  } catch (e) {
    next(e);
  }
};

/**
 * Update one document.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const updateDocument = async (req, res, next) => {
  // Build new document with new metadata.
  try {
    const { id } = req.params;
    const upload = await uploadFile(req);
    const code = upload.code;
    const { title, documentTypeId, documentCategoryId, operator } = req.body;

    const documentType = await serviceUtils.isExist(documentTypeId, collections.DOCUMENTTYPE_COLL);
    if (documentType instanceof Error) {
      return res.status(404).send({ code: 404, message: documentType.message });
    }

    const documentCategory = await serviceUtils.isExist(documentCategoryId, collections.DOCUMENTCATEGORY_COLL);
    if (documentCategory instanceof Error) {
      return res.status(404).send({ code: 404, message: documentCategory.message });
    }

    let document = {
      title: title,
      documentType,
      documentCategory,
      operator: operator
    };

    if (code === 200) { // File successfully uploaded
      if (!req.body.fileName) {
        throw new Error('Bad Parameter');
      } else {
        const buffer = fs.readFileSync(
          path.join(__dirname, `../uploads/${req.body.fileName}`)
        );
        if (!buffer) {
          return { code: 500, message: 'Error upload' };
        }
        document = {
          ...document,
          fileName: req.body.fileName,
          fileType: req.body.fileType,
          file: buffer
        };
        fs.unlinkSync(path.join(__dirname, `../uploads/${req.body.fileName}`));
      }
    }

    const result = await documentsService.modifyDocument(id, document);

    if (result) {
      return res.status(200).send({ code: 200, message: 'A new document has been updated' });
    } else {
      return res.status(406).send({ code: 406, message: 'Invalid schema' });
    }
  } catch (e) {
    next(e);
  }
};

/**
 * Get metadata for one document.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getOneDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }
    const getDocument = await documentsService.getDocument(id);
    if (getDocument) {
      return res.status(200).send({ code: 200, data: getDocument });
    } else {
      return res.status(404).send({ code: 404, message: 'Not Found' });
    }
  } catch (e) {
    next(e);
  }
};

/**
 * Get file description for one document.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getOneFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }
    const getDocument = await documentsService.getFileUploaded(id);
    if (getDocument) {
      return res.status(200).send(getDocument);
    } else {
      return res.status(404).send({ code: 404, message: 'Not Found' });
    }
  } catch (e) {
    next(e);
  }
};

module.exports = {
  addDocument,
  getAllDocuments,
  deleteOneFile,
  updateDocument,
  getOneDocument,
  getOneFile
};
