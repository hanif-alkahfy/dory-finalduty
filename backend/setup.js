/**
 * setup.js — Inisialisasi database DoryMind
 *
 * Menjalankan 3 langkah sekaligus:
 *   1. Migrate  — buat semua tabel dari schema.sql
 *   2. Seed     — buat akun admin default
 *
 * Cara pakai:
 *   node setup.js
 *   atau: npm run setup
 *
 * Aman dijalankan berulang kali (idempotent):
 *   - Tabel tidak akan dibuat ulang jika sudah ada (CREATE TABLE IF NOT EXISTS)
 *   - Admin tidak akan dibuat ulang jika email sudah terdaftar
 */

require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ─── Konfigurasi ──────────────────────────────────────────────────────────

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@dorymind.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ─── Step 1: Migrate ──────────────────────────────────────────────────────

async function migrate() {
  console.log('\n[1/2] Menjalankan migrasi database...');

  const schemaPath = path.join(__dirname, 'config', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Hapus baris komentar dan split per statement
  const queries = sql
    .split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0 && !q.startsWith('--'));

  for (const query of queries) {
    const preview = query.replace(/\s+/g, ' ').substring(0, 60);
    await pool.query(query);
    console.log(`  ✓ ${preview}...`);
  }

  console.log('  Migrasi selesai.');
}

// ─── Step 2: Seed ─────────────────────────────────────────────────────────

async function seed() {
  console.log('\n[2/2] Menjalankan seeding data awal...');

  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE email = ?',
    [ADMIN_EMAIL]
  );

  if (rows.length > 0) {
    console.log(`  ℹ Admin "${ADMIN_EMAIL}" sudah ada, dilewati.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.execute(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [ADMIN_EMAIL, hashedPassword]
  );

  console.log(`  ✓ Admin dibuat: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  ⚠  Segera ganti password setelah login pertama!');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== DoryMind Setup ===');
  console.log(`Database: ${process.env.DB_NAME || 'dorymind'} @ ${process.env.DB_HOST || 'localhost'}`);

  try {
    await migrate();
    await seed();
    console.log('\n✅ Setup selesai! Backend siap dijalankan.\n');
  } catch (err) {
    console.error('\n❌ Setup gagal:', err.message);
    console.error('Pastikan MySQL berjalan dan konfigurasi .env sudah benar.');
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
