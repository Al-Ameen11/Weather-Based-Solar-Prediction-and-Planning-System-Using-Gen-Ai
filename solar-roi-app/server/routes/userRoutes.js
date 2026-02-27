const express = require('express');
const { getExistingUserDashboard, getSolarGlossary, getLatestRoiStatus } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/existing-user-dashboard', requireAuth, getExistingUserDashboard);
router.get('/solar-glossary', getSolarGlossary);
router.get('/latest-roi-status', requireAuth, getLatestRoiStatus);

module.exports = router;
