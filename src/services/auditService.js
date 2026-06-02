const prisma = require("../config/database");

class AuditService {
  async getUserAuditLogs(userId, filters = {}) {
    const { startDate, endDate, action, deliveryId, limit = 5000 } = filters;

    const where = { userId };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (deliveryId) {
      where.deliveryId = parseInt(deliveryId);
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        delivery: {
          select: {
            id: true,
            deliveryDate: true,
            deliveryAddress: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });
  }

  async getAllAuditLogs(filters = {}) {
    const {
      userId,
      startDate,
      endDate,
      action,
      deliveryId,
      status,
      limit = 50000,
    } = filters;

    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (deliveryId) {
      where.deliveryId = parseInt(deliveryId);
    }
    if (status) {
      where.delivery = {
        status: status,
      };
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        delivery: {
          select: {
            id: true,
            deliveryDate: true,
            deliveryAddress: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });
  }

  async getAuditLogById(id, userId = null) {
    const where = { id };

    if (userId) {
      where.userId = userId;
    }

    return prisma.auditLog.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        delivery: {
          select: {
            id: true,
            deliveryDate: true,
            deliveryAddress: true,
            status: true,
            customer: {
              select: {
                fullName: true,
                customerProfile: {
                  select: {
                    loginId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createAuditLog(data) {
    const {
      userId,
      deliveryId,
      action,
      description,
      reason,
      beforeData,
      afterData,
      ipAddress,
      userAgent,
    } = data;

    return prisma.auditLog.create({
      data: {
        userId: userId || null,
        deliveryId: deliveryId || null,
        action,
        description,
        reason: reason || null,
        beforeData: beforeData || null,
        afterData: afterData || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  }
}

module.exports = new AuditService();
