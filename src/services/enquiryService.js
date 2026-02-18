const prisma = require('../config/database');

class EnquiryService {
  async createEnquiry(data) {
    return prisma.enquiry.create({
      data: {
        fullName: data.fullName,
        companyName: data.companyName || null,
        email: data.email,
        phoneNumber: data.phoneNumber,
        subject: data.subject,
        message: data.message,
      },
    });
  }

  async getAllEnquiries(filters = {}) {
    const { isRead, startDate, endDate } = filters;

    const where = {};

    if (isRead !== undefined) where.isRead = isRead === 'true';

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEnquiryById(id) {
    return prisma.enquiry.findUnique({
      where: { id },
    });
  }

  async markEnquiryAsRead(id) {
    return prisma.enquiry.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async deleteEnquiry(id) {
    return prisma.enquiry.delete({
      where: { id },
    });
  }
}

module.exports = new EnquiryService();