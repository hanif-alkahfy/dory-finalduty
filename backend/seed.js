const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting seeding...');
    
    // Check if user already exists
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@dorymind.com']);
    
    if (rows.length > 0) {
      console.log('Admin user already exists. Skipping...');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        ['admin@dorymind.com', hashedPassword]
      );
      console.log('Admin user seeded: admin@dorymind.com / admin123');
    }
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit();
  }
}

seed();
