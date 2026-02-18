const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jobApplicationController = require('../controllers/jobApplicationController');
const uploadMiddleware = require('../middleware/upload');

/**
 * @route   POST /api/jobs/apply
 * @desc    Submit a job application (Public - no auth required)
 * @access  Public
 */
router.post(
    '/apply',
    uploadMiddleware.cv, // Handle CV file upload
    [
        body('fullName')
            .trim()
            .notEmpty()
            .withMessage('Full name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('phoneNumber')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required')
            .matches(/^[0-9\s\+\-\(\)]+$/)
            .withMessage('Please provide a valid phone number'),
        body('positionOfInterest')
            .trim()
            .notEmpty()
            .withMessage('Position of interest is required')
            .isIn(['Driver', 'Operations', 'Office & Support', 'Others'])
            .withMessage('Invalid position selection'),
        body('coverLetter')
            .trim()
            .notEmpty()
            .withMessage('Cover letter/message is required')
            .isLength({ min: 5, max: 2000 })
            .withMessage('Cover letter must be between 5 and 2000 characters'),
    ],
    jobApplicationController.submitJobApplication
);

module.exports = router;
