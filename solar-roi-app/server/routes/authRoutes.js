const express = require('express');
const { signup, signin } = require('../controllers/authController');

const router = express.Router();
router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

module.exports = router;
