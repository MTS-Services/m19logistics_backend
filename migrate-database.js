const { PrismaClient } = require('@prisma/client');

const OLD_DATABASE_URL = "postgres://postgres:b5OE5ibu8GOvofsvDrBxqQGi3dfKzCxee91VeQZkmoVQg4YPEXh8fXkRmu3bqFmA@147.93.107.217:5426/postgres";
const NEW_DATABASE_URL = "postgres://postgres:7BKtk9NTUVr5PiYKYZv73ZJLbvU8XrQGnHNxLXjL08w0Iln2a9besBFYFNLbZuMT@147.93.107.217:5445/postgres";

async function migrateData() {
    console.log('🚀 Starting database migration...\n');

    // Create Prisma clients for both databases
    const oldPrisma = new PrismaClient({
        datasources: { db: { url: OLD_DATABASE_URL } }
    });

    const newPrisma = new PrismaClient({
        datasources: { db: { url: NEW_DATABASE_URL } }
    });

    try {
        await oldPrisma.$connect();
        await newPrisma.$connect();
        console.log('✅ Connected to both databases\n');

        // Get all tables and their data
        const tables = [
            'user',
            'adminProfile',
            'managerProfile',
            'customerProfile',
            'driverProfile',
            'pricingTier',
            'delivery',
            'deliveryTimeSlot',
            'invoiceItem',
            'invoiceEdit',
            'invoice',
            'auditLog',
            'contact',
            'enquiry',
            'jobApplication'
        ];

        for (const table of tables) {
            try {
                console.log(`📦 Migrating ${table}...`);

                // Fetch data from old database
                const data = await oldPrisma[table].findMany();
                console.log(`   Found ${data.length} records`);

                if (data.length > 0) {
                    // Insert data into new database
                    for (const record of data) {
                        try {
                            await newPrisma[table].create({ data: record });
                        } catch (err) {
                            // Handle potential duplicate keys or conflicts
                            console.log(`   ⚠️  Skipping duplicate record in ${table}: ${err.message}`);
                        }
                    }
                    console.log(`   ✅ Migrated ${data.length} records to ${table}\n`);
                } else {
                    console.log(`   ℹ️  No records to migrate\n`);
                }
            } catch (error) {
                console.error(`   ❌ Error migrating ${table}:`, error.message);
                console.log('   Continuing with next table...\n');
            }
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await oldPrisma.$disconnect();
        await newPrisma.$disconnect();
    }
}

migrateData()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
