const prisma = require('../config/database');
const config = require('../config');
const emailService = require('./emailService');

class DeliveryService {

  async createDelivery(customerId, deliveryData) {
    const { deliveryDate, timeSlot } = deliveryData;
    
    // STEP 1: Validate slot availability (skip for SAME_DAY)
    if (timeSlot !== 'SAME_DAY') {
      const slot = await this.checkSlotAvailability(deliveryDate, timeSlot);
      
      if (!slot) {
        throw new Error(`No slot availability configured for ${timeSlot} on ${new Date(deliveryDate).toLocaleDateString()}. Please contact admin.`);
      }
      
      if (slot.isFull || slot.booked >= slot.maxCapacity) {
        throw new Error(`${timeSlot} slot is full for ${new Date(deliveryDate).toLocaleDateString()}. Please choose another time slot or date.`);
      }
    }
    
    // STEP 2: Calculate pricing
    const pricing = await this.calculateDeliveryPrice(
      customerId,
      deliveryData.weight,
      deliveryData.deliveryAddress
    );

    // STEP 3: Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        customerId,
        ...deliveryData,
        ...pricing,
        status: 'RECEIVED',
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
              }
            }
          },
        },
      },
    });
    
    // STEP 4: Increment slot booking count (skip for SAME_DAY)
    if (timeSlot !== 'SAME_DAY') {
      await this.incrementSlotBooking(deliveryDate, timeSlot);
    }

    // STEP 5: Send email notifications
    try {
      // Notify admin of new delivery request
      await emailService.sendNewDeliveryNotification(delivery, delivery.customer);
      
      // If same-day delivery, send special alert
      if (timeSlot === 'SAME_DAY') {
        await emailService.sendSameDayDeliveryAlert(delivery, delivery.customer);
      }
    } catch (emailError) {
      console.error('Failed to send delivery creation emails:', emailError);
      // Don't fail the delivery creation if email fails
    }
    
    return delivery;
  }

  async getCustomerDeliveries(customerId, filters = {}) {
    const { status, startDate, endDate, search } = filters;
    
    const where = { customerId };
    
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
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        extraCharges: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryById(id, customerId = null) {
    const where = { id };
    if (customerId) where.customerId = customerId;

    return prisma.delivery.findUnique({
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
                depotAddress: true,
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
        extraCharges: true,
        driverFeedback: true,
      },
    });
  }

  async updateDelivery(id, customerId, updateData) {
    // Check if delivery belongs to customer
    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    // Customers can only edit RECEIVED deliveries
    if (delivery.status !== 'RECEIVED') {
      throw new Error('Cannot edit delivery once it has been allocated');
    }

    // Recalculate pricing if weight or address changed
    let pricing = {};
    if (updateData.weight || updateData.deliveryAddress) {
      pricing = await this.calculateDeliveryPrice(
        customerId,
        updateData.weight || delivery.weight,
        updateData.deliveryAddress || delivery.deliveryAddress
      );
    }

    return prisma.delivery.update({
      where: { id },
      data: {
        ...updateData,
        ...pricing,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async cancelDelivery(id, customerId, reason) {
    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    if (!['RECEIVED', 'ALLOCATED'].includes(delivery.status)) {
      throw new Error('Cannot cancel delivery in current status');
    }
    
    const wasNotCancelled = delivery.status !== 'CANCELLED';

    const cancelled = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'No reason provided',
        cancelledBy: customerId,
      },
    });
    
    if (wasNotCancelled && delivery.timeSlot !== 'SAME_DAY') {
      await this.decrementSlotBooking(delivery.deliveryDate, delivery.timeSlot);
    }
    
    return cancelled;
  }

  async deleteDelivery(id, customerId) {
    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    // Can only delete RECEIVED deliveries
    if (delivery.status !== 'RECEIVED') {
      throw new Error('Can only delete pending deliveries');
    }

    return prisma.delivery.delete({
      where: { id },
    });
  }

 
  async getCustomerStats(customerId) {
    const [pendingList, allocatedList, completedList, cancelledList] = await Promise.all([
      prisma.delivery.findMany({ 
        where: { customerId, status: 'RECEIVED' },
        select: {
          id: true,
          spoNumber: true,
          deliveryDate: true,
          timeSlot: true,
          weight: true,
          deliveryAddress: true,
          customerName: true,
          totalPrice: true,
          status: true,
          createdAt: true,
        },
        orderBy: { deliveryDate: 'asc' }
      }),
      prisma.delivery.findMany({ 
        where: { customerId, status: 'ALLOCATED' },
        select: {
          id: true,
          spoNumber: true,
          deliveryDate: true,
          timeSlot: true,
          weight: true,
          deliveryAddress: true,
          customerName: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            }
          }
        },
        orderBy: { deliveryDate: 'asc' }
      }),
      prisma.delivery.findMany({ 
        where: { customerId, status: 'DELIVERED' },
        select: {
          id: true,
          spoNumber: true,
          deliveryDate: true,
          timeSlot: true,
          weight: true,
          deliveryAddress: true,
          customerName: true,
          totalPrice: true,
          status: true,
          deliveredAt: true,
          createdAt: true,
        },
        orderBy: { deliveredAt: 'desc' }
      }),
      prisma.delivery.findMany({ 
        where: { customerId, status: 'CANCELLED' },
        select: {
          id: true,
          spoNumber: true,
          deliveryDate: true,
          timeSlot: true,
          weight: true,
          deliveryAddress: true,
          customerName: true,
          totalPrice: true,
          status: true,
          cancelledAt: true,
          cancellationReason: true,
          createdAt: true,
        },
        orderBy: { cancelledAt: 'desc' }
      }),
    ]);

    return {
      pending: pendingList.length,
      allocated: allocatedList.length,
      completed: completedList.length,
      cancelled: cancelledList.length,
      total: pendingList.length + allocatedList.length + completedList.length + cancelledList.length,
      deliveries: {
        pending: pendingList,
        allocated: allocatedList,
        completed: completedList,
        cancelled: cancelledList,
      }
    };
  }

  async calculateDeliveryPrice(customerId, weight, address) {
    // Get customer pricing tier through customerProfile
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: { 
        customerProfile: {
          include: {
            pricingTier: true
          }
        }
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Use custom pricing or tier pricing
    const basePrice = customer.customerProfile?.customBasePrice 
      ? parseFloat(customer.customerProfile.customBasePrice)
      : customer.customerProfile?.pricingTier 
        ? parseFloat(customer.customerProfile.pricingTier.basePrice)
        : 37.50; 

    const vatRate = customer.customerProfile?.pricingTier
        ? parseFloat(customer.customerProfile.pricingTier.vatRate)
        : 20.00;

    const weightBlocks = Math.ceil(weight / config.pricing.weightBlock);

    
    let calculatedBasePrice = basePrice * weightBlocks;

    // Calculate distance (simplified - would use Google Maps API in production)
    const distance = await this.calculateDistance(customer.customerProfile?.depotAddress, address);
    
    // Distance surcharge (per 45 miles beyond base)
    let distanceSurcharge = 0;
    if (distance > config.pricing.baseDistance) {
      const extraDistanceBlocks = Math.ceil(
        (distance - config.pricing.baseDistance) / config.pricing.baseDistance
      );
      distanceSurcharge = (basePrice * config.pricing.distanceSurchargeRate) * weightBlocks * extraDistanceBlocks;
    }

    const subtotal = calculatedBasePrice + distanceSurcharge;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalPrice = subtotal + vatAmount;

    return {
      distanceFromDepot: distance,
      calculatedBasePrice,
      distanceSurcharge,
      subtotal,
      vatAmount,
      totalPrice,
    };
  }

 
  async calculateDistance(origin, destination) {
    return Math.floor(Math.random() * 40) + 10;
  }

 
  isSameDay(deliveryDate) {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    return (
      delivery.getDate() === today.getDate() &&
      delivery.getMonth() === today.getMonth() &&
      delivery.getFullYear() === today.getFullYear()
    );
  }

  //  SLOT AVAILABILITY METHODS

  async checkSlotAvailability(date, timeSlot) {
    return prisma.slotAvailability.findUnique({
      where: {
        date_timeSlot: {
          date: new Date(date),
          timeSlot
        }
      }
    });
  }

 
  async incrementSlotBooking(date, timeSlot) {
    const slot = await this.checkSlotAvailability(date, timeSlot);
    
    if (!slot) {
      return;
    }
   
    const newBookedCount = slot.booked + 1;
    
    await prisma.slotAvailability.update({
      where: { id: slot.id },
      data: {
        booked: newBookedCount,
        isFull: newBookedCount >= slot.maxCapacity
      }
    });
  }

  async decrementSlotBooking(date, timeSlot) {
    const slot = await this.checkSlotAvailability(date, timeSlot);
    
    if (!slot || slot.booked <= 0) {
      return;
    }
    
    const newBookedCount = Math.max(0, slot.booked - 1);
    
    await prisma.slotAvailability.update({
      where: { id: slot.id },
      data: {
        booked: newBookedCount,
        isFull: false 
      }
    });
  }
}

module.exports = new DeliveryService();
