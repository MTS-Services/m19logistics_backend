/**
 * Data migration script: copy all data from old database to new database.
 * Run once with: node migrate-data.js
 */

const { Client } = require('pg');

const OLD_DB_URL = 'postgres://postgres:7BKtk9NTUVr5PiYKYZv73ZJLbvU8XrQGnHNxLXjL08w0Iln2a9besBFYFNLbZuMT@147.93.107.217:5445/postgres';
const NEW_DB_URL = 'postgres://postgres:AnjLIPs3xv6lUaLkcaFT0fzmEM6FNyPxBIz3Hnt46DTBKuJ9WKMEIv2k6mCZWX9B@185.230.219.191:5568/postgres';

// Tables in dependency order (parents before children)
const TABLES = [
    'User',
    'CustomerProfile',
    'DriverProfile',
    'SlotAvailability',
    'DriverAvailability',
    'Delivery',
    'DeliveryStop',
    'Invoice',
    'InvoiceItem',
    'AuditLog',
    'ContactEnquiry',
    'JobApplication',
    'SystemSetting',
    'SettingCategory',
    'SettingItem',
    '_prisma_migrations',
];

async function migrateTable(oldClient, newClient, table) {
    // Get row count first
    const countRes = await oldClient.query(`SELECT COUNT(*) FROM "${table}"`);
    const total = parseInt(countRes.rows[0].count, 10);

    if (total === 0) {
        console.log(`  [SKIP] "${table}" — 0 rows`);
        return 0;
    }

    // Fetch all rows
    const { rows } = await oldClient.query(`SELECT * FROM "${table}"`);

    if (rows.length === 0) {
        console.log(`  [SKIP] "${table}" — 0 rows`);
        return 0;
    }

    // Build parameterized INSERT … ON CONFLICT DO NOTHING
    const columns = Object.keys(rows[0]);
    const colList = columns.map(c => `"${c}"`).join(', ');

    // Disable triggers on new DB temporarily (for FK constraints)
    await newClient.query('BEGIN');
    try {
        await newClient.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);

        let inserted = 0;
        for (const row of rows) {
            const values = columns.map(c => row[c]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            await newClient.query(
                `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
            );
            inserted++;
        }

        await newClient.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);
        await newClient.query('COMMIT');
        console.log(`  [OK]   "${table}" — ${inserted}/${total} rows copied`);
        return inserted;
    } catch (err) {
        await newClient.query('ROLLBACK');
        throw err;
    }
}

async function main() {
    console.log('=== M19 Logistics — Database Migration ===\n');

    const oldClient = new Client({ connectionString: OLD_DB_URL, ssl: false });
    const newClient = new Client({ connectionString: NEW_DB_URL, ssl: false });

    console.log('Connecting to OLD database...');
    await oldClient.connect();
    console.log('Connecting to NEW database...');
    await newClient.connect();
    console.log('Both connections established.\n');

    // Discover actual tables in old DB (in case some don't exist)
    const tableListRes = await oldClient.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
    const existingTables = tableListRes.rows.map(r => r.tablename);
    console.log(`Tables found in old DB: ${existingTables.join(', ')}\n`);

    let totalCopied = 0;
    let errors = [];

    for (const table of existingTables) {
        try {
            // Skip the prisma migrations table — already applied on new DB
            if (table === '_prisma_migrations') {
                console.log(`  [SKIP] "${table}" — migrations already applied`);
                continue;
            }
            const count = await migrateTable(oldClient, newClient, table);
            totalCopied += count;
        } catch (err) {
            console.error(`  [ERR]  "${table}" — ${err.message}`);
            errors.push({ table, error: err.message });
        }
    }

    // Reset all sequences so future INSERTs don't conflict with copied IDs
    console.log('\nResetting sequences...');
    const seqRes = await newClient.query(`
    SELECT sequence_name FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `);
    for (const { sequence_name } of seqRes.rows) {
        // Derive the table/column name from sequence name (Prisma convention: TableName_id_seq)
        try {
            await newClient.query(`
        SELECT setval('${sequence_name}', COALESCE((
          SELECT MAX(id) FROM "${sequence_name.replace(/_id_seq$/, '')}"
        ), 1))
      `);
            console.log(`  Reset sequence: ${sequence_name}`);
        } catch {
            // Ignore sequences that don't map cleanly
        }
    }

    await oldClient.end();
    await newClient.end();

    console.log(`\n=== Migration Complete ===`);
    console.log(`Total rows copied: ${totalCopied}`);
    if (errors.length > 0) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(e => console.log(`  - ${e.table}: ${e.error}`));
    } else {
        console.log('No errors encountered.');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
