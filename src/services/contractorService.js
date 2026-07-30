const prisma = require("../config/database");
const {
  getDocumentExpirySummary,
  getPayPeriodRange,
  pickDriverProfileFields,
  validateContractorFields,
} = require("../utils/contractorHelpers");

class ContractorService {
  async requireContractor(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId, role: "DRIVER" },
      include: { driverProfile: true },
    });

    if (!user || !user.driverProfile) {
      throw new Error("Driver profile not found");
    }
    if (user.driverProfile.driverType !== "CONTRACTOR") {
      throw new Error("This endpoint is only available for contractors");
    }
    return user;
  }

  async getDashboard(userId) {
    const user = await this.requireContractor(userId);
    const profile = user.driverProfile;
    const rate = parseFloat(profile.rate || 0);
    const payType = profile.payType || "WEEKLY";
    const { periodStart, periodEnd, label } = getPayPeriodRange(payType);

    const [periodJobs, outstandingInvoices, paidInvoices, recentJobs, recentInvoices] =
      await Promise.all([
        prisma.delivery.findMany({
          where: {
            driverId: userId,
            status: "DELIVERED",
            deliveredAt: { gte: periodStart, lte: periodEnd },
          },
          include: {
            customer: {
              select: {
                fullName: true,
                customerProfile: { select: { storeName: true } },
              },
            },
          },
          orderBy: { deliveredAt: "desc" },
        }),
        prisma.contractorInvoice.count({
          where: { contractorId: userId, status: "OUTSTANDING" },
        }),
        prisma.contractorInvoice.count({
          where: { contractorId: userId, status: "PAID" },
        }),
        prisma.delivery.findMany({
          where: { driverId: userId, status: "DELIVERED" },
          include: {
            customer: {
              select: {
                fullName: true,
                phone: true,
                customerProfile: { select: { storeName: true } },
              },
            },
          },
          orderBy: { deliveredAt: "desc" },
          take: 4,
        }),
        prisma.contractorInvoice.findMany({
          where: { contractorId: userId },
          orderBy: { issuedAt: "desc" },
          take: 4,
        }),
      ]);

    const completedJobs = periodJobs.length;
    const currentEarnings = completedJobs * rate;

    return {
      contractor: {
        id: user.id,
        fullName: user.fullName,
        tradingName: profile.tradingName || user.fullName,
        email: user.email,
        phone: user.phone,
        payType,
        rate,
        displayRole: "Contractor",
      },
      currentPeriod: {
        payType,
        label,
        periodStart,
        periodEnd,
        completedJobs,
        currentEarnings: Number(currentEarnings.toFixed(2)),
      },
      invoiceStatus: {
        paid: paidInvoices,
        outstanding: outstandingInvoices,
        summary: `Paid ${paidInvoices} - Outstanding ${outstandingInvoices}`,
      },
      recentCompletedJobs: recentJobs.map((job) => ({
        id: job.id,
        spoNumber: job.spoNumber,
        customerName:
          job.customer?.customerProfile?.storeName ||
          job.customerName ||
          job.customer?.fullName,
        deliveryDate: job.deliveryDate,
        deliveredAt: job.deliveredAt,
        amount: rate,
        status: "Completed",
      })),
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        jobCount: inv.jobCount,
        amount: inv.amount,
        status: inv.status,
        issuedAt: inv.issuedAt,
      })),
      documentStatus: getDocumentExpirySummary(profile),
    };
  }

  async getProfile(userId) {
    const user = await this.requireContractor(userId);
    const profile = user.driverProfile;

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      displayRole: "Contractor",
      driverProfile: profile,
      documentStatus: getDocumentExpirySummary(profile),
      payFieldsReadOnly: true,
    };
  }

  async updateProfile(userId, updateData) {
    await this.requireContractor(userId);

    // Contractor cannot change payType / rate
    const blocked = [];
    if (updateData.payType !== undefined) blocked.push("payType");
    if (updateData.rate !== undefined) blocked.push("rate");
    if (blocked.length) {
      throw new Error(
        `Contractors cannot change ${blocked.join(" and ")}. Contact admin.`,
      );
    }

    const errors = validateContractorFields(
      { ...updateData, driverType: "CONTRACTOR" },
      { isCreate: false },
    );
    if (errors.length) {
      throw new Error(errors.join("; "));
    }

    const userFields = {};
    if (updateData.fullName !== undefined) userFields.fullName = updateData.fullName;
    if (updateData.phone !== undefined) userFields.phone = updateData.phone;
    if (updateData.email !== undefined) userFields.email = updateData.email;
    if (updateData.profilePicture !== undefined) {
      userFields.profilePicture = updateData.profilePicture;
    }

    if (updateData.email) {
      const existing = await prisma.user.findFirst({
        where: { email: updateData.email, NOT: { id: userId } },
      });
      if (existing) throw new Error("Email already exists");
    }

    const profileFields = pickDriverProfileFields(updateData, {
      allowPayFields: false,
    });
    // Never allow changing driverType via contractor profile
    delete profileFields.driverType;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userFields,
        ...(Object.keys(profileFields).length
          ? { driverProfile: { update: profileFields } }
          : {}),
      },
      include: { driverProfile: true },
    });

    delete updated.password;
    return {
      ...updated,
      displayRole: "Contractor",
      documentStatus: getDocumentExpirySummary(updated.driverProfile),
      payFieldsReadOnly: true,
    };
  }

  async getInvoices(userId, filters = {}) {
    await this.requireContractor(userId);
    const { status, search, page = 1, limit = 10 } = filters;

    const where = { contractorId: userId };
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.invoiceNumber = { contains: search, mode: "insensitive" };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      prisma.contractorInvoice.findMany({
        where,
        include: { items: true },
        orderBy: { issuedAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.contractorInvoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getInvoiceById(userId, invoiceId) {
    await this.requireContractor(userId);
    const invoice = await prisma.contractorInvoice.findFirst({
      where: { id: invoiceId, contractorId: userId },
      include: {
        items: {
          include: {
            delivery: {
              select: {
                id: true,
                spoNumber: true,
                deliveryAddress: true,
                customerName: true,
                deliveredAt: true,
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber, { userId, isAdminOrManager }) {
    const invoice = await prisma.contractorInvoice.findUnique({
      where: { invoiceNumber },
      include: {
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            driverProfile: {
              select: {
                tradingName: true,
                payType: true,
                rate: true,
              },
            },
          },
        },
        items: {
          include: {
            delivery: {
              select: {
                id: true,
                spoNumber: true,
                deliveryAddress: true,
                customerName: true,
                deliveredAt: true,
                deliveryDate: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (!isAdminOrManager) {
      await this.requireContractor(userId);
      if (invoice.contractorId !== userId) {
        throw new Error("You can only download your own invoices");
      }
    }

    return invoice;
  }

  async generateInvoice(userId, { periodStart, periodEnd } = {}) {
    const user = await this.requireContractor(userId);
    const profile = user.driverProfile;
    const rate = parseFloat(profile.rate || 0);

    if (!profile.payType || !rate) {
      throw new Error("Pay Type and Rate must be set by admin before generating invoices");
    }

    let start;
    let end;
    if (periodStart && periodEnd) {
      start = new Date(periodStart);
      start.setHours(0, 0, 0, 0);
      end = new Date(periodEnd);
      end.setHours(23, 59, 59, 999);
    } else {
      const range = getPayPeriodRange(profile.payType);
      start = range.periodStart;
      end = range.periodEnd;
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: userId,
        status: "DELIVERED",
        deliveredAt: { gte: start, lte: end },
        contractorInvoiceItem: null,
      },
      orderBy: { deliveredAt: "asc" },
    });

    if (!deliveries.length) {
      throw new Error("No uninvoiced completed deliveries found for this period");
    }

    const jobCount = deliveries.length;
    const amount = Number((jobCount * rate).toFixed(2));
    const invoiceNumber = await this.getNextInvoiceNumber();

    const invoice = await prisma.contractorInvoice.create({
      data: {
        invoiceNumber,
        contractorId: userId,
        periodStart: start,
        periodEnd: end,
        jobCount,
        rate,
        amount,
        status: "OUTSTANDING",
        items: {
          create: deliveries.map((d) => ({
            deliveryId: d.id,
            spoNumber: d.spoNumber,
            description: `${d.spoNumber} / ${d.customerName || "Delivery"} / ${d.deliveryAddress}`,
            amount: rate,
          })),
        },
      },
      include: { items: true },
    });

    return invoice;
  }

  async getNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-C-${year}-`;

    const last = await prisma.contractorInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
    });

    let next = 1;
    if (last?.invoiceNumber) {
      const part = last.invoiceNumber.split("-").pop();
      const n = parseInt(part, 10);
      if (!Number.isNaN(n)) next = n + 1;
    }

    return `${prefix}${String(next).padStart(3, "0")}`;
  }

  // Admin helpers
  async getAllInvoices(filters = {}) {
    const { contractorId, status, page = 1, limit = 10 } = filters;
    const where = {};
    if (contractorId) where.contractorId = parseInt(contractorId);
    if (status && status !== "ALL") where.status = status;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      prisma.contractorInvoice.findMany({
        where,
        include: {
          contractor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              driverProfile: {
                select: { tradingName: true, payType: true, rate: true },
              },
            },
          },
          items: true,
        },
        orderBy: { issuedAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.contractorInvoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async markInvoicePaid(invoiceId) {
    const invoice = await prisma.contractorInvoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error("Contractor invoice not found");
    if (invoice.status === "PAID") throw new Error("Invoice is already paid");

    return prisma.contractorInvoice.update({
      where: { id: invoiceId },
      data: { status: "PAID", paidAt: new Date() },
      include: { items: true },
    });
  }

  /**
   * Delete contractor invoice.
   * - Admin/Manager: can delete any invoice
   * - Contractor: can delete only own invoice
   * - Paid invoices cannot be deleted
   */
  async deleteInvoice(invoiceId, { userId, isAdminOrManager }) {
    const invoice = await prisma.contractorInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (!isAdminOrManager) {
      await this.requireContractor(userId);
      if (invoice.contractorId !== userId) {
        throw new Error("You can only delete your own invoices");
      }
    }

    if (invoice.status === "PAID") {
      throw new Error("Paid invoices cannot be deleted");
    }

    // Cascade deletes items via schema onDelete: Cascade
    await prisma.contractorInvoice.delete({
      where: { id: invoiceId },
    });

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      deleted: true,
    };
  }
}

module.exports = new ContractorService();
