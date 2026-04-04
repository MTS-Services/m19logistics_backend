const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.systemSetting.upsert({
    where: { key: "LAST_INVOICE_NUMBER" },
    update: { value: "0" },
    create: {
      key: "LAST_INVOICE_NUMBER",
      value: "0",
      description: "Last invoice number issued",
    },
  });
  console.log("✅ Invoice counter reset to 0. Next invoice will be MX1X-01");
  console.log(result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
