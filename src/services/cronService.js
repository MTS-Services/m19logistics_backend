const cron = require("node-cron");
const prisma = require("../config/database");
const emailService = require("./emailService");
const auditService = require("./auditService");
const invoiceGenerationService = require("./invoiceGenerationService");
const config = require("../config");

class CronService {
  constructor() {
    this.invoiceGenerationJob = null;
  }

  async initializeJobs() {
    // Weekly driver feedback summary - Every Sunday at 11:59 PM (UK Time)
    cron.schedule(
      "59 23 * * 0",
      async () => {
        console.log("Running weekly driver feedback summary...");
        await this.sendWeeklyDriverFeedbackSummary();
      },
      { timezone: "Europe/London" },
    );

    // Weekly invoice email reminder - Every Sunday at 11:00 PM (UK Time)
    cron.schedule(
      "0 23 * * 0",
      async () => {
        console.log("Running weekly invoice email reminder...");
        await this.sendWeeklyInvoiceReminder();
      },
      { timezone: "Europe/London" },
    );

    await this.initializeInvoiceGenerationJob();

    console.log("✅ Cron jobs initialized:");
    console.log(
      "   - Weekly driver feedback summary: Every Sunday 11:59 PM (Europe/London)",
    );
    console.log(
      "   - Weekly invoice reminder: Every Sunday 11:00 PM (Europe/London)",
    );
  }

  async initializeInvoiceGenerationJob() {
    try {
      const systemConfig = await prisma.systemConfiguration.findFirst();

      if (!systemConfig || !systemConfig.autoInvoicing) {
        console.log("  Auto invoicing is disabled");
        // Stop existing job if any
        if (this.invoiceGenerationJob) {
          this.invoiceGenerationJob.stop();
          this.invoiceGenerationJob = null;
          console.log("🛑 Stopped invoice generation cron job");
        }
        return;
      }

      const day = systemConfig.invoiceGenerationDay || "Sunday";
      const time = systemConfig.invoiceGenerationTime || "12:00 AM";

      const cronExpression = this.convertToCronExpression(day, time);

      if (this.invoiceGenerationJob) {
        this.invoiceGenerationJob.stop();
      }

      this.invoiceGenerationJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(
            `🕐 Running automatic invoice generation (${day} at ${time})...`,
          );
          await this.generateWeeklyInvoices();
        },
        { timezone: "Europe/London" },
      );

      console.log(
        `✅ Invoice generation scheduled: ${day} at ${time} (${cronExpression}) [Europe/London]`,
      );
    } catch (error) {
      console.error("❌ Failed to initialize invoice generation job:", error);
    }
  }

  convertToCronExpression(day, time) {
    // Map day names to cron day numbers (0 = Sunday, 6 = Saturday)
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const dayNumber = dayMap[day.toLowerCase()];

    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = time.match(timeRegex);

    if (!match) {
      console.warn(`Invalid time format: ${time}, using default 12:00 AM`);
      return `0 0 * * ${dayNumber}`;
    }

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === "AM") {
      if (hours === 12) hours = 0;
    } else if (period === "PM") {
      if (hours !== 12) hours += 12;
    }

    return `${minutes} ${hours} * * ${dayNumber}`;
  }

  async generateWeeklyInvoices() {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 7 : dayOfWeek;

      const weekEndDate = new Date(today);
      weekEndDate.setDate(today.getDate() - diff);
      weekEndDate.setHours(23, 59, 59, 999);

      const weekStartDate = new Date(weekEndDate);
      weekStartDate.setDate(weekEndDate.getDate() - 6);
      weekStartDate.setHours(0, 0, 0, 0);

      console.log(
        `📅 Generating invoices for week: ${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`,
      );

      const result =
        await invoiceGenerationService.generateWeeklyInvoicesForAllCustomers(
          weekStartDate,
          weekEndDate,
        );

      const generatedInvoices = result.invoices || [];
      console.log(
        `✅ Automatic invoice generation completed: ${generatedInvoices.length} invoices created`,
      );

      // Email each generated invoice to the customer
      const exportService = require("./exportService");
      let emailedCount = 0;
      for (const invoiceSummary of generatedInvoices) {
        try {
          const fullInvoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: invoiceSummary.invoiceNumber },
            include: {
              customer: {
                select: {
                  fullName: true,
                  email: true,
                  customerProfile: {
                    select: { storeName: true, loginId: true, ccEmail: true },
                  },
                },
              },
              items: { include: { delivery: true } },
            },
          });

          if (fullInvoice && fullInvoice.customer?.email) {
            const pdfBuffer =
              await exportService.generateInvoicePDFBuffer(fullInvoice);
            await emailService.sendInvoiceToCustomer(fullInvoice, pdfBuffer);
            emailedCount++;
            console.log(
              `📧 Invoice ${fullInvoice.invoiceNumber} emailed to ${fullInvoice.customer.email}`,
            );
          }
        } catch (emailErr) {
          console.error(
            `❌ Failed to email invoice ${invoiceSummary.invoiceNumber}: ${emailErr.message}`,
          );
        }
      }

      // Create audit log
      await auditService.createAuditLog({
        action: "AUTO_INVOICE_GENERATION",
        description: `Automatically generated ${generatedInvoices.length} weekly invoices, emailed ${emailedCount}`,
        beforeData: {
          weekStartDate: weekStartDate.toISOString(),
          weekEndDate: weekEndDate.toISOString(),
          invoicesGenerated: generatedInvoices.length,
          invoicesEmailed: emailedCount,
        },
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to generate weekly invoices:", error);
      throw error;
    }
  }

  async sendWeeklyDriverFeedbackSummary() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const feedbackRecords = await prisma.driverFeedback.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              email: true,
              driverProfile: {
                select: { enableEmailNotifications: true },
              },
            },
          },
          delivery: {
            select: {
              id: true,
              spoNumber: true,
              deliveryDate: true,
              deliveryAddress: true,
              customerName: true,
              customer: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Also get deliveries completed with driver notes (even without feedback record)
      const deliveriesWithNotes = await prisma.delivery.findMany({
        where: {
          status: "DELIVERED",
          deliveredAt: {
            gte: startDate,
            lte: endDate,
          },
          receivedBy: {
            not: null,
          },
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              email: true,
              driverProfile: {
                select: { enableEmailNotifications: true },
              },
            },
          },
          customer: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          deliveredAt: "desc",
        },
      });

      if (feedbackRecords.length === 0 && deliveriesWithNotes.length === 0) {
        console.log(
          "No driver feedback or delivery notes this week. Skipping email.",
        );
        return;
      }

      await emailService.sendWeeklyDriverFeedbackSummary(
        feedbackRecords,
        deliveriesWithNotes,
        startDate,
        endDate,
      );

      console.log(
        `✅ Weekly driver feedback summary sent (${feedbackRecords.length} feedback records, ${deliveriesWithNotes.length} deliveries)`,
      );

      try {
        await auditService.createAuditLog({
          action: "WEEKLY_DRIVER_FEEDBACK_EMAIL",
          description: `Sent weekly driver feedback email to admins: ${feedbackRecords.length} feedback records, ${deliveriesWithNotes.length} deliveries`,
          beforeData: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            feedbackCount: feedbackRecords.length,
            deliveriesWithNotesCount: deliveriesWithNotes.length,
          },
        });
        console.log("📝 Audit log created for weekly admin feedback email");
      } catch (err) {
        console.error(
          "❌ Failed to create audit log for weekly admin feedback email:",
          err,
        );
      }

      try {
        const driverIds = new Set();
        feedbackRecords.forEach((f) => {
          if (f.driver?.id) driverIds.add(f.driver.id);
        });
        deliveriesWithNotes.forEach((d) => {
          if (d.driver?.id) driverIds.add(d.driver.id);
        });

        for (const id of driverIds) {
          const driverFeedback = feedbackRecords.filter(
            (f) => f.driver?.id === id,
          );
          const driverDeliveries = deliveriesWithNotes.filter(
            (d) => d.driver?.id === id,
          );

          // Take driver details from either source
          const driver =
            (driverFeedback[0] && driverFeedback[0].driver) ||
            (driverDeliveries[0] && driverDeliveries[0].driver);
          if (!driver) continue;

          const prefersEmail = driver.driverProfile
            ? driver.driverProfile.enableEmailNotifications !== false
            : true;
          if (!driver.email) {
            console.log(
              ` Skipping driver ${driver.fullName || id} - no email on record`,
            );
            continue;
          }
          if (!prefersEmail) {
            console.log(
              `ℹ️ Skipping driver ${driver.email} - email notifications disabled`,
            );
            continue;
          }

          try {
            await emailService.sendDriverWeeklyFeedbackEmail(
              driver,
              driverFeedback,
              driverDeliveries,
              startDate,
              endDate,
            );

            await auditService.createAuditLog({
              action: "WEEKLY_DRIVER_FEEDBACK_EMAIL_DRIVER",
              userId: driver.id,
              description: `Sent weekly driver feedback email to driver ${driver.email}`,
              beforeData: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                feedbackCount: driverFeedback.length,
                deliveriesWithNotesCount: driverDeliveries.length,
              },
            });

            console.log(
              `✉️ Sent weekly feedback email to driver: ${driver.email} (${driverFeedback.length} feedback, ${driverDeliveries.length} deliveries)`,
            );
          } catch (err) {
            console.error(
              ` Failed to send or log driver email for ${driver.email}:`,
              err,
            );
          }
        }
      } catch (err) {
        console.error(
          " Error while sending driver-specific weekly emails:",
          err,
        );
      }
    } catch (error) {
      console.error(" Failed to send weekly driver feedback summary:", error);
    }
  }

  async sendWeeklyInvoiceReminder() {
    try {
      // Only send reminders for invoices older than 7 days that are still unpaid
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          isPaid: false,
          invoiceDate: { lte: sevenDaysAgo },
        },
        include: {
          customer: {
            select: {
              fullName: true,
              email: true,
              customerProfile: {
                select: { storeName: true, loginId: true, ccEmail: true },
              },
            },
          },
          items: { include: { delivery: true } },
        },
        orderBy: { invoiceDate: "asc" },
      });

      console.log(
        `ℹ️  Weekly invoice reminder: ${unpaidInvoices.length} overdue unpaid invoices found`,
      );

      if (unpaidInvoices.length === 0) return;

      const exportService = require("./exportService");
      let remindersSent = 0;

      for (const invoice of unpaidInvoices) {
        if (!invoice.customer?.email) continue;
        try {
          const pdfBuffer =
            await exportService.generateInvoicePDFBuffer(invoice);
          await emailService.sendInvoicePaymentReminder(invoice, pdfBuffer);
          remindersSent++;
          console.log(
            `📧 Payment reminder sent for invoice ${invoice.invoiceNumber} to ${invoice.customer.email}`,
          );
        } catch (err) {
          console.error(
            `❌ Failed to send reminder for invoice ${invoice.invoiceNumber}: ${err.message}`,
          );
        }
      }

      console.log(
        `✅ Invoice reminders sent: ${remindersSent}/${unpaidInvoices.length}`,
      );
    } catch (error) {
      console.error("❌ Failed to process weekly invoice reminder:", error);
    }
  }

  async triggerDriverFeedbackSummary() {
    console.log("Manually triggering driver feedback summary...");
    await this.sendWeeklyDriverFeedbackSummary();
  }
}

module.exports = new CronService();
