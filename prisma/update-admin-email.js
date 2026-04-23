const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "pibanak454@bitoini.com" },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error("❌ Account pibanak454@bitoini.com not found.");
    return;
  }

  // Check new email isn't already taken
  const existing = await prisma.user.findUnique({
    where: { email: "ben@m19logistics.com" },
  });

  if (existing) {
    console.error(
      "❌ ben@m19logistics.com is already in use by another account.",
    );
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { email: "ben@m19logistics.com" },
    select: { id: true, email: true, role: true },
  });

  console.log("✅ Admin email updated:");
  console.log(`   Old: pibanak454@bitoini.com`);
  console.log(`   New: ${updated.email}`);
  console.log(`   Role: ${updated.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
