/**
 * Fix PostgreSQL sequences after data migration.
 * Run once with: node fix-sequences.js
 */

const { Client } = require('pg');

const NEW_DB_URL = 'postgres://postgres:AnjLIPs3xv6lUaLkcaFT0fzmEM6FNyPxBIz3Hnt46DTBKuJ9WKMEIv2k6mCZWX9B@185.230.219.191:5568/postgres';

async function main() {
    const client = new Client({ connectionString: NEW_DB_URL, ssl: false });
    await client.connect();
    console.log('Connected to new database.\n');

    // Get all sequences with their linked table and column
    const seqRes = await client.query(`
    SELECT
      seq.relname AS sequence_name,
      tab.relname AS table_name,
      attr.attname AS column_name
    FROM pg_class seq
    JOIN pg_depend dep ON dep.objid = seq.oid
    JOIN pg_class tab ON dep.refobjid = tab.oid
    JOIN pg_attribute attr ON attr.attrelid = tab.oid AND attr.attnum = dep.refobjsubid
    WHERE seq.relkind = 'S'
    ORDER BY tab.relname
  `);

    console.log(`Found ${seqRes.rows.length} sequences to reset:\n`);

    for (const { sequence_name, table_name, column_name } of seqRes.rows) {
        try {
            const maxRes = await client.query(
                `SELECT COALESCE(MAX("${column_name}"), 0) AS max_val FROM "${table_name}"`
            );
            const maxVal = parseInt(maxRes.rows[0].max_val, 10);
            const nextVal = maxVal + 1;

            await client.query(`SELECT setval('"${sequence_name}"', $1)`, [nextVal]);
            console.log(`  [OK] "${sequence_name}" → set to ${nextVal} (max ${column_name} in "${table_name}" was ${maxVal})`);
        } catch (err) {
            console.error(`  [ERR] "${sequence_name}": ${err.message}`);
        }
    }

    await client.end();
    console.log('\nAll sequences reset. New inserts will no longer conflict with existing IDs.');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
