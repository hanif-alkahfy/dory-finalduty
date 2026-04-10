const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Running incremental migration...');
    const query = `
      CREATE TABLE IF NOT EXISTS bot_settings (
        setting_key   VARCHAR(255) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('Bot settings table created successfully!');
  } catch (err) {
    console.error('Incremental migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
