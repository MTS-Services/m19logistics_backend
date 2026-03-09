const express = require('express');
const { query } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize('CUSTOMER', 'ADMIN', 'MANAGER'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('isPaid').optional().isBoolean(),
    query('search').optional().trim(),
    query('customerId').optional().isInt(),
  ],
  invoiceController.getMyInvoices
);

router.get('/number/:invoiceNumber', authorize('CUSTOMER', 'ADMIN', 'MANAGER'), invoiceController.getInvoiceByNumber);
router.get('/:id/export/pdf', authorize('CUSTOMER', 'ADMIN', 'MANAGER'), invoiceController.exportInvoicePDF);
router.get('/:id', authorize('CUSTOMER', 'ADMIN', 'MANAGER'), invoiceController.getInvoiceById);

module.exports = router;