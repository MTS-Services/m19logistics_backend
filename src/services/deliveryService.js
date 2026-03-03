const prisma = require('../config/database');
const config = require('../config');
const emailService = require('./emailService');

class DeliveryService {

  async createDelivery(customerId, deliveryData) {
    const { deliveryDate, timeSlot } = deliveryData;

    // STEP 1: Validate slot availability (skip for SAME_DAY)
    if (timeSlot !== 'SAME_DAY') {

      let slot = await this.checkSlotAvailability(deliveryDate, timeSlot);

      if (!slot) {
        // Automatically create slot with default capacity of 5 (5 for AM, 5 for PM)
        const defaultCapacity = 5;
        slot = await prisma.slotAvailability.create({
          data: {
            date: new Date(deliveryDate),
            timeSlot,
            maxCapacity: defaultCapacity,
            booked: 0,
            isFull: false,
          },
        });
        console.log(`✓ Auto-created slot: ${timeSlot} on ${new Date(deliveryDate).toLocaleDateString()} with capacity ${defaultCapacity}`);
      }


      if (slot.isFull) {
        throw new Error(`The ${timeSlot} slot is FULL for ${new Date(deliveryDate).toLocaleDateString()}. Maximum capacity (${slot.maxCapacity}) reached. Please choose another time slot or date.`);
      }

      if (slot.booked >= slot.maxCapacity) {
        throw new Error(`The ${timeSlot} slot is FULL for ${new Date(deliveryDate).toLocaleDateString()}. ${slot.booked}/${slot.maxCapacity} bookings made. Please choose another time slot or date.`);
      }


      const remaining = slot.maxCapacity - slot.booked;
      if (remaining <= 0) {
        throw new Error(`No remaining capacity for ${timeSlot} slot on ${new Date(deliveryDate).toLocaleDateString()}. Please choose another time slot or date.`);
      }
    }


    const pricing = await this.calculateDeliveryPrice(
      customerId,
      deliveryData.weight,
      deliveryData.deliveryAddress
    );

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


    if (timeSlot !== 'SAME_DAY') {
      await this.incrementSlotBooking(deliveryDate, timeSlot);
    }


    try {

      await emailService.sendNewDeliveryNotification(delivery, delivery.customer);


      if (timeSlot === 'SAME_DAY') {
        await emailService.sendSameDayDeliveryAlert(delivery, delivery.customer);
      }
    } catch (emailError) {
      console.error('Failed to send delivery creation emails:', emailError);

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

    if (!id || isNaN(id)) {
      throw new Error('Invalid delivery ID');
    }

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

    if (!id || isNaN(id)) {
      throw new Error('Invalid delivery ID');
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

    if (delivery.status !== 'RECEIVED') {
      throw new Error('Cannot edit delivery once it has been allocated');
    }

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
    // Validate delivery ID
    if (!id || isNaN(id)) {
      throw new Error('Invalid delivery ID');
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          }
        }
      }
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

    try {
      await emailService.sendDeliveryCancellationNotification(
        delivery,
        delivery.customer,
        'Customer',
        reason || 'No reason provided'
      );
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    return cancelled;
  }

  async deleteDelivery(id, customerId) {
    // Validate delivery ID
    if (!id || isNaN(id)) {
      throw new Error('Invalid delivery ID');
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error('Delivery not found or access denied');
    }

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
      throw new Error('Slot not found - cannot increment booking');
    }

    // SAFETY CHECK: Prevent overbooking
    if (slot.booked >= slot.maxCapacity) {
      throw new Error(`Cannot increment - slot already at maximum capacity (${slot.maxCapacity})`);
    }

    const newBookedCount = slot.booked + 1;

    await prisma.slotAvailability.update({
      where: { id: slot.id },
      data: {
        booked: newBookedCount,
        isFull: newBookedCount >= slot.maxCapacity
      }
    });

    console.log(`✓ Slot booking incremented: ${timeSlot} on ${date} - ${newBookedCount}/${slot.maxCapacity}`);
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
