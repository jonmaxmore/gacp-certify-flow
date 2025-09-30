const express = require('express');
const router = express.Router();

/**
 * @route POST /api/documents/upload
 * @desc อัพโหลดเอกสาร
 */
router.post('/upload', async (req, res) => {
  res.json({ 
    message: 'Document upload - Coming soon',
    service: 'certification-service'
  });
});

/**
 * @route GET /api/documents/:id
 * @desc ดูเอกสาร
 */
router.get('/:id', async (req, res) => {
  res.json({ 
    message: 'Document view - Coming soon',
    service: 'certification-service'
  });
});

module.exports = router;