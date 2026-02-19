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
  authorize('CUSTOMER'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('isPaid').optional().isBoolean(),
    query('search').optional().trim(),
  ],
  invoiceController.getMyInvoices
);

router.get('/number/:invoiceNumber', authorize('CUSTOMER'), invoiceController.getInvoiceByNumber);

router.get('/:id', authorize('CUSTOMER'), invoiceController.getInvoiceById);

module.exports = router;
