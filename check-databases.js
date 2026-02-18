const { PrismaClient } = require('@prisma/client');

const OLD_DATABASE_URL = "postgres://postgres:b5OE5ibu8GOvofsvDrBxqQGi3dfKzCxee91VeQZkmoVQg4YPEXh8fXkRmu3bqFmA@147.93.107.217:5426/postgres";
const NEW_DATABASE_URL = "postgres://postgres:7BKtk9NTUVr5PiYKYZv73ZJLbvU8XrQGnHNxLXjL08w0Iln2a9besBFYFNLbZuMT@147.93.107.217:5445/postgres";

async function checkDatabases() {
    console.log('📊 Checking database connections...\n');

    // Check old database
    console.log('🔍 Checking OLD database (port 5426)...');
    const oldPrisma = new PrismaClient({
        datasources: { db: { url: OLD_DATABASE_URL } }
    });

    try {
        await oldPrisma.$connect();
        console.log('✅ OLD database is accessible');

        // Check for data
        const userCount = await oldPrisma.user.count();
        const deliveryCount = await oldPrisma.delivery.count();
        const invoiceCount = await oldPrisma.invoice.count();

        console.log(`   👥 Users: ${userCount}`);
        console.log(`   📦 Deliveries: ${deliveryCount}`);
        console.log(`   📄 Invoices: ${invoiceCount}\n`);

        await oldPrisma.$disconnect();
    } catch (error) {
        console.log(`❌ OLD database is NOT accessible: ${error.message}\n`);
    }

    // Check new database
    console.log('🔍 Checking NEW database (port 5445)...');
    const newPrisma = new PrismaClient({
        datasources: { db: { url: NEW_DATABASE_URL } }
    });

    try {
        await newPrisma.$connect();
        console.log('✅ NEW database is accessible');

        // Check for data
        const userCount = await newPrisma.user.count();
        const deliveryCount = await newPrisma.delivery.count();
        const invoiceCount = await newPrisma.invoice.count();

        console.log(`   👥 Users: ${userCount}`);
        console.log(`   📦 Deliveries: ${deliveryCount}`);
        console.log(`   📄 Invoices: ${invoiceCount}\n`);

        await newPrisma.$disconnect();
    } catch (error) {
        console.log(`❌ NEW database is NOT accessible: ${error.message}\n`);
    }
}

checkDatabases()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
