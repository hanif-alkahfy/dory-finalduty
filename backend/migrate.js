const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Starting migration...');
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon (simple approach)
    // Note: This might be weak if there are semicolons inside strings, 
    // but for this schema it should be fine.
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      await pool.query(query);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
