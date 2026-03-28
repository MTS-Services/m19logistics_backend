const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Pricing Tiers
  console.log("Creating pricing tiers...");
  const tierA = await prisma.pricingTier.upsert({
    where: { name: "Tier A" },
    update: {},
    create: {
      name: "Tier A",
      basePrice: 41.67, // £50 total with VAT
      vatRate: 20.0,
      description: "Premium pricing tier for Topps Newcastle",
    },
  });

  const tierB = await prisma.pricingTier.upsert({
    where: { name: "Tier B" },
    update: {},
    create: {
      name: "Tier B",
      basePrice: 37.5, // £45 total with VAT
      vatRate: 20.0,
      description: "Standard pricing tier",
    },
  });

  console.log("✅ Pricing tiers created");

  // Hash default passwords
  const defaultPassword = await bcrypt.hash("Password022", 10);
  const bkPassword = await bcrypt.hash("M1901", 10);
  const robPassword = await bcrypt.hash("Topps01", 10);

  // Create Customers (Topps Stores)
  console.log("Creating customer accounts...");

  const customers = [
    {
      email: "topps022@toppstiles.co.uk",
      username: "T022",
      fullName: "Topps Chester",
      profile: {
        storeName: "Topps Chester",
        loginId: "T022",
        depotAddress: "4 Bumpers Lane, Sealand Ind Est, Chester, CH1 4LY",
        pricingTierId: tierB.id,
      },
    },
    {
      email: "topps226@toppstiles.co.uk",
      username: "T226",
      fullName: "Topps Nantwich",
      profile: {
        storeName: "Topps Nantwich",
        loginId: "T226",
        depotAddress: "Unit 1, Nantwich Trade Park, CW5 6HL",
        pricingTierId: tierB.id,
      },
    },
    {
      email: "topps167@toppstiles.co.uk",
      username: "T167",
      fullName: "Topps Newcastle",
      profile: {
        storeName: "Topps Newcastle",
        loginId: "T167",
        depotAddress: "Unit 4, Lyme Court, ST5 3TF",
        pricingTierId: tierA.id, // Custom pricing
      },
    },
    {
      email: "topps143@toppstiles.co.uk",
      username: "T143",
      fullName: "Topps Northwich",
      profile: {
        storeName: "Topps Northwich",
        loginId: "T143",
        depotAddress: "Wadebrook Retail Park, CW9 5NN",
        pricingTierId: tierB.id,
      },
    },
    {
      email: "topps211@toppstiles.co.uk",
      username: "T211",
      fullName: "Topps Rhyl",
      profile: {
        storeName: "Topps Rhyl",
        loginId: "T211",
        depotAddress: "152 Vale Road, Rhyl, LL18 2PD",
        pricingTierId: tierB.id,
      },
    },
    {
      email: "topps217@toppstiles.co.uk",
      username: "T217",
      fullName: "Topps Wrexham",
      profile: {
        storeName: "Topps Wrexham",
        loginId: "T217",
        depotAddress: "Unit 7-9 Cambrian Price Ind. Est., Wrexham LL13 8DL",
        pricingTierId: tierB.id,
      },
    },
  ];

  for (const customer of customers) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        email: customer.email,
        username: customer.username,
        fullName: customer.fullName,
        password: defaultPassword,
        role: "CUSTOMER",
        requirePasswordReset: true,
        phone: "01244398888", // Default phone, can be updated
        customerProfile: {
          create: customer.profile,
        },
      },
    });
  }

  console.log("✅ Customer accounts created");

  // Create Driver (BK)
  console.log("Creating driver account...");
  await prisma.user.upsert({
    where: { email: "wwwbk@yahoo.co.uk" },
    update: {},
    create: {
      email: "wwwbk@yahoo.co.uk",
      username: "BK01",
      fullName: "BK",
      password: bkPassword,
      role: "DRIVER",
      phone: "07971415430",
      requirePasswordReset: true,
      profilePicture: "/uploads/profile_pics/bk.jpg", // Will need to upload actual image
      driverProfile: {
        create: {
          isActiveDriver: true,
          enableEmailNotifications: true,
        },
      },
    },
  });

  console.log("✅ Driver account created");

  // Create Area Manager (Rob Myers)
  console.log("Creating area manager account...");
  await prisma.user.upsert({
    where: { email: "rob.myers@toppstiles.com" },
    update: {},
    create: {
      email: "rob.myers@toppstiles.com",
      username: "Rob01",
      fullName: "Rob Myers",
      password: robPassword,
      role: "MANAGER",
      phone: "07725957625",
      requirePasswordReset: true,
    },
  });

  console.log("✅ Area manager account created");

  // Create Admin Account
  console.log("Creating admin account...");
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@m19logistics.com" },
    update: {},
    create: {
      email: "admin@m19logistics.com",
      username: "admin",
      fullName: "M19 Admin",
      password: adminPassword,
      role: "ADMIN",
      phone: "07971415430",
      requirePasswordReset: false,
    },
  });

  console.log("✅ Admin account created");

  // Create Essential System Settings (only critical defaults)
  console.log("Creating essential system settings...");
  await prisma.systemSetting.upsert({
    where: { key: "LAST_INVOICE_NUMBER" },
    update: {},
    create: {
      key: "LAST_INVOICE_NUMBER",
      value: "326",
      description: "Last invoice number issued (T0326)",
    },
  });

  console.log("✅ Essential system settings created");
  console.log(
    "ℹ️  Admin can configure Company, Banking, and System settings via Settings API",
  );

  console.log("");
  console.log("🎉 Database seeding completed successfully!");
  console.log("");
  console.log("📝 Default Login Credentials:");
  console.log("─".repeat(60));
  console.log("Admin:");
  console.log("  Email: admin@m19logistics.com");
  console.log("  Password: Admin123!");
  console.log("");
  console.log("Driver (BK):");
  console.log("  Username: BK01");
  console.log("  Password: M1901 (must change on first login)");
  console.log("");
  console.log("Area Manager (Rob):");
  console.log("  Username: Rob01");
  console.log("  Password: Topps01 (must change on first login)");
  console.log("");
  console.log("Customers (All Topps Stores):");
  console.log("  Username: T022, T226, T167, T143, T211, T217");
  console.log("  Password: Password022, Password226, etc.");
  console.log("  (All must change on first login)");
  console.log("─".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
