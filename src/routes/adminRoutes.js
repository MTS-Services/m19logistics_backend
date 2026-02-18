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

//DELIVERY MANAGEMENT 


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

router.post(
  '/deliveries/:id/extra-charges',
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    validate,
  ],
  adminController.addExtraCharge
);

router.delete(
  '/deliveries/:id/extra-charges/:chargeId',
  adminController.removeExtraCharge
);

router.get(
  '/deliveries/:id/extra-charges',
  adminController.getDeliveryExtraCharges
);

//  PRICING TIER MANAGEMENT 


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

//INVOICE MANAGEMENT 


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

router.post(
  '/invoices/generate-all',
  [
    body('weekStartDate').isISO8601().withMessage('Valid start date is required'),
    body('weekEndDate').isISO8601().withMessage('Valid end date is required'),
    validate,
  ],
  adminController.generateWeeklyInvoicesForAll
);

router.post(
  '/invoices/generate-last-week',
  adminController.generateLastWeekInvoices
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

// INVOICE EDITING 

router.get('/invoices/:id', adminController.getInvoiceById);

router.put(
  '/invoices/:id',
  [
    body('invoiceNumber').optional().matches(/^T\d{4,}$/).withMessage('Invoice number must be in format T#### (e.g., T0326)'),
    body('customerId').optional().isInt().withMessage('Customer ID must be an integer'),
    body('invoiceDate').optional().isISO8601().withMessage('Valid invoice date is required'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
    body('status').optional().isString().trim(),
    body('customerRef').optional().isString().trim(),
    body('notes').optional().isString().trim(),
    body('paymentTerms').optional().isString().trim(),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('items.*.deliveryId').optional().isInt().withMessage('Delivery ID must be an integer'),
    body('items.*.spoNumber').optional().isString().trim(),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
    body('items.*.vatAmount').isFloat({ min: 0 }).withMessage('VAT amount must be a positive number'),
    body('items.*.total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
    body('items.*.deliveryDate').optional().isISO8601().withMessage('Valid delivery date is required'),
    body('items.*.address').optional().isString().trim(),
    body('items.*.basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('items.*.distanceSurcharge').optional().isFloat({ min: 0 }).withMessage('Distance surcharge must be a positive number'),
    validate,
  ],
  adminController.updateInvoice
);

// SLOT AVAILABILITY MANAGEMENT


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

router.put(
  '/slots/:id/capacity',
  [
    body('method').isIn(['increase', 'decrease']).withMessage('Method must be either "increase" or "decrease"'),
    body('value').isInt({ min: 1 }).withMessage('Value must be a positive integer'),
    validate,
  ],
  adminController.updateSlotCapacity
);

router.get('/dashboard', adminController.getDashboard);

// ANALYTICS DASHBOARD 


router.get('/analytics', adminController.getAnalytics);

router.get('/analytics/drivers', adminController.getDriverPerformance);

router.get('/analytics/customers', adminController.getCustomerAnalytics);

//  CONTACT MANAGEMENT

router.get('/contacts', adminController.getAllContacts);

router.get('/contacts/:id', adminController.getContactById);

router.post('/contacts/:id/mark-read', adminController.markContactAsRead);

router.delete('/contacts/:id', authorize('ADMIN'), adminController.deleteContact);

//  ENQUIRY MANAGEMENT 

router.get('/enquiries', adminController.getAllEnquiries);

router.get('/enquiries/:id', adminController.getEnquiryById);

router.post('/enquiries/:id/mark-read', adminController.markEnquiryAsRead);

router.delete('/enquiries/:id', authorize('ADMIN'), adminController.deleteEnquiry);

//  JOB APPLICATION MANAGEMENT 

const jobApplicationController = require('../controllers/jobApplicationController');

// Get all job applications
router.get('/job-applications', jobApplicationController.getAllJobApplications);

// Get job application statistics
router.get('/job-applications/stats', jobApplicationController.getJobApplicationStats);

// Get single job application by ID
router.get('/job-applications/:id', jobApplicationController.getJobApplicationById);

// Update job application status
router.patch(
  '/job-applications/:id/status',
  [
    body('status')
      .optional()
      .isIn(['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED'])
      .withMessage('Invalid status value'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  ],
  jobApplicationController.updateJobApplicationStatus
);

// Delete job application
router.delete('/job-applications/:id', authorize('ADMIN'), jobApplicationController.deleteJobApplication);

// AUDIT LOGS (ADMIN)

router.get('/audit-logs', adminController.getAllAuditLogs);

router.get('/audit-logs/:id', adminController.getAuditLogById);

//  EXPORT ROUTES 

// Export Invoice as PDF
router.get('/invoices/:id/export/pdf', adminController.exportInvoicePDF);

// Export Deliveries (Excel or CSV)
router.get('/deliveries/export', adminController.exportDeliveries);

// Export Analytics (Excel or CSV)
router.get('/analytics/export', adminController.exportAnalytics);

// SYSTEM SETTINGS (ADMIN ONLY)

const settingsController = require('../controllers/settingsController');

// Get all settings
router.get('/settings', authorize('ADMIN'), settingsController.getAllSettings);

// Get system status summary
router.get('/settings/status/summary', authorize('ADMIN'), settingsController.getSystemStatus);

// Get settings by category
router.get('/settings/:category', authorize('ADMIN'), settingsController.getSettingsByCategory);

// Get invoice generation config
router.get('/settings/invoice/config', authorize('ADMIN'), settingsController.getInvoiceConfig);

// Update company information
router.put(
  '/settings/company',
  authorize('ADMIN'),
  [
    body('name').optional().isString().withMessage('Company name must be a string'),
    body('vat_number').optional().isString().withMessage('VAT number must be a string'),
    body('primary_phone').optional().isString().withMessage('Primary phone must be a string'),
    body('alternative_phone').optional().isString().withMessage('Alternative phone must be a string'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('founded_year').optional().isString().withMessage('Founded year must be a string'),
    validate,
  ],
  settingsController.updateCompanyInfo
);

// Update banking details
router.put(
  '/settings/banking',
  authorize('ADMIN'),
  [
    body('bank_name').optional().isString().withMessage('Bank name must be a string'),
    body('account_holder').optional().isString().withMessage('Account holder must be a string'),
    body('sort_code').optional().isString().withMessage('Sort code must be a string'),
    body('account_number').optional().isString().withMessage('Account number must be a string'),
    body('payment_terms').optional().isString().withMessage('Payment terms must be a string'),
    validate,
  ],
  settingsController.updateBankingDetails
);

// Update system configuration
router.put(
  '/settings/system',
  authorize('ADMIN'),
  [
    body('invoice_generation_day').optional().isString().withMessage('Invoice generation day must be a string'),
    body('invoice_generation_time').optional().isString().withMessage('Invoice generation time must be a string'),
    body('session_timeout').optional().isString().withMessage('Session timeout must be a string'),
    body('auto_invoicing').optional().isString().withMessage('Auto invoicing must be a string'),
    body('email_notifications').optional().isString().withMessage('Email notifications must be a string'),
    body('sms_notifications').optional().isString().withMessage('SMS notifications must be a string'),
    body('maps_api_enabled').optional().isString().withMessage('Maps API enabled must be a string'),
    validate,
  ],
  settingsController.updateSystemConfig
);

// Update single setting
router.put(
  '/settings/single',
  authorize('ADMIN'),
  [
    body('key').notEmpty().withMessage('Setting key is required'),
    body('value').notEmpty().withMessage('Setting value is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    validate,
  ],
  settingsController.updateSingleSetting
);

module.exports = router;
