const prisma = require("./src/config/database");
const cronService = require("./src/services/cronService");
const invoiceGenerationService = require("./src/services/invoiceGenerationService");

async function main() {
  const config = await prisma.systemConfiguration.findFirst();
  console.log("=== Auto Invoice Config ===");
  if (!config) {
    console.log("No SystemConfiguration row found");
  } else {
    console.log("autoInvoicing:", config.autoInvoicing);
    console.log("day:", config.invoiceGenerationDay);
    console.log("time:", config.invoiceGenerationTime);
  }

  const { weekStartDate, weekEndDate } =
    invoiceGenerationService.getInvoiceWeekRange();
  const { start, end } = invoiceGenerationService.normalizeWeekRange(
    weekStartDate,
    weekEndDate,
  );
  console.log("\n=== Invoice Week (now) ===");
  console.log(start.toString(), "->", end.toString());

  const eligible = await prisma.delivery.findMany({
    where: {
      status: "DELIVERED",
      deliveredAt: { gte: start, lte: end },
      invoiceItem: null,
    },
    select: {
      id: true,
      spoNumber: true,
      deliveredAt: true,
      customerId: true,
      customer: { select: { fullName: true, email: true } },
    },
    orderBy: { deliveredAt: "desc" },
  });

  console.log("\n=== Eligible Deliveries (not yet invoiced) ===");
  console.log("Count:", eligible.length);
  eligible.slice(0, 10).forEach((d) => {
    console.log(
      `- ID ${d.id} | SPO ${d.spoNumber} | delivered ${d.deliveredAt?.toISOString()} | customer ${d.customer?.fullName}`,
    );
  });

  const recentDelivered = await prisma.delivery.findMany({
    where: { status: "DELIVERED" },
    select: {
      id: true,
      spoNumber: true,
      deliveredAt: true,
      invoiceItem: { select: { id: true } },
    },
    orderBy: { deliveredAt: "desc" },
    take: 5,
  });

  console.log("\n=== Recent Delivered Deliveries ===");
  if (!recentDelivered.length) console.log("None found");
  recentDelivered.forEach((d) => {
    console.log(
      `- ID ${d.id} | SPO ${d.spoNumber} | delivered ${d.deliveredAt?.toISOString()} | invoiced: ${d.invoiceItem ? "yes" : "no"}`,
    );
  });

  const recentInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      invoiceNumber: true,
      weekStartDate: true,
      weekEndDate: true,
      createdAt: true,
      customer: { select: { fullName: true } },
    },
  });

  console.log("\n=== Latest Invoices ===");
  if (!recentInvoices.length) console.log("None found");
  recentInvoices.forEach((i) => {
    console.log(
      `- ${i.invoiceNumber} | ${i.customer?.fullName} | created ${i.createdAt?.toISOString()}`,
    );
  });

  const runNow = process.argv.includes("--run");
  if (runNow) {
    console.log("\n=== Running auto invoice job now (same as cron) ===");
    const result = await cronService.generateWeeklyInvoices();
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("\nTo test generation now, run:");
    console.log("  node check-auto-invoice.js --run");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
