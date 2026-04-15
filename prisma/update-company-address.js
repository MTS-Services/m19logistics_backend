const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.companyInformation.findFirst();

  if (existing) {
    const updated = await prisma.companyInformation.update({
      where: { id: existing.id },
      data: {
        address: "84 Acton Hall Walks, Wrexham, LL12 7YJ",
      },
    });
    console.log("✅ Company address updated:");
    console.log(`   ${updated.address}`);
  } else {
    console.log("⚠️  No CompanyInformation record found. Creating one...");
    const created = await prisma.companyInformation.create({
      data: {
        name: "M19 Logistics",
        vatNumber: "GB000000000",
        primaryPhone: "07818077110",
        email: "invoices@m19logistics.com",
        address: "84 Acton Hall Walks, Wrexham, LL12 7YJ",
      },
    });
    console.log("✅ Created:", created);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
