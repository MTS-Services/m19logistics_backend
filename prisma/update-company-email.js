const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.companyInformation.findFirst();
  if (!existing) {
    console.log("No CompanyInformation record found.");
    return;
  }
  const updated = await prisma.companyInformation.update({
    where: { id: existing.id },
    data: { email: "invoices@m19logistics.com" },
  });
  console.log("✅ Company email updated to:", updated.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
