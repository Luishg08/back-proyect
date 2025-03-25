const express = require('express');
const router = express.Router();
const {getAllUsers} = require('../controllers/UserController.js');


router.get('/', getAllUsers);
module.exports = router;
