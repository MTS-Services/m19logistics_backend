/**
 * migrate-to-new-db.js
 * Step 1: Runs `prisma migrate deploy` on the new database
 * Step 2: Copies all data from OLD → NEW database table by table
 *
 * Run: node prisma/migrate-to-new-db.js
 */

const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const OLD_URL =
  "postgres://postgres:AnjLIPs3xv6lUaLkcaFT0fzmEM6FNyPxBIz3Hnt46DTBKuJ9WKMEIv2k6mCZWX9B@185.230.219.191:5568/postgres";
const NEW_URL =
  "postgres://postgres:2uzsn1BU2Y9XkIg4wibY0mgt8xcETKaruFbJ25LYi7Zsx4QLTy1VhI9gRKe3UfQR@185.230.219.191:5562/postgres";

const oldDb = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
const newDb = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

// ── helpers ────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/** Safely serialize a row — handles Prisma Decimal, Date, etc. */
function clean(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      // Prisma Decimal objects have a toFixed method; convert to number
      if (
        value !== null &&
        typeof value === "object" &&
        typeof value.toFixed === "function"
      ) {
        return parseFloat(value.toString());
      }
      return value;
    }),
  );
}

async function copyTable(name, fetchFn, insertFn) {
  const rows = await fetchFn();
  if (rows.length === 0) {
    log(`  ${name}: 0 rows — skipped`);
    return;
  }
  log(`  ${name}: copying ${rows.length} rows…`);
  for (const row of rows) {
    await insertFn(clean(row));
  }
  log(`  ${name}: ✓ done`);
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Run migrations on new DB ──────────────────────────────────
  log("Step 1: Running prisma migrate deploy on new database…");
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: NEW_URL },
      cwd: process.cwd(),
    });
    log("Step 1: ✓ Migrations applied");
  } catch (err) {
    console.error("Migration failed — aborting.", err.message);
    process.exit(1);
  }

  // ── Step 2: Connect both databases ────────────────────────────────────
  log("Step 2: Connecting to both databases…");
  await oldDb.$connect();
  await newDb.$connect();
  log("Step 2: ✓ Connected");

  // ── Step 3: Copy tables in dependency order ────────────────────────────
  log("Step 3: Copying data…");

  // 1. PricingTier (no deps)
  await copyTable(
    "PricingTier",
    () => oldDb.pricingTier.findMany(),
    (r) =>
      newDb.pricingTier.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 2. User (no deps)
  await copyTable(
    "User",
    () => oldDb.user.findMany(),
    (r) =>
      newDb.user.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 3. CustomerProfile
  await copyTable(
    "CustomerProfile",
    () => oldDb.customerProfile.findMany(),
    (r) =>
      newDb.customerProfile.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 4. DriverProfile
  await copyTable(
    "DriverProfile",
    () => oldDb.driverProfile.findMany(),
    (r) =>
      newDb.driverProfile.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 5. ManagerProfile
  await copyTable(
    "ManagerProfile",
    () => oldDb.managerProfile.findMany(),
    (r) =>
      newDb.managerProfile.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 6. Delivery — self-referential; insert without parentDeliveryId first
  const deliveries = await oldDb.delivery.findMany();
  if (deliveries.length > 0) {
    log(`  Delivery: copying ${deliveries.length} rows (pass 1 — no parent)…`);
    for (const row of deliveries) {
      const r = clean(row);
      await newDb.delivery.upsert({
        where: { id: r.id },
        update: { ...r, parentDeliveryId: null },
        create: { ...r, parentDeliveryId: null },
      });
    }
    // Pass 2: restore parentDeliveryId
    const withParent = deliveries.filter((d) => d.parentDeliveryId !== null);
    if (withParent.length > 0) {
      log(`  Delivery: pass 2 — restoring ${withParent.length} parent links…`);
      for (const row of withParent) {
        const r = clean(row);
        await newDb.delivery.update({
          where: { id: r.id },
          data: { parentDeliveryId: r.parentDeliveryId },
        });
      }
    }
    log("  Delivery: ✓ done");
  } else {
    log("  Delivery: 0 rows — skipped");
  }

  // 7. ExtraCharge
  await copyTable(
    "ExtraCharge",
    () => oldDb.extraCharge.findMany(),
    (r) =>
      newDb.extraCharge.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 8. Invoice
  await copyTable(
    "Invoice",
    () => oldDb.invoice.findMany(),
    (r) =>
      newDb.invoice.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 9. InvoiceItem
  await copyTable(
    "InvoiceItem",
    () => oldDb.invoiceItem.findMany(),
    (r) =>
      newDb.invoiceItem.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 10. DriverFeedback
  await copyTable(
    "DriverFeedback",
    () => oldDb.driverFeedback.findMany(),
    (r) =>
      newDb.driverFeedback.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 11. AuditLog
  await copyTable(
    "AuditLog",
    () => oldDb.auditLog.findMany(),
    (r) =>
      newDb.auditLog.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 12. SlotAvailability
  await copyTable(
    "SlotAvailability",
    () => oldDb.slotAvailability.findMany(),
    (r) =>
      newDb.slotAvailability.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 13. DriverAvailability
  await copyTable(
    "DriverAvailability",
    () => oldDb.driverAvailability.findMany(),
    (r) =>
      newDb.driverAvailability.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 14. SystemSetting
  await copyTable(
    "SystemSetting",
    () => oldDb.systemSetting.findMany(),
    (r) =>
      newDb.systemSetting.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 15. CompanyInformation
  await copyTable(
    "CompanyInformation",
    () => oldDb.companyInformation.findMany(),
    (r) =>
      newDb.companyInformation.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 16. BankingDetails
  await copyTable(
    "BankingDetails",
    () => oldDb.bankingDetails.findMany(),
    (r) =>
      newDb.bankingDetails.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 17. SystemConfiguration
  await copyTable(
    "SystemConfiguration",
    () => oldDb.systemConfiguration.findMany(),
    (r) =>
      newDb.systemConfiguration.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 18. Contact
  await copyTable(
    "Contact",
    () => oldDb.contact.findMany(),
    (r) =>
      newDb.contact.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 19. Enquiry
  await copyTable(
    "Enquiry",
    () => oldDb.enquiry.findMany(),
    (r) =>
      newDb.enquiry.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // 20. JobApplication
  await copyTable(
    "JobApplication",
    () => oldDb.jobApplication.findMany(),
    (r) =>
      newDb.jobApplication.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      }),
  );

  // ── Step 4: Reset all sequences so next INSERT gets the right ID ───────
  log("Step 4: Resetting PostgreSQL sequences…");
  const tables = [
    "User",
    "CustomerProfile",
    "DriverProfile",
    "ManagerProfile",
    "PricingTier",
    "Delivery",
    "ExtraCharge",
    "Invoice",
    "InvoiceItem",
    "DriverFeedback",
    "AuditLog",
    "SlotAvailability",
    "DriverAvailability",
    "SystemSetting",
    "CompanyInformation",
    "BankingDetails",
    "SystemConfiguration",
    "Contact",
    "Enquiry",
    "JobApplication",
  ];

  for (const table of tables) {
    try {
      await newDb.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
      );
      log(`  ${table} sequence reset ✓`);
    } catch (err) {
      log(
        `  ${table} sequence reset failed (may not have serial): ${err.message}`,
      );
    }
  }

  log("✅ Migration complete! All data copied to new database.");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  });
