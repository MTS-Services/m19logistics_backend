const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

// All admin routes require authentication and ADMIN or MANAGER role

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/users', adminController.getAllUsers);

router.get('/users/:id', adminController.getUserById);

router.post(
  '/users',
  authorize('ADMIN'), 
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('role').isIn(['ADMIN', 'DRIVER', 'CUSTOMER', 'MANAGER']).withMessage('Invalid role'),
    validate,
  ],
  adminController.createUser
);

router.put(
  '/users/:id',
  authorize('ADMIN'),
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  adminController.updateUser
);

router.delete('/users/:id', authorize('ADMIN'), adminController.deleteUser);

router.post('/users/:id/toggle-status', authorize('ADMIN'), adminController.toggleUserStatus);

// ==================== DELIVERY MANAGEMENT ====================


router.get('/deliveries', adminController.getAllDeliveries);

router.post(
  '/deliveries/:id/allocate',
  [
    body('driverId').isInt().withMessage('Driver ID is required'),
    validate,
  ],
  adminController.allocateDelivery
);

router.put(
  '/deliveries/:id/status',
  [
    body('status').isIn(['RECEIVED', 'ALLOCATED', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status'),
    validate,
  ],
  adminController.updateDeliveryStatus
);

// ==================== PRICING TIER MANAGEMENT ====================


router.get('/pricing-tiers', adminController.getAllPricingTiers);

router.post(
  '/pricing-tiers',
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Tier name is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }).withMessage('VAT rate must be between 0 and 100'),
    body('weightUnit').optional().isInt({ min: 1 }).withMessage('Weight unit must be a positive integer'),
    body('maxDistance').optional().isInt({ min: 1 }).withMessage('Max distance must be a positive integer'),
    body('surchargeRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Surcharge rate must be between 0 and 1'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
    validate,
  ],
  adminController.createPricingTier
);

router.put(
  '/pricing-tiers/:id',
  authorize('ADMIN'),
  [
    body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }).withMessage('VAT rate must be between 0 and 100'),
    body('weightUnit').optional().isInt({ min: 1 }).withMessage('Weight unit must be a positive integer'),
    body('maxDistance').optional().isInt({ min: 1 }).withMessage('Max distance must be a positive integer'),
    body('surchargeRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Surcharge rate must be between 0 and 1'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
    validate,
  ],
  adminController.updatePricingTier
);

router.delete('/pricing-tiers/:id', authorize('ADMIN'), adminController.deletePricingTier);

// ==================== INVOICE MANAGEMENT ====================


router.get('/invoices', adminController.getAllInvoices);

router.post(
  '/invoices/generate',
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('weekStartDate').isISO8601().withMessage('Valid start date is required'),
    body('weekEndDate').isISO8601().withMessage('Valid end date is required'),
    validate,
  ],
  adminController.generateInvoice
);

router.post('/invoices/:id/mark-paid', adminController.markInvoiceAsPaid);

router.post(
  '/invoices/:id/extra-charge',
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
    body('vatAmount').isFloat({ min: 0 }).withMessage('VAT amount must be a positive number'),
    body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
    validate,
  ],
  adminController.addExtraCharge
);

// ==================== SLOT AVAILABILITY MANAGEMENT ====================


router.get('/slots', adminController.getSlotAvailability);

router.post(
  '/slots',
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('timeSlot').isIn(['AM', 'PM', 'SAME_DAY']).withMessage('Invalid time slot'),
    body('maxCapacity').isInt({ min: 0 }).withMessage('Max capacity must be a positive integer'),
    validate,
  ],
  adminController.setSlotAvailability
);

// ==================== ANALYTICS DASHBOARD ====================


router.get('/analytics', adminController.getAnalytics);

router.get('/analytics/drivers', adminController.getDriverPerformance);

router.get('/analytics/customers', adminController.getCustomerAnalytics);

module.exports = router;
