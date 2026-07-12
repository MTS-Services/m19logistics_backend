const prisma = require("../config/database");

class InvoiceGenerationService {
  normalizeWeekRange(weekStartDate, weekEndDate) {
    const start = new Date(weekStartDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(weekEndDate);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  async generateWeeklyInvoicesForAllCustomers(weekStartDate, weekEndDate) {
    const { start, end } = this.normalizeWeekRange(weekStartDate, weekEndDate);

    // Get all customers who have delivered deliver
    const customersWithDeliveries = await prisma.delivery.groupBy({
      by: ["customerId"],
      where: {
        status: "DELIVERED",
        deliveredAt: {
          gte: start,
          lte: end,
        },
        invoiceItem: null,
      },
      _count: {
        id: true,
      },
    });

    if (customersWithDeliveries.length === 0) {
      return {
        success: true,
        message: "No deliveries to invoice for this period",
        invoicesGenerated: 0,
      };
    }

    const results = [];
    const errors = [];

    // Generate invoice for each customer
    for (const customerData of customersWithDeliveries) {
      try {
        const invoice = await this.generateInvoiceForCustomer(
          customerData.customerId,
          weekStartDate,
          weekEndDate,
        );
        results.push({
          customerId: customerData.customerId,
          invoiceNumber: invoice.invoiceNumber,
          deliveryCount: customerData._count.id,
          grandTotal: invoice.grandTotal,
        });
      } catch (error) {
        errors.push({
          customerId: customerData.customerId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Generated ${results.length} invoices`,
      invoicesGenerated: results.length,
      invoices: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async generateInvoiceForCustomer(customerId, weekStartDate, weekEndDate) {
    const { start, end } = this.normalizeWeekRange(weekStartDate, weekEndDate);

    // Get all delivered deliveries for this customer in the date range
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId,
        status: "DELIVERED",
        deliveredAt: {
          gte: start,
          lte: end,
        },
        invoiceItem: null,
      },
      include: {
        extraCharges: true,
      },
    });

    if (deliveries.length === 0) {
      throw new Error(`No deliveries to invoice for customer ${customerId}`);
    }

    // Reserve next invoice number atomically to prevent duplicates
    // Use transaction to ensure atomic increment
    let invoiceNumber;
    let nextNumber;

    await prisma.$transaction(async (tx) => {
      // Get current invoice number with lock
      const lastInvoiceSetting = await tx.systemSetting.findUnique({
        where: { key: "LAST_INVOICE_NUMBER" },
      });

      const lastNumber = parseInt(lastInvoiceSetting?.value || "0");
      nextNumber = lastNumber + 1;
      invoiceNumber = `MX1X-${String(nextNumber).padStart(2, "0")}`;

      // Update the counter immediately to reserve this number
      await tx.systemSetting.upsert({
        where: { key: "LAST_INVOICE_NUMBER" },
        update: { value: String(nextNumber) },
        create: {
          key: "LAST_INVOICE_NUMBER",
          value: String(nextNumber),
          description: "Last invoice number issued",
        },
      });
    });

    // Get customer's VAT rate from their pricing tier
    const customerData = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        customerProfile: {
          include: { pricingTier: true },
        },
      },
    });
    const vatRate = customerData?.customerProfile?.pricingTier?.vatRate
      ? parseFloat(customerData.customerProfile.pricingTier.vatRate) / 100
      : 0.2;

    const round2 = (n) => Math.round(n * 100) / 100;

    let subtotal = 0;
    let grandTotal = 0;

    const invoiceItems = [];

    for (const delivery of deliveries) {
      const deliverySubtotal = round2(parseFloat(delivery.subtotal || 0));
      // Recalculate VAT from subtotal × vatRate — fixes stale stored vatAmount
      const deliveryVat = round2(deliverySubtotal * vatRate);
      const deliveryTotal = round2(deliverySubtotal + deliveryVat);

      subtotal += deliverySubtotal;
      grandTotal += deliveryTotal;

      invoiceItems.push({
        deliveryId: delivery.id,
        description: `Cust. Ref: ${delivery.spoNumber} / ${new Date(delivery.deliveryDate).toLocaleDateString("en-GB")} / ${delivery.deliveryAddress}`,
        quantity: 1,
        unitCost: deliverySubtotal,
        vatAmount: deliveryVat,
        total: deliveryTotal,
        isAdditional: false,
      });

      if (delivery.extraCharges && delivery.extraCharges.length > 0) {
        for (const charge of delivery.extraCharges) {
          const chargeAmount = round2(parseFloat(charge.amount));
          const chargeVat = round2(chargeAmount * vatRate);
          const chargeTotal = round2(chargeAmount + chargeVat);

          subtotal += chargeAmount;
          grandTotal += chargeTotal;

          invoiceItems.push({
            deliveryId: delivery.id,
            description: `Extra Charge: ${charge.description}`,
            quantity: 1,
            unitCost: chargeAmount,
            vatAmount: chargeVat,
            total: chargeTotal,
            isAdditional: true,
          });
        }
      }
    }

    // Calculate invoice-level totals from recalculated subtotal
    subtotal = round2(subtotal);
    const vatTotal = round2(subtotal * vatRate);
    grandTotal = round2(subtotal + vatTotal);

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
        paymentTerms: "30 Days (End of Month)",
        items: {
          create: invoiceItems,
        },
      },
      include: {
        customer: {
          select: {
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
        items: {
          include: {
            delivery: true,
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Mon–Sun week for invoicing, ending on the most recent Sunday.
   * On Sunday, includes today; Mon–Sat ends on the previous Sunday.
   */
  getInvoiceWeekRange(referenceDate = new Date()) {
    const ref = new Date(referenceDate);
    const daysSinceSunday = ref.getDay(); // Sun=0 … Sat=6

    const weekEndDate = new Date(ref);
    weekEndDate.setDate(ref.getDate() - daysSinceSunday);
    weekEndDate.setHours(23, 59, 59, 999);

    const weekStartDate = new Date(weekEndDate);
    weekStartDate.setDate(weekEndDate.getDate() - 6);
    weekStartDate.setHours(0, 0, 0, 0);

    return { weekStartDate, weekEndDate };
  }

  /** Week to invoice (Mon–Sun ending on the most recent Sunday). */
  getLastWeekRange() {
    return this.getInvoiceWeekRange();
  }

  toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getCurrentWeekRange() {
    const { weekStartDate, weekEndDate } = this.getInvoiceWeekRange();
    return {
      weekStartDate: this.toLocalDateString(weekStartDate),
      weekEndDate: this.toLocalDateString(weekEndDate),
    };
  }
}

module.exports = new InvoiceGenerationService();
