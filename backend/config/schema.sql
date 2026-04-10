-- DoryMind – Final Duty: Database Schema
-- Requirements: 2.1, 3.1, 5.1, 7.1

CREATE DATABASE IF NOT EXISTS dorymind;
USE dorymind;

-- Tabel users
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel reminders
CREATE TABLE reminders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  phone_number    VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  scheduled_time  DATETIME NOT NULL,
  status          ENUM('pending','sent','failed') DEFAULT 'pending',
  recipient_type  ENUM('phone','group') DEFAULT 'group',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk performa scheduler
CREATE INDEX idx_reminders_status_scheduled ON reminders (status, scheduled_time);

-- Tabel message_logs
CREATE TABLE message_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  phone_number   VARCHAR(255) NOT NULL,
  message        TEXT NOT NULL,
  status         ENUM('sent','failed') NOT NULL,
  sent_at        DATETIME,
  error_message  TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
