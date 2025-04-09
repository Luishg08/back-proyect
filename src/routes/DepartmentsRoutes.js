const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadFile'); 
const {uploadFile, getCiudades} = require('../controllers/DepartmentsController'); 

router.post('/UploadFile', upload.single('file'), uploadFile);
router.get('/',  getCiudades);

module.exports = router;