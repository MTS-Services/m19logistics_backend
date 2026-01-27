const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const uploadMiddleware = require('../middleware/upload');
const driverController = require('../controllers/driverController');

// All routes require DRIVER role
router.use(authenticate);
router.use(authorize('DRIVER'));

/**
 * @route   GET /api/driver/dashboard
 * @desc    Get driver dashboard with stats and today's schedule
 * @access  Driver
 */
router.get('/dashboard', driverController.getDashboard);


router.get('/deliveries', driverController.getAssignedDeliveries);


router.get('/deliveries/:id', 
  param('id').isInt().withMessage('Delivery ID must be an integer'),
  driverController.getDeliveryDetails
);


router.post('/deliveries/:id/upload-proof',
  param('id').isInt().withMessage('Delivery ID must be an integer'),
  uploadMiddleware.proofOfDelivery,
  driverController.uploadProofOfDelivery
);


router.post('/deliveries/:id/complete',
  [
    param('id').isInt().withMessage('Delivery ID must be an integer'),
    body('receivedBy')
      .trim()
      .notEmpty().withMessage('Received by name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Received by name must be 2-100 characters'),
    body('signatureUrl')
      .optional()
      .isString().withMessage('Signature URL must be a string'),
    body('photoUrl')
      .optional()
      .isString().withMessage('Photo URL must be a string'),
  ],
  driverController.completeDelivery
);


router.post('/deliveries/:id/feedback',
  [
    param('id').isInt().withMessage('Delivery ID must be an integer'),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Comments must not exceed 500 characters'),
    body('issues')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Issues must not exceed 500 characters'),
  ],
  driverController.submitFeedback
);


router.get('/performance', driverController.getPerformanceMetrics);

module.exports = router;
