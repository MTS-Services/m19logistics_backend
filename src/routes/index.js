const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();


router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'M19 Logistics API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);


router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

module.exports = router;
