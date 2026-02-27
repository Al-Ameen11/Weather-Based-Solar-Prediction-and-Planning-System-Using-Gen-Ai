const express = require('express');
const { getExistingUserDashboard, getSolarGlossary, getLatestRoiStatus } = require('../controllers/userController');

const router = express.Router();
router.get('/existing-user-dashboard', getExistingUserDashboard);
router.get('/solar-glossary', getSolarGlossary);
router.get('/latest-roi-status', getLatestRoiStatus);

module.exports = router;
