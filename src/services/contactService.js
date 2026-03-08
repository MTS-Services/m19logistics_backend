const prisma = require('../config/database');
const emailService = require('./emailService');

class ContactService {
  async createContact(data) {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
      },
    });

    emailService.sendContactNotification(contact).catch(err =>
      console.error('Contact notification email failed:', err.message)
    );

    return contact;
  }

  async getAllContacts(filters = {}) {
    const { isRead, startDate, endDate } = filters;

    const where = {};

    if (isRead !== undefined) where.isRead = isRead === 'true';

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContactById(id) {
    return prisma.contact.findUnique({
      where: { id },
    });
  }

  async markContactAsRead(id) {
    return prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async deleteContact(id) {
    return prisma.contact.delete({
      where: { id },
    });
  }
}

module.exports = new ContactService();