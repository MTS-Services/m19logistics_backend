const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const uploadMiddleware = require('../middleware/upload');
const driverController = require('../controllers/driverController');

// All routes require authentication
router.use(authenticate);

// ==================== AVAILABILITY VIEW ROUTES (DRIVER, ADMIN, MANAGER) ====================
// These routes allow ADMIN and MANAGER to view driver availability

router.get('/availability',
  authorize('DRIVER', 'ADMIN', 'MANAGER'),
  driverController.getMyAvailability
);

router.get('/availability/upcoming',
  authorize('DRIVER', 'ADMIN', 'MANAGER'),
  driverController.getMyUpcomingAvailability
);

// ==================== DRIVER-ONLY ROUTES ====================
// All routes below require DRIVER role only
router.use(authorize('DRIVER'));

router.get('/dashboard', driverController.getDashboard);


router.get('/deliveries', driverController.getAssignedDeliveries);


router.get('/deliveries/:id',
  param('id').isInt().withMessage('Delivery ID must be an integer'),
  driverController.getDeliveryDetails
);


router.post('/deliveries/:id/respond',
  [
    param('id').isInt().withMessage('Delivery ID must be an integer'),
    body('action').isIn(['accept', 'reject']).withMessage('Action must be "accept" or "reject"'),
    body('reason').if(body('action').equals('reject')).notEmpty().withMessage('Rejection reason is required'),
  ],
  driverController.respondToDelivery
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
    body('photoUrls')
      .optional()
      .isArray().withMessage('photoUrls must be an array of image URLs'),
    body('photoUrls.*')
      .optional()
      .isString().withMessage('Each photo URL must be a string'),
    body('photoUrl')
      .optional()
      .custom((value) => {
        if (Array.isArray(value) || typeof value === 'string') return true;
        throw new Error('photoUrl must be a string or array of strings');
      }),
  ],
  driverController.completeDelivery
);


router.post('/deliveries/:id/feedback',
  [
    param('id').isInt().withMessage('Delivery ID must be an integer'),
    body('comments')
      .trim()
      .notEmpty().withMessage('Comments is required')
      .isLength({ max: 500 }).withMessage('Comments must not exceed 500 characters'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('issues').optional().trim().isLength({ max: 500 }),
    validate,
  ],
  driverController.submitFeedback
);


router.get('/performance', driverController.getPerformanceMetrics);

router.get('/slots', driverController.getSlotCapacity);


// ==================== DRIVER AVAILABILITY MANAGEMENT (DRIVER ONLY) ====================

router.post(
  '/availability',
  [
    body('date').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
    body('timeSlot').isIn(['AM', 'PM', 'SAME_DAY']).withMessage('Time slot must be AM, PM, or SAME_DAY'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validate,
  ],
  driverController.setMyAvailability
);

router.post(
  '/availability/bulk',
  [
    body('startDate').isISO8601().withMessage('Valid start date is required (YYYY-MM-DD)'),
    body('endDate').isISO8601().withMessage('Valid end date is required (YYYY-MM-DD)'),
    body('timeSlots').isArray({ min: 1 }).withMessage('At least one time slot is required'),
    body('timeSlots.*').isIn(['AM', 'PM', 'SAME_DAY']).withMessage('Each time slot must be AM, PM, or SAME_DAY'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validate,
  ],
  driverController.bulkSetMyAvailability
);

router.put(
  '/availability/:id',
  [
    param('id').isInt().withMessage('Availability ID must be an integer'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validate,
  ],
  driverController.updateMyAvailability
);

router.delete(
  '/availability/:id',
  [
    param('id').isInt().withMessage('Availability ID must be an integer'),
    validate,
  ],
  driverController.deleteMyAvailability
);

module.exports = router;
