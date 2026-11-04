const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All dashboard routes are protected
router.use(protect);

router.get('/summary', getDashboardSummary);

module.exports = router;
