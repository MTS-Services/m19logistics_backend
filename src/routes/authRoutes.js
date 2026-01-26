const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = express.Router();


router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('role').optional().isIn(['ADMIN', 'DRIVER', 'CUSTOMER', 'MANAGER']).withMessage('Invalid role'),
    validate,
  ],
  authController.register
);


router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);


router.post('/logout', authenticate, authController.logout);


router.get('/me', authenticate, authController.getProfile);


router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
  ],
  authController.changePassword
);

// Update user's own profile
router.patch('/profile', authenticate, authController.updateProfile);

module.exports = router;
