const path = require('path');
const multer = require('multer');
// Parameters to storage files
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// File size limit (0,6Go)
const maxSize = 600000000;

// Upload's basics
const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize }
}).single('file');

/**
  * Upload One File
- * @param data File data
+ * @param req File data
  * @param res
  * @returns {Object}
  */
const uploadFile = async (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, err => {
      if (err) {
        // If an error occurs during checks.
        return resolve({
          code: 400,
          message: 'Upload failed',
          error: err.message
        });
      }

      // If file is missing.
      if (!req.file) {
        return resolve({ code: 204, message: 'No file selected' });
      }

      // If everything's ok
      return resolve({
        code: 200,
        message: 'File successfully uploaded'
      });
    });
  });
};

module.exports = {
  uploadFile
};
