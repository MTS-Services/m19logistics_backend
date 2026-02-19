const express = require('express');
const authRoutes = require('./authRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const adminRoutes = require('./adminRoutes');
const driverRoutes = require('./driverRoutes');
const publicRoutes = require('./publicRoutes');
const jobApplicationRoutes = require('./jobApplicationRoutes');

const router = express.Router();


router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'M19 Logistics API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/admin', adminRoutes);
router.use('/driver', driverRoutes);
router.use('/jobs', jobApplicationRoutes);


router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

module.exports = router;
