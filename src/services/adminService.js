const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminService {
  // ==================== USER MANAGEMENT ====================
  
  /**
   * Get all users with filters
   */
  async getAllUsers(filters = {}) {
    const { role, isActive, search } = filters;
    
    const where = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          }
        },
        driverProfile: true,
        managerProfile: true,
        _count: {
          select: {
            deliveriesRequested: true,
            deliveriesAssigned: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          }
        },
        driverProfile: true,
        managerProfile: true,
        deliveriesRequested: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        deliveriesAssigned: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
      },
    });
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const { email, password, role, ...profileData } = userData;

    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      email,
      username: email.split('@')[0], // Generate username from email
      password: hashedPassword,
      fullName: userData.fullName,
      phone: userData.phone,
      role,
      isActive: userData.isActive !== false,
    };

    if (role === 'CUSTOMER') {
      data.customerProfile = {
        create: {
          storeName: profileData.storeName,
          depotAddress: profileData.depotAddress,
          loginId: profileData.loginId,
          pricingTierId: profileData.pricingTierId,
          customBasePrice: profileData.customBasePrice,
        }
      };
    } else if (role === 'DRIVER') {
      data.driverProfile = {
        create: {
          vehicleRegistration: profileData.vehicleRegistration,
          isActiveDriver: profileData.isActiveDriver !== false,
        }
      };
    } else if (role === 'MANAGER') {
      data.managerProfile = {
        create: {
          accessScope: profileData.accessScope || 'FULL',
        }
      };
    }

    return prisma.user.create({
      data,
      include: {
        customerProfile: true,
        driverProfile: true,
        managerProfile: true,
      },
    });
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    const { password, role, ...data } = updateData;

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'CUSTOMER' && updateData.customerProfile) {
      data.customerProfile = {
        update: updateData.customerProfile
      };
    } else if (user.role === 'DRIVER' && updateData.driverProfile) {
      data.driverProfile = {
        update: updateData.driverProfile
      };
    } else if (user.role === 'MANAGER' && updateData.managerProfile) {
      data.managerProfile = {
        update: updateData.managerProfile
      };
    }

    return prisma.user.update({
      where: { id },
      data,
      include: {
        customerProfile: true,
        driverProfile: true,
        managerProfile: true,
      },
    });
  }


  async deleteUser(id) {
    // Check if user has any deliveries
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deliveriesRequested: true,
            deliveriesAssigned: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user._count.deliveriesRequested > 0 || user._count.deliveriesAssigned > 0) {
      // Soft delete - deactivate instead
      return this.updateUser(id, { isActive: false });
    }

    // Hard delete if no deliveries
    return prisma.user.delete({
      where: { id },
    });
  }

 
  async toggleUserStatus(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  // ==================== DELIVERY MANAGEMENT ====================

  async getAllDeliveries(filters = {}) {
    const { status, startDate, endDate, customerId, driverId, search } = filters;
    
    const where = {};
    
    if (status && status !== 'ALL') where.status = status;
    if (customerId) where.customerId = parseInt(customerId);
    if (driverId) where.driverId = parseInt(driverId);
    
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
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
              }
            }
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

 
  async allocateDelivery(deliveryId, driverId) {
    // Check if delivery exists and is in RECEIVED status
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status !== 'RECEIVED') {
      throw new Error('Can only allocate pending deliveries');
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true }
    });

    if (!driver || driver.role !== 'DRIVER') {
      throw new Error('Invalid driver');
    }

    if (!driver.driverProfile?.isActiveDriver) {
      throw new Error('Driver is not active');
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driver: {
          connect: { id: driverId }
        },
        status: 'ALLOCATED',
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
          }
        },
        driver: {
          select: {
            fullName: true,
            email: true,
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: driverId,
        deliveryId: deliveryId,
        action: 'ALLOCATE_DELIVERY',
        description: `Delivery #${deliveryId} allocated to ${driver.fullName}`,
      },
    });

    return updated;
  }

  async updateDeliveryStatus(deliveryId, status, data = {}) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const updateData = { status };

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      if (data.proofOfDelivery) updateData.proofOfDelivery = data.proofOfDelivery;
      if (data.signature) updateData.signature = data.signature;
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = data.reason || 'Cancelled by admin';
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });
  }

  // ==================== PRICING TIER MANAGEMENT ====================

 
  async getAllPricingTiers() {
    return prisma.pricingTier.findMany({
      include: {
        _count: {
          select: {
            customerProfiles: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

 
  async createPricingTier(tierData) {
    // If setting as default, unset other defaults
    if (tierData.isDefault) {
      await prisma.pricingTier.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.pricingTier.create({
      data: tierData,
    });
  }


  async updatePricingTier(id, tierData) {
    if (tierData.isDefault) {
      await prisma.pricingTier.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false },
      });
    }

    return prisma.pricingTier.update({
      where: { id },
      data: tierData,
    });
  }

 
  async deletePricingTier(id) {
    
    const count = await prisma.customerProfile.count({
      where: { pricingTierId: id }
    });

    if (count > 0) {
      throw new Error(`Cannot delete pricing tier. ${count} customers are using it.`);
    }

    return prisma.pricingTier.delete({
      where: { id },
    });
  }

  // ==================== INVOICE MANAGEMENT ====================

  /**
   * Generate weekly invoice for a customer
   */
  async generateInvoice(customerId, weekStartDate, weekEndDate) {
    
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        status: 'DELIVERED',
        deliveredAt: {
          gte: new Date(weekStartDate),
          lte: new Date(weekEndDate),
        },
        invoiceItemId: null, 
      },
    });

    if (deliveries.length === 0) {
      throw new Error('No deliveries to invoice for this period');
    }

    const lastInvoiceSetting = await prisma.systemSetting.findUnique({
      where: { key: 'LAST_INVOICE_NUMBER' },
    });

    const lastNumber = parseInt(lastInvoiceSetting?.value || '326');
    const nextNumber = lastNumber + 1;
    const invoiceNumber = `T${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = deliveries.reduce((sum, d) => sum + parseFloat(d.subtotal), 0);
    const vatTotal = deliveries.reduce((sum, d) => sum + parseFloat(d.vatAmount), 0);
    const grandTotal = deliveries.reduce((sum, d) => sum + parseFloat(d.totalPrice), 0);

    
    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        invoiceNumber,
        invoiceDate: new Date(),
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        subtotal,
        vatTotal,
        grandTotal,
        isPaid: false,
        paymentTerms: '30 Days (End of Month)',
        items: {
          create: deliveries.map(delivery => ({
            deliveryId: delivery.id,
            description: `Cust. Ref: ${delivery.spoNumber} / ${new Date(delivery.deliveryDate).toLocaleDateString()} / ${delivery.deliveryAddress}`,
            quantity: 1,
            unitCost: parseFloat(delivery.subtotal),
            vatAmount: parseFloat(delivery.vatAmount),
            total: parseFloat(delivery.totalPrice),
            isAdditional: false,
          })),
        },
      },
      include: {
        items: {
          include: {
            delivery: true,
          }
        },
      },
    });

   
    await prisma.systemSetting.update({
      where: { key: 'LAST_INVOICE_NUMBER' },
      data: { value: String(nextNumber) },
    });

    return invoice;
  }

  
  async getAllInvoices(filters = {}) {
    const { customerId, isPaid, startDate, endDate } = filters;
    
    const where = {};
    
    if (customerId) where.customerId = parseInt(customerId);
    if (isPaid !== undefined) where.isPaid = isPaid === 'true';
    
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    return prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
              }
            }
          }
        },
        items: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

 
  async markInvoiceAsPaid(invoiceId) {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }

  async addExtraCharge(invoiceId, chargeData) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.isPaid) {
      throw new Error('Cannot modify paid invoice');
    }


    const item = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        description: chargeData.description,
        quantity: chargeData.quantity || 1,
        unitCost: chargeData.unitCost,
        vatAmount: chargeData.vatAmount,
        total: chargeData.total,
        isAdditional: true,
      },
    });

    // Recalculate invoice totals
    const subtotal = parseFloat(invoice.subtotal) + parseFloat(chargeData.unitCost);
    const vatTotal = parseFloat(invoice.vatTotal) + parseFloat(chargeData.vatAmount);
    const grandTotal = parseFloat(invoice.grandTotal) + parseFloat(chargeData.total);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, vatTotal, grandTotal },
    });

    return item;
  }

  // ==================== SLOT AVAILABILITY MANAGEMENT ====================

  
  async getSlotAvailability(filters = {}) {
    const { date, timeSlot } = filters;
    
    const where = {};
    
    if (date) where.date = new Date(date);
    if (timeSlot) where.timeSlot = timeSlot;

    return prisma.slotAvailability.findMany({
      where,
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    });
  }

  async setSlotAvailability(slotData) {
    const { date, timeSlot, maxCapacity, isAvailable } = slotData;

    const existing = await prisma.slotAvailability.findUnique({
      where: {
        date_timeSlot: {
          date: new Date(date),
          timeSlot,
        }
      }
    });

    if (existing) {
      return prisma.slotAvailability.update({
        where: { id: existing.id },
        data: { maxCapacity, isAvailable },
      });
    }

    return prisma.slotAvailability.create({
      data: {
        date: new Date(date),
        timeSlot,
        maxCapacity,
        currentBookings: 0,
        isAvailable: isAvailable !== false,
      },
    });
  }

  // ==================== ANALYTICS DASHBOARD ====================

  async getAnalytics(filters = {}) {
    const { startDate, endDate } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      totalDeliveries,
      deliveriesByStatus,
      totalRevenue,
      totalInvoices,
      paidInvoices,
      activeCustomers,
      activeDrivers,
      recentDeliveries,
    ] = await Promise.all([
      // Total deliveries
      prisma.delivery.count({
        where: startDate || endDate ? { createdAt: dateFilter } : {}
      }),
      
      prisma.delivery.groupBy({
        by: ['status'],
        _count: true,
        where: startDate || endDate ? { createdAt: dateFilter } : {}
      }),
      
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          ...(startDate || endDate ? { invoiceDate: dateFilter } : {}),
        }
      }),
      
      prisma.invoice.count({
        where: startDate || endDate ? { invoiceDate: dateFilter } : {}
      }),
      
      prisma.invoice.count({
        where: {
          isPaid: true,
          ...(startDate || endDate ? { invoiceDate: dateFilter } : {})
        }
      }),
      
      prisma.user.count({
        where: { role: 'CUSTOMER', isActive: true }
      }),
      
      prisma.user.count({
        where: { 
          role: 'DRIVER', 
          isActive: true,
          driverProfile: {
            isActiveDriver: true
          }
        }
      }),
      
     
      prisma.delivery.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              fullName: true,
              customerProfile: {
                select: { loginId: true }
              }
            }
          },
          driver: {
            select: { fullName: true }
          }
        }
      }),
    ]);

    return {
      summary: {
        totalDeliveries,
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        totalInvoices,
        paidInvoices,
        unpaidInvoices: totalInvoices - paidInvoices,
        activeCustomers,
        activeDrivers,
      },
      deliveriesByStatus: deliveriesByStatus.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count;
        return acc;
      }, {}),
      recentDeliveries,
    };
  }

 
  async getDriverPerformance(filters = {}) {
    const { startDate, endDate } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const drivers = await prisma.user.findMany({
      where: { 
        role: 'DRIVER',
        driverProfile: {
          isActiveDriver: true
        }
      },
      include: {
        driverProfile: true,
        deliveriesAssigned: {
          where: startDate || endDate ? { allocatedAt: dateFilter } : {},
          select: {
            status: true,
            deliveredAt: true,
          }
        }
      }
    });

    return drivers.map(driver => {
      const deliveries = driver.deliveriesAssigned;
      const completed = deliveries.filter(d => d.status === 'DELIVERED').length;
      const pending = deliveries.filter(d => d.status === 'ALLOCATED').length;
      
      return {
        id: driver.id,
        name: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        vehicleRegistration: driver.driverProfile?.vehicleRegistration,
        totalAssigned: deliveries.length,
        completed,
        pending,
        completionRate: deliveries.length > 0 ? ((completed / deliveries.length) * 100).toFixed(2) : 0,
      };
    });
  }

  
  async getCustomerAnalytics(filters = {}) {
    const { startDate, endDate } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const customers = await prisma.user.findMany({
      where: { 
        role: 'CUSTOMER',
        isActive: true
      },
      include: {
        customerProfile: {
          include: {
            pricingTier: true
          }
        },
        deliveriesRequested: {
          where: startDate || endDate ? { createdAt: dateFilter } : {},
        },
        invoices: {
          where: startDate || endDate ? { invoiceDate: dateFilter } : {},
        }
      }
    });

    return customers.map(customer => {
      const totalSpent = customer.invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal), 0);
      const totalDeliveries = customer.deliveriesRequested.length;
      
      return {
        id: customer.id,
        name: customer.fullName,
        email: customer.email,
        loginId: customer.customerProfile?.loginId,
        storeName: customer.customerProfile?.storeName,
        pricingTier: customer.customerProfile?.pricingTier?.name,
        totalDeliveries,
        totalSpent: totalSpent.toFixed(2),
        averageOrderValue: totalDeliveries > 0 ? (totalSpent / totalDeliveries).toFixed(2) : 0,
      };
    });
  }
}

module.exports = new AdminService();
