const prisma = require('../config/database');

class ManagerService {

  async createProfile(userId, profileData) {
    return prisma.managerProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
  }

  async getProfileByUserId(userId) {
    return prisma.managerProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(userId, updateData) {
    return prisma.managerProfile.update({
      where: { userId },
      data: updateData,
    });
  }


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
