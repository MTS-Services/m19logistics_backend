const prisma = require("../config/database");
const config = require("../config");

class InvoiceService {
  async getCustomerInvoices(customerId, filters = {}) {
    const { startDate, endDate, isPaid, search } = filters;

    const where = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (isPaid !== undefined) {
      where.isPaid = isPaid === "true";
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    // Search by invoice number or SPO number
    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          items: {
            some: {
              delivery: {
                spoNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ];
    }

    return prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            delivery: {
              select: {
                spoNumber: true,
                deliveryDate: true,
                deliveryAddress: true,
              },
            },
          },
        },
      },
      orderBy: { invoiceDate: "desc" },
    });
  }

  async getInvoiceById(id, customerId = null) {
    // Validate invoice ID
    if (!id || isNaN(id)) {
      throw new Error("Invalid invoice ID");
    }

    const where = { id };
    if (customerId) where.customerId = customerId;

    return prisma.invoice.findUnique({
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
              },
            },
          },
        },
        items: {
          include: {
            delivery: {
              include: {
                extraCharges: true,
              },
            },
          },
        },
      },
    });
  }

  async getInvoiceByNumber(invoiceNumber, customerId = null) {
    const where = { invoiceNumber };
    if (customerId) where.customerId = customerId;

    return prisma.invoice.findUnique({
      where,
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
            customerProfile: {
              select: {
                loginId: true,
                storeName: true,
                depotAddress: true,
              },
            },
          },
        },
        items: {
          include: {
            delivery: {
              include: {
                extraCharges: true,
              },
            },
          },
        },
      },
    });
  }

  async generateWeeklyInvoice(customerId, weekStartDate, weekEndDate) {
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        status: "DELIVERED",
        deliveryDate: {
          gte: new Date(weekStartDate),
          lte: new Date(weekEndDate),
        },
        invoiceItem: null,
      },
      include: {
        extraCharges: true,
      },
    });

    if (deliveries.length === 0) {
      throw new Error("No completed deliveries found for this period");
    }

    const invoiceNumber = await this.getNextInvoiceNumber();

    let subtotal = 0;
    let vatTotal = 0;

    const invoiceItems = deliveries.map((delivery) => {
      const deliverySubtotal = parseFloat(delivery.subtotal);
      const deliveryVat = parseFloat(delivery.vatAmount);

      let extraChargesTotal = 0;
      let extraChargesVat = 0;
      delivery.extraCharges.forEach((charge) => {
        extraChargesTotal += parseFloat(charge.amount);
        extraChargesVat += parseFloat(charge.vatAmount);
      });

      const itemSubtotal = deliverySubtotal + extraChargesTotal;
      const itemVat = deliveryVat + extraChargesVat;
      const itemTotal = itemSubtotal + itemVat;

      subtotal += itemSubtotal;
      vatTotal += itemVat;

      return {
        deliveryId: delivery.id,
        description: `Cust. Ref: ${delivery.spoNumber} / ${delivery.deliveryDate.toLocaleDateString()} / ${delivery.deliveryAddress}`,
        quantity: 1,
        unitCost: itemSubtotal,
        vatAmount: itemVat,
        total: itemTotal,
        isAdditional: delivery.isAdditionalDelivery,
      };
    });

    const grandTotal = subtotal + vatTotal;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        subtotal,
        vatTotal,
        grandTotal,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: {
          include: {
            delivery: true,
          },
        },
        customer: true,
      },
    });

    return invoice;
  }

  async getNextInvoiceNumber() {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "LAST_INVOICE_NUMBER" },
    });

    const currentNumber = setting
      ? parseInt(setting.value)
      : config.invoice.currentNumber;
    const nextNumber = currentNumber + 1;

    // Update setting
    await prisma.systemSetting.upsert({
      where: { key: "LAST_INVOICE_NUMBER" },
      update: { value: nextNumber.toString() },
      create: {
        key: "LAST_INVOICE_NUMBER",
        value: nextNumber.toString(),
        description: "Last invoice number issued",
      },
    });

    return `${config.invoice.prefix}${nextNumber.toString().padStart(4, "0")}`;
  }

  async markAsPaid(id) {
    return prisma.invoice.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }
}

module.exports = new InvoiceService();
