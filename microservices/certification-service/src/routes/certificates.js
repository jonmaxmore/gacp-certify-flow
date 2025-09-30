const express = require('express');
const router = express.Router();

/**
 * @route GET /api/certificates
 * @desc ดูรายการใบรับรองของผู้ใช้
 */
router.get('/', async (req, res) => {
  res.json({ 
    message: 'Certificate routes - Coming soon',
    service: 'certification-service'
  });
});

/**
 * @route GET /api/certificates/:id/download
 * @desc ดาวน์โหลดใบรับรอง
 */
router.get('/:id/download', async (req, res) => {
  res.json({ 
    message: 'Certificate download - Coming soon',
    service: 'certification-service'
  });
});

module.exports = router;