const prisma = require('../config/database');

class DriverService {

  async createProfile(userId, profileData) {
    return prisma.driverProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
  }

  async getProfileByUserId(userId) {
    return prisma.driverProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(userId, updateData) {
    return prisma.driverProfile.update({
      where: { userId },
      data: updateData,
    });
  }

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


  async toggleActiveStatus(userId, isActive) {
    return prisma.driverProfile.update({
      where: { userId },
      data: { isActiveDriver: isActive },
    });
  }


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
