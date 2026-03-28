const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting database cleanup...");
  console.log(
    "   Keeping: User, CustomerProfile, DriverProfile, ManagerProfile,",
  );
  console.log(
    "            PricingTier, CompanyInformation, BankingDetails, SystemConfiguration",
  );
  console.log("");

  // ── Delete in child-first order to satisfy foreign-key constraints ──────────

  const invoiceItems = await prisma.invoiceItem.deleteMany({});
  console.log(`✅ InvoiceItem     — deleted ${invoiceItems.count} rows`);

  const extraCharges = await prisma.extraCharge.deleteMany({});
  console.log(`✅ ExtraCharge     — deleted ${extraCharges.count} rows`);

  const driverFeedback = await prisma.driverFeedback.deleteMany({});
  console.log(`✅ DriverFeedback  — deleted ${driverFeedback.count} rows`);

  const auditLogs = await prisma.auditLog.deleteMany({});
  console.log(`✅ AuditLog        — deleted ${auditLogs.count} rows`);

  const invoices = await prisma.invoice.deleteMany({});
  console.log(`✅ Invoice         — deleted ${invoices.count} rows`);

  const deliveries = await prisma.delivery.deleteMany({});
  console.log(`✅ Delivery        — deleted ${deliveries.count} rows`);

  const driverAvailability = await prisma.driverAvailability.deleteMany({});
  console.log(
    `✅ DriverAvailability — deleted ${driverAvailability.count} rows`,
  );

  const slotAvailability = await prisma.slotAvailability.deleteMany({});
  console.log(`✅ SlotAvailability — deleted ${slotAvailability.count} rows`);

  const systemSettings = await prisma.systemSetting.deleteMany({});
  console.log(`✅ SystemSetting   — deleted ${systemSettings.count} rows`);

  const contacts = await prisma.contact.deleteMany({});
  console.log(`✅ Contact         — deleted ${contacts.count} rows`);

  const enquiries = await prisma.enquiry.deleteMany({});
  console.log(`✅ Enquiry         — deleted ${enquiries.count} rows`);

  const jobApplications = await prisma.jobApplication.deleteMany({});
  console.log(`✅ JobApplication  — deleted ${jobApplications.count} rows`);

  console.log("");
  console.log("🎉 Cleanup complete. Reference / config data is untouched.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
