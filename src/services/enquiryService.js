const prisma = require("../config/database");
const emailService = require("./emailService");

class EnquiryService {
  async createEnquiry(data) {
    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: data.fullName,
        companyName: data.companyName || null,
        email: data.email,
        phoneNumber: data.phoneNumber,
        subject: data.subject,
        message: data.message,
      },
    });

    emailService
      .sendEnquiryNotification(enquiry)
      .catch((err) =>
        console.error("Enquiry notification email failed:", err.message),
      );

    return enquiry;
  }

  async getAllEnquiries(filters = {}) {
    const { isRead, startDate, endDate } = filters;

    const where = {};

    if (isRead !== undefined) where.isRead = isRead === "true";

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

  async getUnreadCount() {
    return prisma.enquiry.count({
      where: { isRead: false },
    });
  }

  async markAllAsRead() {
    const result = await prisma.enquiry.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return { markedCount: result.count };
  }
}

module.exports = new EnquiryService();
