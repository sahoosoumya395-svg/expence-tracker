const express = require('express');
const router = express.Router();
const { getReportSummary, exportCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// All report routes are protected
router.use(protect);

router.get('/summary', getReportSummary);
router.get('/export', exportCSV);

module.exports = router;
