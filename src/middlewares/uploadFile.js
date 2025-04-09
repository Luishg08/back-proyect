const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname) !== '.csv') {
    return cb(new Error('Solo se permiten archivos .csv'));
  }
  cb(null, true);
};

const uploadFile = multer({ storage, fileFilter });
module.exports = uploadFile;