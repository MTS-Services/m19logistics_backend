const prisma = require('../config/database');

class DriverService {
  /**
   * Create driver profile
   */
  async createProfile(userId, profileData) {
    return prisma.driverProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
  }

  /**
   * Get driver profile by user ID
   */
  async getProfileByUserId(userId) {
    return prisma.driverProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Update driver profile
   */
  async updateProfile(userId, updateData) {
    return prisma.driverProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Get all active drivers
   */
  async getActiveDrivers() {
    return prisma.driverProfile.findMany({
      where: {
        isActiveDriver: true,
        user: {
          isActive: true,
          role: 'DRIVER',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            phone: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  /**
   * Toggle driver active status
   */
  async toggleActiveStatus(userId, isActive) {
    return prisma.driverProfile.update({
      where: { userId },
      data: { isActiveDriver: isActive },
    });
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId, smsEnabled, emailEnabled) {
    return prisma.driverProfile.update({
      where: { userId },
      data: {
        enableSmsNotifications: smsEnabled,
        enableEmailNotifications: emailEnabled,
      },
    });
  }
}

module.exports = new DriverService();
