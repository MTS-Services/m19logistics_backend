const prisma = require("../config/database");

class InvoiceGenerationService {
  async generateWeeklyInvoicesForAllCustomers(weekStartDate, weekEndDate) {
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

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
    // Get all delivered deliveries for this customer in the date range
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

  getCurrentWeekRange() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday

    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      weekStartDate: monday.toISOString().split("T")[0],
      weekEndDate: sunday.toISOString().split("T")[0],
    };
  }

  getLastWeekRange() {
    const { weekStartDate, weekEndDate } = this.getCurrentWeekRange();
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 7);

    return {
      weekStartDate: start.toISOString().split("T")[0],
      weekEndDate: end.toISOString().split("T")[0],
    };
  }
}

module.exports = new InvoiceGenerationService();
