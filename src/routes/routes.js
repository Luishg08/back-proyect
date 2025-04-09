const express = require('express');
const router = express.Router();
const authRoutes = require('./AuthRoutes');
const usersRoutes = require('./UsersRoutes');
const departmentsRoutes = require('./DepartmentsRoutes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
module.exports = router;