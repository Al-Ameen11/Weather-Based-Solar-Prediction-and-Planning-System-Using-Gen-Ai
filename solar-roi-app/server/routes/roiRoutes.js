const express = require('express');
const { calculateRoi } = require('../controllers/roiController');

const router = express.Router();
router.post('/calculate-roi', calculateRoi);

module.exports = router;
