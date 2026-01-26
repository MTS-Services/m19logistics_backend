const authService = require('../services/authService');
const userService = require('../services/userService');

class AuthController {

  async register(req, res) {
    try {
      const { email, username, password, fullName, phone, role } = req.body;

      // Check if user already exists
      const existingEmail = await userService.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered.',
        });
      }

      const existingUsername = await userService.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken.',
        });
      }

      
      const hashedPassword = await authService.hashPassword(password);

    
      const user = await userService.createUser({
        email,
        username,
        password: hashedPassword,
        fullName,
        phone,
        role: role || 'CUSTOMER',
      });

      // Generate token
      const token = await authService.generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed.',
        error: error.message,
      });
    }
  }


  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await userService.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.',
        });
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.',
        });
      }

      // Generate token
      const token = await authService.generateToken(user.id);

      // Update last login
      await userService.updateLastLogin(user.id);

      // Remove password from response
      delete user.password;

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user,
          token,
          requirePasswordReset: user.requirePasswordReset,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed.',
        error: error.message,
      });
    }
  }


  async logout(req, res) {
    try {
      const token = req.token;

      // Revoke token
      await authService.revokeToken(token);

      res.json({
        success: true,
        message: 'Logout successful.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed.',
        error: error.message,
      });
    }
  }

 
  async getProfile(req, res) {
    try {
      const user = await userService.findById(req.user.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile.',
        error: error.message,
      });
    }
  }


  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await userService.findByEmail(req.user.email);

      // Verify current password
      const isPasswordValid = await authService.comparePassword(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      // Hash new password
      const hashedPassword = await authService.hashPassword(newPassword);

      
      await userService.updateUser(userId, {
        password: hashedPassword,
        requirePasswordReset: false,
      });

      
      await authService.revokeAllUserTokens(userId);

      const token = await authService.generateToken(userId);

      res.json({
        success: true,
        message: 'Password changed successfully.',
        data: { token },
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password.',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
