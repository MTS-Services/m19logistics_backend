const express = require('express');
const { body } = require('express-validator');
const publicController = require('../controllers/publicController');
const validate = require('../middleware/validate');

const router = express.Router();

// SLOT AVAILABILITY (PUBLIC)

router.get('/slots/availability', publicController.getSlotAvailability);


router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('message').trim().notEmpty().withMessage('Message is required'),
    validate,
  ],
  publicController.submitContact
);

router.post(
  '/enquiry',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('companyName').optional().trim(),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    validate,
  ],
  publicController.submitEnquiry
);

module.exports = router;
