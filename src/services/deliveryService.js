const prisma = require("../config/database");
const config = require("../config");
const emailService = require("./emailService");

class DeliveryService {
  async createDelivery(customerId, deliveryData) {
    const { deliveryDate, timeSlot } = deliveryData;

    // STEP 1: Validate slot availability (skip for SAME_DAY)
    if (timeSlot !== "SAME_DAY") {
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
        console.log(
          `✓ Auto-created slot: ${timeSlot} on ${new Date(deliveryDate).toLocaleDateString()} with capacity ${defaultCapacity}`,
        );
      }

      if (slot.isFull) {
        throw new Error(
          `The ${timeSlot} slot is FULL for ${new Date(deliveryDate).toLocaleDateString()}. Maximum capacity (${slot.maxCapacity}) reached. Please choose another time slot or date.`,
        );
      }

      if (slot.booked >= slot.maxCapacity) {
        throw new Error(
          `The ${timeSlot} slot is FULL for ${new Date(deliveryDate).toLocaleDateString()}. ${slot.booked}/${slot.maxCapacity} bookings made. Please choose another time slot or date.`,
        );
      }

      const remaining = slot.maxCapacity - slot.booked;
      if (remaining <= 0) {
        throw new Error(
          `No remaining capacity for ${timeSlot} slot on ${new Date(deliveryDate).toLocaleDateString()}. Please choose another time slot or date.`,
        );
      }
    }

    const pricing = await this.calculateDeliveryPrice(
      customerId,
      deliveryData.weight,
      deliveryData.deliveryAddress,
    );

    const delivery = await prisma.delivery.create({
      data: {
        customerId,
        ...deliveryData,
        ...pricing,
        status: "RECEIVED",
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
              },
            },
          },
        },
      },
    });

    if (timeSlot !== "SAME_DAY") {
      await this.incrementSlotBooking(deliveryDate, timeSlot);
    }

    try {
      await emailService.sendNewDeliveryNotification(
        delivery,
        delivery.customer,
      );

      if (timeSlot === "SAME_DAY") {
        await emailService.sendSameDayDeliveryAlert(
          delivery,
          delivery.customer,
        );
      }
    } catch (emailError) {
      console.error("Failed to send delivery creation emails:", emailError);
    }

    return delivery;
  }

  async getCustomerDeliveries(customerId, filters = {}) {
    const { status, startDate, endDate, search } = filters;

    const where = { customerId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (startDate || endDate) {
      where.deliveryDate = {};
      if (startDate) where.deliveryDate.gte = new Date(startDate);
      if (endDate) where.deliveryDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { spoNumber: { contains: search, mode: "insensitive" } },
        { deliveryAddress: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
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
      orderBy: { createdAt: "desc" },
    });
  }

  async getDeliveryById(id, customerId = null) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid delivery ID");
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
              },
            },
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
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error("Delivery not found or access denied");
    }

    if (!["RECEIVED", "ALLOCATED"].includes(delivery.status)) {
      throw new Error(
        "Cannot edit delivery once it has been delivered or cancelled",
      );
    }

    let pricing = {};
    if (updateData.weight || updateData.deliveryAddress) {
      pricing = await this.calculateDeliveryPrice(
        customerId,
        updateData.weight || delivery.weight,
        updateData.deliveryAddress || delivery.deliveryAddress,
      );
    }

    // If date or timeSlot is changing, update slot availability
    const newDate = updateData.deliveryDate
      ? new Date(updateData.deliveryDate)
      : null;
    const newTimeSlot = updateData.timeSlot || null;

    const dateChanging =
      newDate &&
      new Date(delivery.deliveryDate).toDateString() !== newDate.toDateString();
    const slotChanging = newTimeSlot && newTimeSlot !== delivery.timeSlot;

    if ((dateChanging || slotChanging) && delivery.timeSlot !== "SAME_DAY") {
      // Release old slot
      await this.decrementSlotBooking(delivery.deliveryDate, delivery.timeSlot);
      // Book new slot
      const targetDate = newDate || delivery.deliveryDate;
      const targetSlot = newTimeSlot || delivery.timeSlot;
      if (targetSlot !== "SAME_DAY") {
        await this.incrementSlotBooking(targetDate, targetSlot);
      }
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
      throw new Error("Invalid delivery ID");
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
          },
        },
      },
    });

    if (!delivery) {
      throw new Error("Delivery not found or access denied");
    }

    if (!["RECEIVED", "ALLOCATED"].includes(delivery.status)) {
      throw new Error("Cannot cancel delivery in current status");
    }

    const wasNotCancelled = delivery.status !== "CANCELLED";

    const cancelled = await prisma.delivery.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || "No reason provided",
        cancelledBy: customerId,
      },
    });

    if (wasNotCancelled && delivery.timeSlot !== "SAME_DAY") {
      await this.decrementSlotBooking(delivery.deliveryDate, delivery.timeSlot);
    }

    try {
      await emailService.sendDeliveryCancellationNotification(
        delivery,
        delivery.customer,
        "Customer",
        reason || "No reason provided",
      );
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
      // Don't fail the cancellation if email fails
    }

    return cancelled;
  }

  async deleteDelivery(id, customerId) {
    // Validate delivery ID
    if (!id || isNaN(id)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, customerId },
    });

    if (!delivery) {
      throw new Error("Delivery not found or access denied");
    }

    if (delivery.status !== "RECEIVED") {
      throw new Error("Can only delete pending deliveries");
    }

    return prisma.delivery.delete({
      where: { id },
    });
  }

  async getCustomerStats(customerId) {
    const [pendingList, allocatedList, completedList, cancelledList] =
      await Promise.all([
        prisma.delivery.findMany({
          where: { customerId, status: "RECEIVED" },
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
          orderBy: { deliveryDate: "asc" },
        }),
        prisma.delivery.findMany({
          where: { customerId, status: "ALLOCATED" },
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
              },
            },
          },
          orderBy: { deliveryDate: "asc" },
        }),
        prisma.delivery.findMany({
          where: { customerId, status: "DELIVERED" },
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
          orderBy: { deliveredAt: "desc" },
        }),
        prisma.delivery.findMany({
          where: { customerId, status: "CANCELLED" },
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
          orderBy: { cancelledAt: "desc" },
        }),
      ]);

    return {
      pending: pendingList.length,
      allocated: allocatedList.length,
      completed: completedList.length,
      cancelled: cancelledList.length,
      total:
        pendingList.length +
        allocatedList.length +
        completedList.length +
        cancelledList.length,
      deliveries: {
        pending: pendingList,
        allocated: allocatedList,
        completed: completedList,
        cancelled: cancelledList,
      },
    };
  }

  async calculateDeliveryPrice(customerId, weight, address) {
    // Get customer pricing tier through customerProfile
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Use custom pricing or tier pricing
    const basePrice = customer.customerProfile?.customBasePrice
      ? parseFloat(customer.customerProfile.customBasePrice)
      : customer.customerProfile?.pricingTier
        ? parseFloat(customer.customerProfile.pricingTier.basePrice)
        : 37.5;

    const vatRate = customer.customerProfile?.pricingTier
      ? parseFloat(customer.customerProfile.pricingTier.vatRate)
      : 20.0;

    // Use the tier's own surcharge rate; fall back to config default
    const surchargeRate = customer.customerProfile?.pricingTier?.surchargeRate
      ? parseFloat(customer.customerProfile.pricingTier.surchargeRate)
      : config.pricing.distanceSurchargeRate;

    // Use the tier's own maxDistance as the base distance; fall back to config default
    const baseDistance = customer.customerProfile?.pricingTier?.maxDistance
      ? parseFloat(customer.customerProfile.pricingTier.maxDistance)
      : config.pricing.baseDistance;

    const weightBlocks = Math.ceil(weight / config.pricing.weightBlock);

    let calculatedBasePrice = basePrice * weightBlocks;

    // Calculate distance
    const distance = await this.calculateDistance(
      customer.customerProfile?.depotAddress,
      address,
    );

    // Distance surcharge: applied per baseDistance block beyond the included baseDistance
    let distanceSurcharge = 0;
    if (distance > baseDistance) {
      const extraDistanceBlocks = Math.ceil(
        (distance - baseDistance) / baseDistance,
      );
      distanceSurcharge =
        basePrice * surchargeRate * weightBlocks * extraDistanceBlocks;
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

  extractUKPostcode(address) {
    if (!address) return null;
    const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
    return match ? match[0].trim().toUpperCase() : null;
  }

  async geocodeAddress(address) {
    if (!address) return null;
    const https = require("https");

    // Prefer postcode-only query — far more reliable in Nominatim for UK addresses
    const postcode = this.extractUKPostcode(address);
    const query = postcode || address;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=gb`;

    return new Promise((resolve) => {
      const options = {
        headers: { "User-Agent": "M19Logistics/1.0 (admin@m19logistics.com)" },
      };
      const req = https
        .get(url, options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const results = JSON.parse(data);
              if (results && results.length > 0) {
                resolve({
                  lat: parseFloat(results[0].lat),
                  lon: parseFloat(results[0].lon),
                });
              } else {
                console.warn(`[geocodeAddress] No results for: "${query}"`);
                resolve(null);
              }
            } catch (e) {
              resolve(null);
            }
          });
        })
        .on("error", (err) => {
          console.warn(`[geocodeAddress] Request error: ${err.message}`);
          resolve(null);
        });
      // 8-second timeout
      req.setTimeout(8000, () => {
        console.warn(`[geocodeAddress] Timeout for: "${query}"`);
        req.destroy();
        resolve(null);
      });
    });
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async calculateDistance(origin, destination) {
    try {
      // Sequential calls to respect Nominatim's 1 req/sec rate limit
      const originCoords = await this.geocodeAddress(origin);
      await new Promise((r) => setTimeout(r, 1100)); // 1.1s gap
      const destCoords = await this.geocodeAddress(destination);

      if (!originCoords || !destCoords) {
        console.warn(
          `[calculateDistance] Geocoding failed — origin: ${originCoords ? "OK" : origin}, dest: ${destCoords ? "OK" : destination}`,
        );
        // If we have at least origin, use haversine with a rough offset rather than flat 20
        if (originCoords && !destCoords)
          return this.haversineDistance(
            originCoords.lat,
            originCoords.lon,
            originCoords.lat + 0.3,
            originCoords.lon + 0.3,
          );
        return 20; // safe default if both fail
      }

      // Try OSRM for real driving distance
      try {
        const https = require("https");
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;

        const drivingMetres = await new Promise((resolve) => {
          const options = {
            headers: { "User-Agent": "M19Logistics/1.0" },
          };
          const req = https
            .get(osrmUrl, options, (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                try {
                  const json = JSON.parse(data);
                  if (json.routes && json.routes.length > 0) {
                    resolve(json.routes[0].distance); // metres
                  } else {
                    resolve(null);
                  }
                } catch (e) {
                  resolve(null);
                }
              });
            })
            .on("error", () => resolve(null));
          req.setTimeout(8000, () => {
            req.destroy();
            resolve(null);
          });
        });

        if (drivingMetres !== null) {
          const miles = drivingMetres / 1609.344;
          return Math.round(miles * 10) / 10; // round to 1 decimal
        }
      } catch (_) {
        // OSRM failed — fall through to haversine
      }

      // Haversine fallback (straight-line)
      const miles = this.haversineDistance(
        originCoords.lat,
        originCoords.lon,
        destCoords.lat,
        destCoords.lon,
      );
      console.warn(
        `[calculateDistance] OSRM unavailable, using haversine: ${miles.toFixed(1)} miles`,
      );
      return Math.round(miles * 10) / 10;
    } catch (err) {
      console.error("[calculateDistance] Unexpected error:", err.message);
      return 20; // safe default
    }
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
          timeSlot,
        },
      },
    });
  }

  async incrementSlotBooking(date, timeSlot) {
    const slot = await this.checkSlotAvailability(date, timeSlot);

    if (!slot) {
      throw new Error("Slot not found - cannot increment booking");
    }

    // SAFETY CHECK: Prevent overbooking
    if (slot.booked >= slot.maxCapacity) {
      throw new Error(
        `Cannot increment - slot already at maximum capacity (${slot.maxCapacity})`,
      );
    }

    const newBookedCount = slot.booked + 1;

    await prisma.slotAvailability.update({
      where: { id: slot.id },
      data: {
        booked: newBookedCount,
        isFull: newBookedCount >= slot.maxCapacity,
      },
    });

    console.log(
      `✓ Slot booking incremented: ${timeSlot} on ${date} - ${newBookedCount}/${slot.maxCapacity}`,
    );
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
        isFull: false,
      },
    });
  }
}

module.exports = new DeliveryService();
