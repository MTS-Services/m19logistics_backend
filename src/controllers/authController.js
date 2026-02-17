const authService = require('../services/authService');
const userService = require('../services/userService');
const customerService = require('../services/customerService');
const driverService = require('../services/driverService');
const managerService = require('../services/managerService');
const config = require('../config');

class AuthController {

  async register(req, res) {
    try {
      const {
        email,
        username,
        password,
        fullName,
        phone,
        role,
        // Customer-specific fields
        storeName,
        depotAddress,
        pricingTierId,
        customBasePrice,
        customVatRate,
        accessScope,
        // Driver-specific fields
        vehicleRegistration,
        driverLicenseNumber,
        address,
        isActiveDriver,
        enableSmsNotifications,
        enableEmailNotifications,
        // Manager-specific fields
        officeAddress,
        assignedStoreCount,
      } = req.body;

      // Validate role
      const validRoles = ['ADMIN', 'DRIVER', 'CUSTOMER', 'MANAGER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified.',
        });
      }

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


      const userData = {
        email,
        username,
        password: hashedPassword,
        fullName,
        phone,
        role,
        requirePasswordReset: true, // User must reset password on first login
      };

      const user = await userService.createUser(userData);

      let profile = null;

      switch (role) {
        case 'CUSTOMER':
          profile = await customerService.createProfile(user.id, {
            storeName,
            depotAddress,
            pricingTierId: pricingTierId ? parseInt(pricingTierId) : null,
            customBasePrice: customBasePrice ? parseFloat(customBasePrice) : null,
            customVatRate: customVatRate ? parseFloat(customVatRate) : 20.00,
            accessScope,
          });
          break;

        case 'DRIVER':
          profile = await driverService.createProfile(user.id, {
            vehicleRegistration,
            driverLicenseNumber,
            address,
            isActiveDriver: isActiveDriver !== undefined ? isActiveDriver : true,
            enableSmsNotifications: enableSmsNotifications !== undefined ? enableSmsNotifications : false,
            enableEmailNotifications: enableEmailNotifications !== undefined ? enableEmailNotifications : true,
          });
          break;

        case 'MANAGER':
          profile = await managerService.createProfile(user.id, {
            officeAddress,
            accessScope,
            assignedStoreCount: assignedStoreCount ? parseInt(assignedStoreCount) : null,
          });
          break;

        case 'ADMIN':

          break;
      }
      const token = await authService.generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user: {
            ...user,
            profile,
          },
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

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.',
        });
      }

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

      const token = await authService.generateToken(user.id);

      await userService.updateLastLogin(user.id);

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
      res.json({
        success: true,
        message: 'Logout successful. Please remove the token from client.',
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

      const hashedPassword = await authService.hashPassword(newPassword);

      await userService.updateUser(userId, {
        password: hashedPassword,
        requirePasswordReset: false,
      });

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

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { role } = req.user;

      const {
        // Base user fields
        email,
        username,
        fullName,
        phone,
        // Customer-specific fields
        storeName,
        depotAddress,
        pricingTierId,
        customBasePrice,
        customVatRate,
        accessScope,
        // Driver-specific fields
        vehicleRegistration,
        driverLicenseNumber,
        address,
        isActiveDriver,
        enableSmsNotifications,
        enableEmailNotifications,
        // Manager-specific fields
        officeAddress,
        assignedStoreCount,
      } = req.body;


      const userUpdateData = {};

      if (email !== undefined && email !== req.user.email) {
        const existingEmail = await userService.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email already registered.', n
          });
        }
        userUpdateData.email = email;
      }

      if (username !== undefined && username !== req.user.username) {
        const existingUsername = await userService.findByUsername(username);
        if (existingUsername) {
          return res.status(400).json({
            success: false,
            message: 'Username already taken.',
          });
        }
        userUpdateData.username = username;
      }

      if (fullName !== undefined) userUpdateData.fullName = fullName;
      if (phone !== undefined) userUpdateData.phone = phone;

      // Handle uploaded profile picture
      if (req.file) {
        // Save full URL (e.g., 'https://m19logisticsbackend.mtscorporate.com/uploads/profiles/1738051234567-5-avatar.jpg')
        userUpdateData.profilePicture = `${config.backendUrl}/uploads/profiles/${req.file.filename}`;
      }

      let updatedUser = null;
      if (Object.keys(userUpdateData).length > 0) {
        updatedUser = await userService.updateUser(userId, userUpdateData);
      }

      let updatedProfile = null;

      switch (role) {
        case 'CUSTOMER': {
          const profileUpdateData = {};
          if (storeName !== undefined) profileUpdateData.storeName = storeName;
          if (depotAddress !== undefined) profileUpdateData.depotAddress = depotAddress;
          if (pricingTierId !== undefined) profileUpdateData.pricingTierId = parseInt(pricingTierId);
          if (customBasePrice !== undefined) profileUpdateData.customBasePrice = parseFloat(customBasePrice);
          if (customVatRate !== undefined) profileUpdateData.customVatRate = parseFloat(customVatRate);
          if (accessScope !== undefined) profileUpdateData.accessScope = accessScope;

          if (Object.keys(profileUpdateData).length > 0) {
            updatedProfile = await customerService.updateProfile(userId, profileUpdateData);
          }
          break;
        }

        case 'DRIVER': {
          const profileUpdateData = {};
          if (vehicleRegistration !== undefined) profileUpdateData.vehicleRegistration = vehicleRegistration;
          if (driverLicenseNumber !== undefined) profileUpdateData.driverLicenseNumber = driverLicenseNumber;
          if (address !== undefined) profileUpdateData.address = address;
          if (isActiveDriver !== undefined) profileUpdateData.isActiveDriver = isActiveDriver;
          if (enableSmsNotifications !== undefined) profileUpdateData.enableSmsNotifications = enableSmsNotifications;
          if (enableEmailNotifications !== undefined) profileUpdateData.enableEmailNotifications = enableEmailNotifications;

          if (Object.keys(profileUpdateData).length > 0) {
            updatedProfile = await driverService.updateProfile(userId, profileUpdateData);
          }
          break;
        }

        case 'MANAGER': {
          const profileUpdateData = {};
          if (officeAddress !== undefined) profileUpdateData.officeAddress = officeAddress;
          if (accessScope !== undefined) profileUpdateData.accessScope = accessScope;
          if (assignedStoreCount !== undefined) profileUpdateData.assignedStoreCount = parseInt(assignedStoreCount);

          if (Object.keys(profileUpdateData).length > 0) {
            updatedProfile = await managerService.updateProfile(userId, profileUpdateData);
          }
          break;
        }

        case 'ADMIN':
          if (Object.keys(userUpdateData).length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No fields to update.',
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid user role.',
          });
      }
      const completeUser = await userService.findById(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user: completeUser,
          updatedFields: {
            userFields: Object.keys(userUpdateData),
            profileFields: updatedProfile ? Object.keys(updatedProfile).filter(k => k !== 'id' && k !== 'userId' && k !== 'createdAt' && k !== 'updatedAt') : [],
          },
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Profile not found.',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile.',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
