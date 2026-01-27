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

  async getAssignedDeliveries(driverId, filters = {}) {
    const { status, startDate, endDate, search } = filters;
    
    const where = { driverId };
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.deliveryDate = {};
      if (startDate) where.deliveryDate.gte = new Date(startDate);
      if (endDate) where.deliveryDate.lte = new Date(endDate);
    }
    
    if (search) {
      where.OR = [
        { spoNumber: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.delivery.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
                depotAddress: true,
              }
            }
          }
        },
        extraCharges: true,
        driverFeedback: true,
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { timeSlot: 'asc' }
      ],
    });
  }


  async getDeliveryDetails(deliveryId, driverId) {
    const delivery = await prisma.delivery.findFirst({
      where: { 
        id: deliveryId,
        driverId 
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
                depotAddress: true,
              }
            }
          }
        },
        extraCharges: true,
        driverFeedback: true,
        additionalDeliveries: {
          include: {
            extraCharges: true,
          }
        }
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    return delivery;
  }


  async completeDelivery(deliveryId, driverId, completionData) {
    const delivery = await prisma.delivery.findFirst({
      where: { 
        id: deliveryId,
        driverId,
        status: 'ALLOCATED'
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found, not assigned to you, or already completed');
    }

    const { receivedBy, signatureUrl, photoUrl } = completionData;

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        receivedBy,
        signatureUrl,
        photoUrl,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
            customerProfile: {
              select: {
                loginId: true,
              }
            }
          }
        },
        driver: {
          select: {
            fullName: true,
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: driverId,
        deliveryId: deliveryId,
        action: 'COMPLETE_DELIVERY',
        description: `Delivery marked as DELIVERED by driver ${updated.driver.fullName}. Received by: ${receivedBy}`,
      }
    });

    return updated;
  }

 
  async uploadProofOfDelivery(deliveryId, driverId, files) {
    const delivery = await prisma.delivery.findFirst({
      where: { 
        id: deliveryId,
        driverId 
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    const updateData = {};
    
    if (files.signature && files.signature[0]) {
      updateData.signatureUrl = `/uploads/signatures/${files.signature[0].filename}`;
    }
    
    if (files.photo && files.photo.length > 0) {
      updateData.photoUrl = files.photo.map(f => `/uploads/photos/${f.filename}`).join(',');
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      select: {
        id: true,
        signatureUrl: true,
        photoUrl: true,
        status: true,
      }
    });
  }

  
  async submitFeedback(deliveryId, driverId, feedbackData) {
    const delivery = await prisma.delivery.findFirst({
      where: { 
        id: deliveryId,
        driverId 
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    const { rating, comments, issues } = feedbackData;
    
    // Combine feedback into notes field
    const notes = `Rating: ${rating}/5\n${comments ? 'Comments: ' + comments : ''}${issues ? '\nIssues: ' + issues : ''}`.trim();

    const existingFeedback = await prisma.driverFeedback.findUnique({
      where: { deliveryId }
    });

    if (existingFeedback) {
      return prisma.driverFeedback.update({
        where: { deliveryId },
        data: { notes }
      });
    } else {
      return prisma.driverFeedback.create({
        data: {
          deliveryId,
          driverId,
          notes,
        }
      });
    }
  }

 
  async getDriverDashboard(driverId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [allocated, completed, todayDeliveries, thisWeekDeliveries] = await Promise.all([
      prisma.delivery.count({
        where: { driverId, status: 'ALLOCATED' }
      }),

      prisma.delivery.count({
        where: { driverId, status: 'DELIVERED' }
      }),

      prisma.delivery.findMany({
        where: {
          driverId,
          deliveryDate: {
            gte: today,
            lt: tomorrow,
          }
        },
        include: {
          customer: {
            select: {
              fullName: true,
              customerProfile: {
                select: {
                  loginId: true,
                }
              }
            }
          }
        },
        orderBy: { timeSlot: 'asc' }
      }),

      prisma.delivery.count({
        where: {
          driverId,
          deliveryDate: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          }
        }
      }),
    ]);

    return {
      stats: {
        pendingDeliveries: allocated,
        completedDeliveries: completed,
        todayDeliveries: todayDeliveries.length,
        thisWeekDeliveries,
      },
      todaySchedule: todayDeliveries,
    };
  }

 
  async getPerformanceMetrics(driverId, startDate, endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        ...(startDate || endDate ? { deliveredAt: dateFilter } : {}),
      },
      include: {
        driverFeedback: true,
      }
    });

    const totalDeliveries = deliveries.length;
    const completedOnTime = deliveries.filter(d => d.status === 'DELIVERED').length;

    return {
      totalDeliveries,
      completedDeliveries: completedOnTime,
      completionRate: totalDeliveries > 0 ? ((completedOnTime / totalDeliveries) * 100).toFixed(2) : 0,
      feedbackCount: deliveries.filter(d => d.driverFeedback).length,
    };
  }
}

module.exports = new DriverService();
