const prisma = require('../config/database');

class ManagerService {
  /**
   * Create manager profile
   */
  async createProfile(userId, profileData) {
    return prisma.managerProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
  }

  /**
   * Get manager profile by user ID
   */
  async getProfileByUserId(userId) {
    return prisma.managerProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Update manager profile
   */
  async updateProfile(userId, updateData) {
    return prisma.managerProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Get all managers
   */
  async getAllManagers() {
    return prisma.managerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            phone: true,
            profilePicture: true,
            isActive: true,
          },
        },
      },
    });
  }
}

module.exports = new ManagerService();
