const documentsCategoriesService = require('../services/documentsCategoriesService');
const documentsService = require('../services/documentsService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
/**
 * Get all categories
 * @param {*} req
 * @param {*} res
 * @param {*} res
 */
const getAllCategories = async (req, res, next) => {
  try {
    const allDocumentsCategories = await serviceUtils.getAllResults(req.params, collections.DOCUMENTCATEGORY_COLL);

    if (allDocumentsCategories instanceof Error) {
      return res.status(404).send({ code: 404, message: allDocumentsCategories.message });
    }
    return res.status(200).send({ data: allDocumentsCategories.result });
  } catch (e) {
    next(e);
  }
};
/**
 * Add a new document.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createCategory = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data.label) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    const find = await serviceUtils.isExist(data.label, collections.DOCUMENTCATEGORY_COLL);
    if (find && find.label) {
      return res.status(404).send({ message: 'This category already exists' });
    }

    const document = {
      ...data,
      language: 'fr-fr'
    };

    const result = await documentsCategoriesService.create(document);
    if (result) {
      return res.status(200).send({ code: 200, message: 'New document category added' });
    } else {
      return res.status(406).send({ code: 406, message: 'Invalid schema' });
    }
  } catch (e) {
    next(e);
  }
};
/**
 * Update one category.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }
    // Check if all fields are completed.
    if (!label) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    const documentCategory = await documentsCategoriesService.modifyDocumentCategory(id, label);

    if (documentCategory instanceof Error) {
      return res.status(404).send({ code: 404, message: documentCategory.message });
    }

    return res.status(200).send({ code: 200, message: 'Category updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Update one category.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentCategoryId } = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ code: 400, message: ' Wrong id' });
    }

    // Check if a categoryId is not empty.
    if (documentCategoryId) {
      const result = await documentsService.transferAllDocumentInNewCategory(id, documentCategoryId);

      if (result instanceof Error) {
        return res.status(400).send({ code: 400, message: result.message });
      }
    } else {
      const result = await documentsService.deleteDocumentsFromCategory(id);

      if (!result) {
        return res.status(400).send({ code: 400, message: 'Could not update all documents' });
      }
    }

    const documentCategory = await documentsCategoriesService.deleteDocumentCategory(id);

    if (!documentCategory) {
      return res.status(404).send({ code: 404, message: 'Not Found' });
    }

    return res.status(200).send({ code: 200, message: 'Category deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
