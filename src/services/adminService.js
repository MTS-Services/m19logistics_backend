const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const emailService = require('./emailService');

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

    // Clear previous rejection/acceptance data when reassigning
    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driver: {
          connect: { id: driverId }
        },
        status: 'ALLOCATED',
        acceptedAt: null,        // Clear previous acceptance
        rejectedAt: null,        // Clear previous rejection
        rejectionReason: null,   // Clear previous rejection reason
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

    // Send email notifications
    try { 
      await emailService.sendDriverAssignmentNotification(updated, driver, updated.customer);
    } catch (emailError) {
      console.error('Failed to send driver assignment emails:', emailError);
      // Don't fail the allocation if email fails
    } 

    return updated;
  }

  async updateDeliveryStatus(deliveryId, status, data = {}) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
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

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Send cancellation email if admin cancels delivery
    if (status === 'CANCELLED') {
      try {
        await emailService.sendDeliveryCancellationNotification(
          updated,
          delivery.customer,
          'Admin',
          updateData.cancellationReason
        );
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }
    }

    return updated;
  }

  /**
   * Add extra charge to a delivery
   */
  async addExtraCharge(deliveryId, chargeData) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    return prisma.extraCharge.create({
      data: {
        deliveryId,
        description: chargeData.description,
        amount: chargeData.amount,
      },
    });
  }

  /**
   * Remove extra charge from a delivery
   */
  async removeExtraCharge(chargeId) {
    return prisma.extraCharge.delete({
      where: { id: chargeId },
    });
  }

  /**
   * Get all extra charges for a delivery
   */
  async getDeliveryExtraCharges(deliveryId) {
    return prisma.extraCharge.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'desc' },
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

  // ==================== INVOICE EDITING ====================

  async getInvoiceById(invoiceId) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          include: {
            customerProfile: {
              include: { pricingTier: true }
            }
          }
        },
        items: {
          include: {
            delivery: {
              include: {
                customer: {
                  include: { customerProfile: true }
                },
                driver: {
                  include: { driverProfile: true }
                },
                extraCharges: true,
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    });
  }

  async updateInvoiceComplete(invoiceId, updateData) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.isPaid && !updateData.allowEditPaid) {
      throw new Error('Cannot edit a paid invoice. Contact finance team for adjustments.');
    }

    // Validate invoice number uniqueness if provided
    if (updateData.invoiceNumber && updateData.invoiceNumber !== invoice.invoiceNumber) {
      const existing = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: updateData.invoiceNumber,
          id: { not: invoiceId }
        }
      });
      if (existing) {
        throw new Error(`Invoice number ${updateData.invoiceNumber} already exists`);
      }
    }

    // Build invoice update data
    const invoiceUpdateData = {};
    const allowedFields = ['invoiceNumber', 'customerId', 'invoiceDate', 'dueDate', 'status', 'customerRef', 'notes', 'paymentTerms'];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'invoiceDate' || field === 'dueDate') {
          invoiceUpdateData[field] = new Date(updateData[field]);
        } else {
          invoiceUpdateData[field] = updateData[field];
        }
      }
    }

    // Handle items update if provided
    if (updateData.items && Array.isArray(updateData.items)) {
      // Delete all existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId }
      });

      // Create new items
      const itemsToCreate = updateData.items.map(item => ({
        invoiceId,
        deliveryId: item.deliveryId || null,
        spoNumber: item.spoNumber || null,
        description: item.description,
        quantity: item.quantity || 1,
        unitCost: parseFloat(item.unitCost),
        vatAmount: parseFloat(item.vatAmount),
        total: parseFloat(item.total),
        isAdditional: item.isAdditional || false,
      }));

      if (itemsToCreate.length > 0) {
        await prisma.invoiceItem.createMany({
          data: itemsToCreate
        });
      }

      // Recalculate totals based on new items
      let subtotal = 0;
      let vatTotal = 0;
      let grandTotal = 0;

      itemsToCreate.forEach(item => {
        const itemSubtotal = item.quantity * item.unitCost;
        const itemVat = item.vatAmount;
        const itemTotal = item.total;

        subtotal += itemSubtotal;
        vatTotal += itemVat;
        grandTotal += itemTotal;
      });

      invoiceUpdateData.subtotal = subtotal.toFixed(2);
      invoiceUpdateData.vatTotal = vatTotal.toFixed(2);
      invoiceUpdateData.grandTotal = grandTotal.toFixed(2);
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: invoiceUpdateData,
      include: {
        customer: {
          include: {
            customerProfile: {
              include: { pricingTier: true }
            }
          }
        },
        items: {
          include: {
            delivery: true
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    return updatedInvoice;
  }

  //SLOT AVAILABILITY MANAGEMENT 

  
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
    const { date, timeSlot, maxCapacity } = slotData;

    if (!date || !timeSlot) {
      throw new Error('Date and timeSlot are required');
    }

    if (!['AM', 'PM', 'SAME_DAY'].includes(timeSlot)) {
      throw new Error('Invalid timeSlot. Must be AM, PM, or SAME_DAY');
    }

    const slotDate = new Date(date);
    
    const existing = await prisma.slotAvailability.findUnique({
      where: {
        date_timeSlot: {
          date: slotDate,
          timeSlot,
        }
      }
    });

    if (existing) {
      // Update existing slot
      const updatedMaxCapacity = maxCapacity !== undefined ? maxCapacity : existing.maxCapacity;
      
      return prisma.slotAvailability.update({
        where: { id: existing.id },
        data: {
          maxCapacity: updatedMaxCapacity,
          
          isFull: existing.booked >= updatedMaxCapacity
        },
      });
    }

    return prisma.slotAvailability.create({
      data: {
        date: slotDate,
        timeSlot,
        maxCapacity: maxCapacity || 10,  // Default to 10 if not provided
        booked: 0,
        isFull: false,
      },
    });
  }

  async updateSlotCapacity(slotId, method, value) {
    const slot = await prisma.slotAvailability.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!['increase', 'decrease'].includes(method)) {
      throw new Error('Method must be either "increase" or "decrease"');
    }

    if (value <= 0) {
      throw new Error('Value must be a positive number');
    }

    const capacityChange = method === 'increase' ? value : -value;
    const newMaxCapacity = slot.maxCapacity + capacityChange;

    if (newMaxCapacity < 0) {
      throw new Error('Capacity cannot be negative');
    }

    if (newMaxCapacity < slot.booked) {
      throw new Error(`Cannot reduce capacity below current bookings (${slot.booked}). Cancel some bookings first.`);
    }

    return prisma.slotAvailability.update({
      where: { id: slotId },
      data: {
        maxCapacity: newMaxCapacity,
        isFull: slot.booked >= newMaxCapacity,
      },
    });
  }

  // ANALYTICS DASHBOARD 

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      
      totalBookings,
      totalBookingsLastMonth,
      activeCustomers,
      activeCustomersLastMonth,
      activeDrivers,
      activeDriversLastMonth,
      revenueThisMonth,
      revenueLastMonth,
  
      pendingBookings,
      inProgressBookings,
      completedToday,
      
    
      recentBookings,
    ] = await Promise.all([
      
      prisma.delivery.count(),
      
      
      prisma.delivery.count({
        where: { 
          createdAt: { 
            lt: startOfMonth
          } 
        }
      }),
      
      prisma.user.count({
        where: { 
          role: 'CUSTOMER', 
          isActive: true
        }
      }),
      
      
      prisma.user.count({
        where: { 
          role: 'CUSTOMER', 
          isActive: true,
          createdAt: { 
            lt: startOfMonth  
          }
        }
      }),
      
      // Active drivers
      prisma.user.count({
        where: { 
          role: 'DRIVER', 
          isActive: true,
          driverProfile: {
            isActiveDriver: true
          }
        }
      }),
      
     
      prisma.user.count({
        where: { 
          role: 'DRIVER', 
          isActive: true,
          driverProfile: {
            isActiveDriver: true
          },
          createdAt: { 
            lt: startOfMonth 
          }
        }
      }),
      
     
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { gte: startOfMonth }
        }
      }),
      
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
   
      prisma.delivery.count({
        where: { status: 'RECEIVED' }
      }),
      
      
      prisma.delivery.count({
        where: { status: 'ALLOCATED' }
      }),
      
      prisma.delivery.count({
        where: { 
          status: 'DELIVERED'
        }
      }),
      
      // Recent bookings
      prisma.delivery.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: {
              customerProfile: true
            }
          }
        }
      }),
    ]);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueThisMonthValue = parseFloat(revenueThisMonth._sum.grandTotal || 0);
    const revenueLastMonthValue = parseFloat(revenueLastMonth._sum.grandTotal || 0);

    return {
      metrics: {
        totalBookings: {
          count: totalBookings,
          change: calculateChange(totalBookings, totalBookingsLastMonth),
          changeText: `${Math.abs(calculateChange(totalBookings, totalBookingsLastMonth))}% from last month`
        },
        activeCustomers: {
          count: activeCustomers,
          change: calculateChange(activeCustomers, activeCustomersLastMonth),
          changeText: `${Math.abs(calculateChange(activeCustomers, activeCustomersLastMonth))}% from last month`
        },
        activeDrivers: {
          count: activeDrivers,
          change: calculateChange(activeDrivers, activeDriversLastMonth),
          changeText: `${Math.abs(calculateChange(activeDrivers, activeDriversLastMonth))}% from last month`
        },
        revenue: {
          amount: revenueThisMonthValue,
          currency: 'GBP',
          formatted: `£${revenueThisMonthValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          change: calculateChange(revenueThisMonthValue, revenueLastMonthValue),
          changeText: `${Math.abs(calculateChange(revenueThisMonthValue, revenueLastMonthValue))}% from last month`
        }
      },
      statusCards: {
        pending: {
          count: pendingBookings,
          label: 'Pending Bookings',
          description: 'Requires allocation to drivers',
          //color: 'teal'
        },
        inProgress: {
          count: inProgressBookings,
          label: 'In Progress',
          description: 'Currently out for delivery',
          //color: 'blue'
        },
        completedToday: {
          count: completedToday,
          label: 'Completed',
          description: 'Successfully delivered',
          //color: 'green'
        }
      },
      recentBookings: recentBookings.map(booking => ({
        invoiceNumber: booking.invoiceNumber || `T${String(booking.id).padStart(4, '0')}`,
        customer: `${booking.customer.customerProfile?.storeName || booking.customer.fullName} (${booking.customer.customerProfile?.loginId || 'N/A'})`,
        date: booking.deliveryDate,
        timeSlot: booking.timeSlot,
        weight: `${booking.weight}kg`,
        status: booking.status,
        deliveryId: booking.id
      }))
    };
  }

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
