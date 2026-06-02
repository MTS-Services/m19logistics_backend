const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const emailService = require("./emailService");
const deliveryService = require("./deliveryService");

class AdminService {
  // ==================== USER MANAGEMENT ====================

  async getAllUsers(filters = {}) {
    const { role, isActive, search } = filters;

    // Never expose ADMIN accounts in the user list
    const where = {
      role: { not: "ADMIN" },
    };

    if (role && role !== "ADMIN") where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    return prisma.user.findMany({
      where,
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          },
        },
        driverProfile: true,
        managerProfile: true,
        _count: {
          select: {
            deliveriesRequested: true,
            deliveriesAssigned: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          },
        },
        driverProfile: true,
        managerProfile: true,
        deliveriesRequested: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        deliveriesAssigned: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async createUser(userData) {
    const { email, password, role, ...profileData } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      email,
      username: email.split("@")[0],
      password: hashedPassword,
      fullName: userData.fullName,
      phone: userData.phone,
      role,
      isActive: userData.isActive !== false,
    };

    if (role === "CUSTOMER") {
      data.customerProfile = {
        create: {
          storeName: profileData.storeName,
          depotAddress: profileData.depotAddress,
          loginId: profileData.loginId,
          pricingTierId: profileData.pricingTierId,
          customBasePrice: profileData.customBasePrice,
        },
      };
    } else if (role === "DRIVER") {
      data.driverProfile = {
        create: {
          vehicleRegistration: profileData.vehicleRegistration,
          isActiveDriver: profileData.isActiveDriver !== false,
        },
      };
    } else if (role === "MANAGER") {
      data.managerProfile = {
        create: {
          accessScope: profileData.accessScope || "FULL",
        },
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

  async updateUser(id, updateData) {
    // Validate user ID
    if (!id || isNaN(id)) {
      throw new Error("Invalid user ID");
    }

    // Fields that belong to CustomerProfile, not User
    const CUSTOMER_PROFILE_FIELDS = [
      "storeName",
      "depotAddress",
      "loginId",
      "pricingTierId",
      "customBasePrice",
      "ccEmail",
      "accessScope",
    ];
    // Fields that belong to DriverProfile
    const DRIVER_PROFILE_FIELDS = [
      "vehicleRegistration",
      "isActiveDriver",
      "licenseNumber",
    ];

    const {
      password,
      role,
      customerProfile: customerProfileOverride,
      driverProfile: driverProfileOverride,
      managerProfile: managerProfileOverride,
      ...rest
    } = updateData;

    // Separate profile-level fields from user-level fields
    const customerProfileFields = {};
    const driverProfileFields = {};
    const data = {};

    for (const [key, value] of Object.entries(rest)) {
      if (CUSTOMER_PROFILE_FIELDS.includes(key)) {
        customerProfileFields[key] = value;
      } else if (DRIVER_PROFILE_FIELDS.includes(key)) {
        driverProfileFields[key] = value;
      } else {
        data[key] = value;
      }
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Merge explicit nested overrides with auto-detected profile fields
    const mergedCustomerProfile = {
      ...customerProfileFields,
      ...(customerProfileOverride || {}),
    };
    const mergedDriverProfile = {
      ...driverProfileFields,
      ...(driverProfileOverride || {}),
    };

    if (
      user.role === "CUSTOMER" &&
      Object.keys(mergedCustomerProfile).length > 0
    ) {
      data.customerProfile = { update: mergedCustomerProfile };
    } else if (
      user.role === "DRIVER" &&
      Object.keys(mergedDriverProfile).length > 0
    ) {
      data.driverProfile = { update: mergedDriverProfile };
    } else if (user.role === "MANAGER" && managerProfileOverride) {
      data.managerProfile = { update: managerProfileOverride };
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
    if (!id || isNaN(id)) {
      throw new Error("Invalid user ID");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deliveriesRequested: true,
            deliveriesAssigned: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (
      user._count.deliveriesRequested > 0 ||
      user._count.deliveriesAssigned > 0
    ) {
      // Soft delete - deactivate instead
      return this.updateUser(id, { isActive: false });
    }

    return prisma.user.delete({
      where: { id },
    });
  }

  async toggleUserStatus(id) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid user ID");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async getAllDeliveries(filters = {}) {
    const { status, startDate, endDate, customerId, driverId, search } =
      filters;

    const where = {};

    if (status && status !== "ALL") where.status = status;
    if (customerId) where.customerId = parseInt(customerId);
    if (driverId) where.driverId = parseInt(driverId);

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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
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
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDeliveryById(id) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
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
            driverProfile: {
              select: {
                vehicleRegistration: true,
              },
            },
          },
        },
        extraCharges: true,
        driverFeedback: true,
      },
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    return delivery;
  }

  async updateDelivery(id, updateData) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    // Admin/Manager can edit deliveries in RECEIVED, ALLOCATED, or DELIVERED (if not yet invoiced)
    if (!["RECEIVED", "ALLOCATED", "DELIVERED"].includes(delivery.status)) {
      throw new Error("Cannot edit delivery in current status");
    }

    if (delivery.status === "DELIVERED") {
      const invoiceItem = await prisma.invoiceItem.findFirst({
        where: { deliveryId: id },
      });
      if (invoiceItem) {
        throw new Error(
          "Cannot edit a delivered delivery that has already been invoiced",
        );
      }
    }

    // Recalculate pricing if weight or address changes
    let pricing = {};
    if (updateData.weight || updateData.deliveryAddress) {
      try {
        pricing = await deliveryService.calculateDeliveryPrice(
          delivery.customerId,
          updateData.weight ? parseFloat(updateData.weight) : delivery.weight,
          updateData.deliveryAddress || delivery.deliveryAddress,
        );
        console.log(
          `✓ Pricing recalculated for delivery #${id}: Total ${pricing.totalPrice}`,
        );
      } catch (pricingError) {
        console.error("Failed to recalculate pricing:", pricingError);
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
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
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
      },
    });
  }

  async deleteDelivery(id) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        extraCharges: true,
      },
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    // Admin/Manager can only delete RECEIVED or CANCELLED deliveries
    if (!["RECEIVED", "CANCELLED"].includes(delivery.status)) {
      throw new Error(
        "Cannot delete delivery in current status. Only RECEIVED or CANCELLED deliveries can be deleted.",
      );
    }

    if (delivery.extraCharges.length > 0) {
      await prisma.extraCharge.deleteMany({
        where: { deliveryId: id },
      });
    }

    await prisma.delivery.delete({
      where: { id },
    });

    return { message: "Delivery deleted successfully" };
  }

  async allocateDelivery(deliveryId, driverId) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        driver: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (!["RECEIVED", "ALLOCATED"].includes(delivery.status)) {
      throw new Error(
        "Can only allocate or re-allocate pending/allocated deliveries",
      );
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true },
    });

    if (!driver || driver.role !== "DRIVER") {
      throw new Error("Invalid driver");
    }

    if (!driver.driverProfile?.isActiveDriver) {
      throw new Error("Driver is not active");
    }

    const isReallocation =
      delivery.status === "ALLOCATED" && delivery.driverId !== null;
    const previousDriver = delivery.driver;

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driver: {
          connect: { id: driverId },
        },
        status: "ALLOCATED",
        acceptedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
          },
        },
        driver: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Audit log — distinguish first allocation from re-allocation
    const auditDescription = isReallocation
      ? `Delivery #${deliveryId} re-allocated from ${previousDriver?.fullName ?? "unknown"} to ${driver.fullName}`
      : `Delivery #${deliveryId} allocated to ${driver.fullName}`;

    await prisma.auditLog.create({
      data: {
        userId: driverId,
        deliveryId: deliveryId,
        action: isReallocation ? "REALLOCATE_DELIVERY" : "ALLOCATE_DELIVERY",
        description: auditDescription,
      },
    });

    // Notify new driver
    try {
      await emailService.sendDriverAssignmentNotification(
        updated,
        driver,
        updated.customer,
        isReallocation,
      );
    } catch (emailError) {
      console.error(
        "Failed to send driver assignment email to new driver:",
        emailError,
      );
    }

    return {
      ...updated,
      isReallocation,
      previousDriver: previousDriver ?? null,
    };
  }

  async updateDeliveryStatus(deliveryId, status, data = {}) {
    if (!deliveryId || isNaN(deliveryId)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
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

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    const updateData = { status };

    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      if (data.proofOfDelivery)
        updateData.proofOfDelivery = data.proofOfDelivery;
      if (data.signature) updateData.signature = data.signature;
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = data.reason || "Cancelled by admin";
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Send cancellation email if admin cancels delivery
    if (status === "CANCELLED") {
      try {
        await emailService.sendDeliveryCancellationNotification(
          updated,
          delivery.customer,
          "Admin",
          updateData.cancellationReason,
        );
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    return updated;
  }

  async addExtraCharge(deliveryId, chargeData) {
    if (!deliveryId || isNaN(deliveryId)) {
      throw new Error("Invalid delivery ID");
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    return prisma.extraCharge.create({
      data: {
        deliveryId,
        description: chargeData.description,
        amount: chargeData.amount,
      },
    });
  }

  async removeExtraCharge(chargeId) {
    if (!chargeId || isNaN(chargeId)) {
      throw new Error("Invalid charge ID");
    }

    const charge = await prisma.extraCharge.findUnique({
      where: { id: chargeId },
    });

    if (!charge) {
      throw new Error("Extra charge not found");
    }

    return prisma.extraCharge.delete({
      where: { id: chargeId },
    });
  }
  // Note: This method is used by both Admin and Driver when viewing delivery details, so it includes all extra charges regardless of who added them.
  async getDeliveryExtraCharges(deliveryId) {
    if (!deliveryId || isNaN(deliveryId)) {
      throw new Error("Invalid delivery ID");
    }

    return prisma.extraCharge.findMany({
      where: { deliveryId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllPricingTiers() {
    return prisma.pricingTier.findMany({
      include: {
        _count: {
          select: {
            customerProfiles: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async createPricingTier(tierData) {
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
    if (!id || isNaN(id)) {
      throw new Error("Invalid pricing tier ID");
    }

    const tier = await prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new Error("Pricing tier not found");
    }

    if (tierData.isDefault) {
      await prisma.pricingTier.updateMany({
        where: {
          isDefault: true,
          NOT: { id },
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
    if (!id || isNaN(id)) {
      throw new Error("Invalid pricing tier ID");
    }

    const tier = await prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new Error("Pricing tier not found");
    }

    const count = await prisma.customerProfile.count({
      where: { pricingTierId: id },
    });

    if (count > 0) {
      throw new Error(
        `Cannot delete pricing tier. ${count} customers are using it.`,
      );
    }

    return prisma.pricingTier.delete({
      where: { id },
    });
  }

  async generateInvoice(customerId, weekStartDate, weekEndDate) {
    // Guard: prevent duplicate invoice for same customer + overlapping week
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        customerId,
        weekStartDate: { lte: new Date(weekEndDate) },
        weekEndDate: { gte: new Date(weekStartDate) },
      },
    });
    if (existingInvoice) {
      throw new Error(
        `An invoice (${existingInvoice.invoiceNumber}) already exists for this customer covering this period. Edit that invoice instead of generating a new one.`,
      );
    }

    // Fix: use relation filter (invoiceItem: null), not the non-existent field invoiceItemId
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        status: "DELIVERED",
        deliveredAt: {
          gte: new Date(weekStartDate),
          lte: new Date(weekEndDate),
        },
        invoiceItem: null,
      },
    });

    if (deliveries.length === 0) {
      throw new Error("No deliveries to invoice for this period");
    }

    // Get customer's VAT rate from their pricing tier
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        customerProfile: {
          include: { pricingTier: true },
        },
      },
    });
    const vatRate = customer?.customerProfile?.pricingTier?.vatRate
      ? parseFloat(customer.customerProfile.pricingTier.vatRate) / 100
      : 0.2;

    // Recalculate VAT per line from subtotal × vatRate (fixes stale stored vatAmount)
    const round2 = (n) => Math.round(n * 100) / 100;

    const invoiceLines = deliveries.map((d) => {
      const lineSubtotal = round2(parseFloat(d.subtotal || 0));
      const lineVat = round2(lineSubtotal * vatRate);
      const lineTotal = round2(lineSubtotal + lineVat);
      return { delivery: d, lineSubtotal, lineVat, lineTotal };
    });

    const subtotal = round2(
      invoiceLines.reduce((s, l) => s + l.lineSubtotal, 0),
    );
    const vatTotal = round2(subtotal * vatRate);
    const grandTotal = round2(subtotal + vatTotal);

    // Reserve invoice number and create invoice atomically
    let invoice;
    await prisma.$transaction(async (tx) => {
      const lastInvoiceSetting = await tx.systemSetting.findUnique({
        where: { key: "LAST_INVOICE_NUMBER" },
      });

      const lastNumber = parseInt(lastInvoiceSetting?.value || "0");
      const nextNumber = lastNumber + 1;
      const invoiceNumber = `MX1X-${String(nextNumber).padStart(2, "0")}`;

      await tx.systemSetting.upsert({
        where: { key: "LAST_INVOICE_NUMBER" },
        update: { value: String(nextNumber) },
        create: {
          key: "LAST_INVOICE_NUMBER",
          value: String(nextNumber),
          description: "Last invoice number issued",
        },
      });

      invoice = await tx.invoice.create({
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
          paymentTerms: "30 Days (End of Month)",
          items: {
            create: invoiceLines.map(
              ({ delivery, lineSubtotal, lineVat, lineTotal }) => ({
                deliveryId: delivery.id,
                description: `Cust. Ref: ${delivery.spoNumber} / ${new Date(delivery.deliveryDate).toLocaleDateString("en-GB")} / ${delivery.deliveryAddress}`,
                quantity: 1,
                unitCost: lineSubtotal,
                vatAmount: lineVat,
                total: lineTotal,
                isAdditional: false,
              }),
            ),
          },
        },
        include: {
          items: {
            include: {
              delivery: true,
            },
          },
        },
      });
    });

    return invoice;
  }

  async getAllInvoices(filters = {}) {
    const { customerId, isPaid, startDate, endDate } = filters;

    const where = {};

    if (customerId) where.customerId = parseInt(customerId);
    if (isPaid !== undefined) where.isPaid = isPaid === "true";

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
              },
            },
          },
        },
        items: true,
      },
      orderBy: { invoiceDate: "desc" },
    });
  }

  async markInvoiceAsPaid(invoiceId) {
    if (!invoiceId || isNaN(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }

  async addExtraCharge(invoiceId, chargeData) {
    if (!invoiceId || isNaN(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.isPaid) {
      throw new Error("Cannot modify paid invoice");
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

    const subtotal =
      parseFloat(invoice.subtotal) + parseFloat(chargeData.unitCost);
    const vatTotal =
      parseFloat(invoice.vatTotal) + parseFloat(chargeData.vatAmount);
    const grandTotal =
      parseFloat(invoice.grandTotal) + parseFloat(chargeData.total);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, vatTotal, grandTotal },
    });

    return item;
  }

  async getInvoiceById(invoiceId) {
    if (!invoiceId || isNaN(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          include: {
            customerProfile: {
              include: { pricingTier: true },
            },
          },
        },
        items: {
          include: {
            delivery: {
              include: {
                customer: {
                  include: { customerProfile: true },
                },
                driver: {
                  include: { driverProfile: true },
                },
                extraCharges: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  async updateInvoiceComplete(invoiceId, updateData) {
    if (!invoiceId || isNaN(invoiceId)) {
      throw new Error("Invalid invoice ID");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.isPaid && !updateData.allowEditPaid) {
      throw new Error(
        "Cannot edit a paid invoice. Contact finance team for adjustments.",
      );
    }

    if (
      updateData.invoiceNumber &&
      updateData.invoiceNumber !== invoice.invoiceNumber
    ) {
      const existing = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: updateData.invoiceNumber,
          id: { not: invoiceId },
        },
      });
      if (existing) {
        throw new Error(
          `Invoice number ${updateData.invoiceNumber} already exists`,
        );
      }
    }

    const invoiceUpdateData = {};
    const allowedFields = [
      "invoiceNumber",
      "customerId",
      "invoiceDate",
      "dueDate",
      "status",
      "customerRef",
      "notes",
      "paymentTerms",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === "invoiceDate" || field === "dueDate") {
          invoiceUpdateData[field] = new Date(updateData[field]);
        } else {
          invoiceUpdateData[field] = updateData[field];
        }
      }
    }

    if (updateData.items && Array.isArray(updateData.items)) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId },
      });

      const itemsToCreate = updateData.items.map((item) => ({
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
          data: itemsToCreate,
        });
      }

      let subtotal = 0;
      let vatTotal = 0;
      let grandTotal = 0;

      itemsToCreate.forEach((item) => {
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

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: invoiceUpdateData,
      include: {
        customer: {
          include: {
            customerProfile: {
              include: { pricingTier: true },
            },
          },
        },
        items: {
          include: {
            delivery: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    return updatedInvoice;
  }

  async getSlotAvailability(filters = {}) {
    const { date, timeSlot } = filters;

    const where = {};

    if (date) where.date = new Date(date);
    if (timeSlot) where.timeSlot = timeSlot;

    return prisma.slotAvailability.findMany({
      where,
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });
  }

  async setSlotAvailability(slotData) {
    const { date, timeSlot, maxCapacity } = slotData;

    if (!date || !timeSlot) {
      throw new Error("Date and timeSlot are required");
    }

    if (!["AM", "PM", "SAME_DAY"].includes(timeSlot)) {
      throw new Error("Invalid timeSlot. Must be AM, PM, or SAME_DAY");
    }

    const slotDate = new Date(date);

    const existing = await prisma.slotAvailability.findUnique({
      where: {
        date_timeSlot: {
          date: slotDate,
          timeSlot,
        },
      },
    });

    if (existing) {
      const updatedMaxCapacity =
        maxCapacity !== undefined ? maxCapacity : existing.maxCapacity;

      if (updatedMaxCapacity < existing.booked) {
        throw new Error(
          `Cannot set capacity to ${updatedMaxCapacity}. Current bookings: ${existing.booked}. Cancel bookings first or set higher capacity.`,
        );
      }

      return prisma.slotAvailability.update({
        where: { id: existing.id },
        data: {
          maxCapacity: updatedMaxCapacity,
          isFull: existing.booked >= updatedMaxCapacity,
        },
      });
    }

    return prisma.slotAvailability.create({
      data: {
        date: slotDate,
        timeSlot,
        maxCapacity: maxCapacity !== undefined ? maxCapacity : 5,
        booked: 0,
        isFull: false,
      },
    });
  }

  async updateSlotCapacity(slotId, method, value) {
    if (!slotId || isNaN(slotId)) {
      throw new Error("Invalid slot ID");
    }

    const slot = await prisma.slotAvailability.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (!["increase", "decrease"].includes(method)) {
      throw new Error('Method must be either "increase" or "decrease"');
    }

    if (value <= 0) {
      throw new Error("Value must be a positive number");
    }

    const capacityChange = method === "increase" ? value : -value;
    const newMaxCapacity = slot.maxCapacity + capacityChange;

    if (newMaxCapacity < 0) {
      throw new Error("Capacity cannot be negative");
    }

    if (newMaxCapacity < slot.booked) {
      throw new Error(
        `Cannot reduce capacity below current bookings (${slot.booked}). Cancel some bookings first.`,
      );
    }

    return prisma.slotAvailability.update({
      where: { id: slotId },
      data: {
        maxCapacity: newMaxCapacity,
        isFull: slot.booked >= newMaxCapacity,
      },
    });
  }

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

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
            lt: startOfMonth,
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "CUSTOMER",
          isActive: true,
        },
      }),

      prisma.user.count({
        where: {
          role: "CUSTOMER",
          isActive: true,
          createdAt: {
            lt: startOfMonth,
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "DRIVER",
          isActive: true,
          driverProfile: {
            isActiveDriver: true,
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "DRIVER",
          isActive: true,
          driverProfile: {
            isActiveDriver: true,
          },
          createdAt: {
            lt: startOfMonth,
          },
        },
      }),

      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { gte: startOfMonth },
        },
      }),

      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      prisma.delivery.count({
        where: { status: "RECEIVED" },
      }),

      prisma.delivery.count({
        where: { status: "ALLOCATED" },
      }),

      prisma.delivery.count({
        where: {
          status: "DELIVERED",
        },
      }),

      // Recent bookings
      prisma.delivery.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            include: {
              customerProfile: true,
            },
          },
        },
      }),
    ]);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueThisMonthValue = parseFloat(
      revenueThisMonth._sum.grandTotal || 0,
    );
    const revenueLastMonthValue = parseFloat(
      revenueLastMonth._sum.grandTotal || 0,
    );

    return {
      metrics: {
        totalBookings: {
          count: totalBookings,
          change: calculateChange(totalBookings, totalBookingsLastMonth),
          changeText: `${Math.abs(calculateChange(totalBookings, totalBookingsLastMonth))}% from last month`,
        },
        activeCustomers: {
          count: activeCustomers,
          change: calculateChange(activeCustomers, activeCustomersLastMonth),
          changeText: `${Math.abs(calculateChange(activeCustomers, activeCustomersLastMonth))}% from last month`,
        },
        activeDrivers: {
          count: activeDrivers,
          change: calculateChange(activeDrivers, activeDriversLastMonth),
          changeText: `${Math.abs(calculateChange(activeDrivers, activeDriversLastMonth))}% from last month`,
        },
        revenue: {
          amount: revenueThisMonthValue,
          currency: "GBP",
          formatted: `£${revenueThisMonthValue.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          change: calculateChange(revenueThisMonthValue, revenueLastMonthValue),
          changeText: `${Math.abs(calculateChange(revenueThisMonthValue, revenueLastMonthValue))}% from last month`,
        },
      },
      statusCards: {
        pending: {
          count: pendingBookings,
          label: "Pending Bookings",
          description: "Requires allocation to drivers",
          //color: 'teal'
        },
        inProgress: {
          count: inProgressBookings,
          label: "In Progress",
          description: "Currently out for delivery",
          //color: 'blue'
        },
        completedToday: {
          count: completedToday,
          label: "Completed",
          description: "Successfully delivered",
          //color: 'green'
        },
      },
      recentBookings: recentBookings.map((booking) => ({
        invoiceNumber:
          booking.invoiceNumber ||
          `MX1X-${String(booking.id).padStart(2, "0")}`,
        customer: `${booking.customer.customerProfile?.storeName || booking.customer.fullName} (${booking.customer.customerProfile?.loginId || "N/A"})`,
        date: booking.deliveryDate,
        timeSlot: booking.timeSlot,
        weight: `${booking.weight}kg`,
        status: booking.status,
        deliveryId: booking.id,
      })),
    };
  }

  resolvePeriod(period) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const monday = (d) => {
      const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
      const m = new Date(d);
      m.setDate(d.getDate() + diff);
      m.setHours(0, 0, 0, 0);
      return m;
    };
    const sunday = (mon) => {
      const s = new Date(mon);
      s.setDate(mon.getDate() + 6);
      s.setHours(23, 59, 59, 999);
      return s;
    };

    switch (period) {
      case "this_week": {
        const start = monday(now);
        const end = sunday(start);
        return { startDate: start, endDate: end };
      }
      case "last_week": {
        const thisMonday = monday(now);
        const lastMon = new Date(thisMonday);
        lastMon.setDate(thisMonday.getDate() - 7);
        return { startDate: lastMon, endDate: sunday(lastMon) };
      }
      case "this_month": {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        return { startDate: start, endDate: end };
      }
      case "last_month": {
        const start = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
          0,
          0,
          0,
          0,
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        return { startDate: start, endDate: end };
      }
      default:
        return null;
    }
  }

  async getAnalytics(filters = {}) {
    const { period } = filters;
    let { startDate, endDate } = filters;

    // If a named period is provided, resolve it to actual dates
    if (period) {
      const resolved = this.resolvePeriod(period);
      if (resolved) {
        startDate = resolved.startDate;
        endDate = resolved.endDate;
      }
    }

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
        where: startDate || endDate ? { createdAt: dateFilter } : {},
      }),

      prisma.delivery.groupBy({
        by: ["status"],
        _count: true,
        where: startDate || endDate ? { createdAt: dateFilter } : {},
      }),

      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          ...(startDate || endDate ? { invoiceDate: dateFilter } : {}),
        },
      }),

      prisma.invoice.count({
        where: startDate || endDate ? { invoiceDate: dateFilter } : {},
      }),

      prisma.invoice.count({
        where: {
          isPaid: true,
          ...(startDate || endDate ? { invoiceDate: dateFilter } : {}),
        },
      }),

      prisma.user.count({
        where: { role: "CUSTOMER", isActive: true },
      }),

      prisma.user.count({
        where: {
          role: "DRIVER",
          isActive: true,
          driverProfile: {
            isActiveDriver: true,
          },
        },
      }),

      prisma.delivery.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              fullName: true,
              customerProfile: {
                select: { loginId: true },
              },
            },
          },
          driver: {
            select: { fullName: true },
          },
        },
      }),
    ]);

    return {
      period: period || "custom",
      dateRange: {
        startDate: startDate
          ? new Date(startDate).toISOString().split("T")[0]
          : null,
        endDate: endDate ? new Date(endDate).toISOString().split("T")[0] : null,
      },
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
        role: "DRIVER",
        driverProfile: {
          isActiveDriver: true,
        },
      },
      include: {
        driverProfile: true,
        deliveriesAssigned: {
          where: startDate || endDate ? { deliveryDate: dateFilter } : {},
          select: {
            status: true,
            deliveredAt: true,
          },
        },
      },
    });

    return drivers.map((driver) => {
      const deliveries = driver.deliveriesAssigned;
      const completed = deliveries.filter(
        (d) => d.status === "DELIVERED",
      ).length;
      const pending = deliveries.filter((d) => d.status === "ALLOCATED").length;

      return {
        id: driver.id,
        name: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        vehicleRegistration: driver.driverProfile?.vehicleRegistration,
        totalAssigned: deliveries.length,
        completed,
        pending,
        completionRate:
          deliveries.length > 0
            ? ((completed / deliveries.length) * 100).toFixed(2)
            : 0,
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
        role: "CUSTOMER",
        isActive: true,
      },
      include: {
        customerProfile: {
          include: {
            pricingTier: true,
          },
        },
        deliveriesRequested: {
          where: startDate || endDate ? { createdAt: dateFilter } : {},
        },
        invoices: {
          where: startDate || endDate ? { invoiceDate: dateFilter } : {},
        },
      },
    });

    return customers.map((customer) => {
      const totalSpent = customer.invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.grandTotal),
        0,
      );
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
        averageOrderValue:
          totalDeliveries > 0 ? (totalSpent / totalDeliveries).toFixed(2) : 0,
      };
    });
  }

  async getAllDrivers(filters = {}) {
    const { isActive, search, status } = filters;

    const where = {
      role: "DRIVER",
    };

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const drivers = await prisma.user.findMany({
      where,
      include: {
        driverProfile: true,
        deliveriesAssigned: {
          select: {
            id: true,
            status: true,
            deliveryDate: true,
            deliveredAt: true,
          },
        },
        _count: {
          select: {
            deliveriesAssigned: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate this week's deliveries (Monday to Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return drivers.map((driver) => {
      const allDeliveries = driver.deliveriesAssigned;
      const thisWeekDeliveries = allDeliveries.filter((d) => {
        const deliveryDate = new Date(d.deliveryDate);
        return deliveryDate >= startOfWeek && deliveryDate <= endOfWeek;
      });

      const totalDeliveries = allDeliveries.length;
      const completed = allDeliveries.filter(
        (d) => d.status === "DELIVERED",
      ).length;
      const pending = allDeliveries.filter(
        (d) => d.status === "ALLOCATED",
      ).length;

      return {
        id: driver.id,
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        username: driver.username,
        profilePicture: driver.profilePicture,
        isActive: driver.isActive,
        createdAt: driver.createdAt,
        driverProfile: driver.driverProfile,
        performance: {
          totalDeliveries,
          completed,
          pending,
          thisWeek: thisWeekDeliveries.length,
        },
      };
    });
  }

  async getDriverById(id) {
    const driver = await prisma.user.findUnique({
      where: { id, role: "DRIVER" },
      include: {
        driverProfile: true,
        deliveriesAssigned: {
          include: {
            customer: {
              select: {
                fullName: true,
                email: true,
              },
            },
            driverFeedback: true,
          },
          orderBy: { deliveryDate: "desc" },
          take: 50,
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    // Calculate statistics
    const totalDeliveries = driver.deliveriesAssigned.length;
    const completedDeliveries = driver.deliveriesAssigned.filter(
      (d) => d.status === "DELIVERED",
    ).length;
    const pendingDeliveries = driver.deliveriesAssigned.filter(
      (d) => d.status === "ALLOCATED",
    ).length;

    return {
      ...driver,
      statistics: {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        completionRate:
          totalDeliveries > 0
            ? ((completedDeliveries / totalDeliveries) * 100).toFixed(1)
            : 0,
      },
    };
  }

  async createDriver(driverData) {
    const {
      email,
      password,
      username,
      fullName,
      phone,
      profilePicture,
      vehicleRegistration,
      driverLicenseNumber,
      address,
    } = driverData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        phone,
        profilePicture,
        role: "DRIVER",
        isActive: true,
        driverProfile: {
          create: {
            vehicleRegistration: vehicleRegistration || "",
            driverLicenseNumber: driverLicenseNumber || "",
            address: address || "",
            isActiveDriver: true,
            enableSmsNotifications: true,
            enableEmailNotifications: true,
          },
        },
      },
      include: {
        driverProfile: true,
      },
    });

    try {
      await emailService.sendWelcomeEmail(driver.email, driver.fullName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return driver;
  }

  async updateDriver(id, updateData) {
    const {
      email,
      username,
      fullName,
      phone,
      profilePicture,
      isActive,
      vehicleRegistration,
      driverLicenseNumber,
      address,
      isActiveDriver,
    } = updateData;

    const driver = await prisma.user.findUnique({
      where: { id, role: "DRIVER" },
      include: { driverProfile: true },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    if (email && email !== driver.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    if (username && username !== driver.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    const userUpdateData = {};
    if (email !== undefined) userUpdateData.email = email;
    if (username !== undefined) userUpdateData.username = username;
    if (fullName !== undefined) userUpdateData.fullName = fullName;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (profilePicture !== undefined)
      userUpdateData.profilePicture = profilePicture;
    if (isActive !== undefined) userUpdateData.isActive = isActive;

    const profileUpdateData = {};
    if (vehicleRegistration !== undefined)
      profileUpdateData.vehicleRegistration = vehicleRegistration;
    if (driverLicenseNumber !== undefined)
      profileUpdateData.driverLicenseNumber = driverLicenseNumber;
    if (address !== undefined) profileUpdateData.address = address;
    if (isActiveDriver !== undefined)
      profileUpdateData.isActiveDriver = isActiveDriver;

    const updatedDriver = await prisma.user.update({
      where: { id },
      data: {
        ...userUpdateData,
        ...(Object.keys(profileUpdateData).length > 0 && {
          driverProfile: {
            update: profileUpdateData,
          },
        }),
      },
      include: {
        driverProfile: true,
      },
    });

    return updatedDriver;
  }

  async deleteDriver(id) {
    const driver = await prisma.user.findUnique({
      where: { id, role: "DRIVER" },
      include: {
        deliveriesAssigned: {
          where: {
            status: {
              in: ["ALLOCATED", "RECEIVED"],
            },
          },
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    if (driver.deliveriesAssigned.length > 0) {
      throw new Error(
        "Cannot delete driver with active or allocated deliveries. Please reassign or complete deliveries first.",
      );
    }

    if (driver.driverProfile) {
      await prisma.driverProfile.delete({
        where: { userId: id },
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: "Driver deleted successfully" };
  }
}

module.exports = new AdminService();
