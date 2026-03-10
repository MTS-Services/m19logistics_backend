const prisma = require("../config/database");
const { generateCustomerLoginId } = require("../utils/generateLoginId");

class CustomerService {
  async createProfile(userId, profileData) {
    // Auto-generate loginId if not provided
    if (!profileData.loginId) {
      profileData.loginId = await generateCustomerLoginId();
    }

    return prisma.customerProfile.create({
      data: {
        userId,
        ...profileData,
      },
      include: {
        pricingTier: true,
      },
    });
  }

  async getProfileByUserId(userId) {
    return prisma.customerProfile.findUnique({
      where: { userId },
      include: {
        pricingTier: true,
      },
    });
  }

  async updateProfile(userId, updateData) {
    return prisma.customerProfile.update({
      where: { userId },
      data: updateData,
      include: {
        pricingTier: true,
      },
    });
  }

  async getByLoginId(loginId) {
    return prisma.customerProfile.findUnique({
      where: { loginId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
        pricingTier: true,
      },
    });
  }

  async loginIdExists(loginId) {
    const profile = await prisma.customerProfile.findUnique({
      where: { loginId },
    });
    return !!profile;
  }
}

module.exports = new CustomerService();
