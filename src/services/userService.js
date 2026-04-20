const prisma = require("../config/database");

class UserService {
  async createUser(userData) {
    return prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        profilePicture: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          },
        },
        driverProfile: true,
        managerProfile: true,
      },
    });
  }

  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        customerProfile: true,
        driverProfile: true,
        managerProfile: true,
      },
    });
  }

  async updateUser(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        profilePicture: true,
        updatedAt: true,
      },
    });
  }

  async updateLastLogin(id) {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async getUsersByRole(role) {
    return prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(id) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = new UserService();
