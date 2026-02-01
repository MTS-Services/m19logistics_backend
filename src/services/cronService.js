const cron = require('node-cron');
const prisma = require('../config/database');
const emailService = require('./emailService');
const auditService = require('./auditService');
const config = require('../config');

class CronService {
  initializeJobs() {
    // Weekly driver feedback summary - Every Sunday at 11:59 PM
    cron.schedule('59 23 * * 0', async () => {
      console.log('Running weekly driver feedback summary...');
      await this.sendWeeklyDriverFeedbackSummary();
    });

    // Weekly invoice email reminder - Every Sunday at 11:00 PM
    cron.schedule('0 23 * * 0', async () => {
      console.log('Running weekly invoice email reminder...');
      await this.sendWeeklyInvoiceReminder();
    });

    console.log('✅ Cron jobs initialized:');
    console.log('   - Weekly driver feedback summary: Every Sunday 11:59 PM');
    console.log('   - Weekly invoice reminder: Every Sunday 11:00 PM');
  }

  async sendWeeklyDriverFeedbackSummary() {
    try {
      // Calculate date range for last 7 days
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
                select: { enableEmailNotifications: true }
              }
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
          createdAt: 'desc',
        },
      });

      // Also get deliveries completed with driver notes (even without feedback record)
      const deliveriesWithNotes = await prisma.delivery.findMany({
        where: {
          status: 'DELIVERED',
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
                select: { enableEmailNotifications: true }
              }
            },
          },
          customer: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          deliveredAt: 'desc',
        },
      });

      // If no feedback or notes, skip email
      if (feedbackRecords.length === 0 && deliveriesWithNotes.length === 0) {
        console.log('No driver feedback or delivery notes this week. Skipping email.');
        return;
      }

      // Send email to admin
      await emailService.sendWeeklyDriverFeedbackSummary(
        feedbackRecords,
        deliveriesWithNotes,
        startDate,
        endDate
      );

      console.log(`✅ Weekly driver feedback summary sent (${feedbackRecords.length} feedback records, ${deliveriesWithNotes.length} deliveries)`);

      // Create an audit log entry for the admin email
      try {
        await auditService.createAuditLog({
          action: 'WEEKLY_DRIVER_FEEDBACK_EMAIL',
          description: `Sent weekly driver feedback email to admins: ${feedbackRecords.length} feedback records, ${deliveriesWithNotes.length} deliveries`,
          beforeData: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            feedbackCount: feedbackRecords.length,
            deliveriesWithNotesCount: deliveriesWithNotes.length,
          },
        });
        console.log('📝 Audit log created for weekly admin feedback email');
      } catch (err) {
        console.error('❌ Failed to create audit log for weekly admin feedback email:', err);
      }

      try {
        // Collect unique driver IDs from feedback and deliveries
        const driverIds = new Set();
        feedbackRecords.forEach(f => { if (f.driver?.id) driverIds.add(f.driver.id); });
        deliveriesWithNotes.forEach(d => { if (d.driver?.id) driverIds.add(d.driver.id); });

        for (const id of driverIds) {
          const driverFeedback = feedbackRecords.filter(f => f.driver?.id === id);
          const driverDeliveries = deliveriesWithNotes.filter(d => d.driver?.id === id);

          // Take driver details from either source
          const driver = (driverFeedback[0] && driverFeedback[0].driver) || (driverDeliveries[0] && driverDeliveries[0].driver);
          if (!driver) continue;

          // Respect driver's notification preference; default true
          const prefersEmail = driver.driverProfile ? driver.driverProfile.enableEmailNotifications !== false : true;
          if (!driver.email) {
            console.log(`⚠️ Skipping driver ${driver.fullName || id} - no email on record`);
            continue;
          }
          if (!prefersEmail) {
            console.log(`ℹ️ Skipping driver ${driver.email} - email notifications disabled`);
            continue;
          }

          try {
            await emailService.sendDriverWeeklyFeedbackEmail(driver, driverFeedback, driverDeliveries, startDate, endDate);

            // Create audit log per driver email
            await auditService.createAuditLog({
              action: 'WEEKLY_DRIVER_FEEDBACK_EMAIL_DRIVER',
              userId: driver.id,
              description: `Sent weekly driver feedback email to driver ${driver.email}`,
              beforeData: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                feedbackCount: driverFeedback.length,
                deliveriesWithNotesCount: driverDeliveries.length,
              },
            });

            console.log(`✉️ Sent weekly feedback email to driver: ${driver.email} (${driverFeedback.length} feedback, ${driverDeliveries.length} deliveries)`);
          } catch (err) {
            console.error(`❌ Failed to send or log driver email for ${driver.email}:`, err);
          }
        }
      } catch (err) {
        console.error('❌ Error while sending driver-specific weekly emails:', err);
      }
    } catch (error) {
      console.error('❌ Failed to send weekly driver feedback summary:', error);
    }
  }


  async sendWeeklyInvoiceReminder() {
    try {
      // Get all unpaid invoices
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          isPaid: false,
        },
        include: {
          customer: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });


      console.log(`ℹ️  Weekly invoice reminder: ${unpaidInvoices.length} unpaid invoices found`);
    } catch (error) {
      console.error('❌ Failed to process weekly invoice reminder:', error);
    }
  }

  /**
   * Manually trigger driver feedback summary (for testing)
   */
  async triggerDriverFeedbackSummary() {
    console.log('Manually triggering driver feedback summary...');
    await this.sendWeeklyDriverFeedbackSummary();
  }
}

module.exports = new CronService();
