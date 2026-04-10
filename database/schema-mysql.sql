-- RouterTrack Database Schema untuk MySQL
-- Database: routertrack_db
-- Jalankan script ini di phpMyAdmin atau MySQL CLI

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS routertrack_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE routertrack_db;

-- 1. Tabel untuk data User (dengan authentication)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama_akun VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  warehouse VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel untuk data ONT
CREATE TABLE IF NOT EXISTS ont_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  item_code VARCHAR(255) NOT NULL,
  item_description TEXT NOT NULL,
  owner VARCHAR(255) NOT NULL,
  purchase_reference VARCHAR(255),
  supplier VARCHAR(255),
  location_type VARCHAR(255),
  location_code VARCHAR(255),
  location_description TEXT,
  inventory_status VARCHAR(255),
  condition_status VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  INDEX idx_serial_number (serial_number),
  INDEX idx_item_code (item_code),
  INDEX idx_owner (owner),
  INDEX idx_location_code (location_code),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel untuk data unrefurbish
CREATE TABLE IF NOT EXISTS unrefurbish_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(255) NOT NULL,
  tes_visual JSON NOT NULL,
  photos JSON,
  photo_count INT DEFAULT 0,
  completed_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Unrefurbished',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  INDEX idx_serial_number (serial_number),
  INDEX idx_status (status),
  INDEX idx_completed_at (completed_at),
  FOREIGN KEY (serial_number) REFERENCES ont_data(serial_number) ON DELETE CASCADE
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insert default admin user
-- Password: admin123456 (sudah di-hash dengan bcrypt)
INSERT INTO user_profiles (email, password_hash, nama_akun, username, warehouse, role, status, created_by)
VALUES (
  'admin@routertrack.com',
  '$2a$10$V8qLUUNW.zkzvicquDFpVuasKJD8HavT2ZUa0c.Yv/zqHzutvDaya',
  'Administrator',
  'admin',
  'TA ISO INV BEKASI JUANDAKALIABANG WH',
  'admin',
  'active',
  'system'
) ON DUPLICATE KEY UPDATE email = email;

-- 5. Insert sample user untuk testing (optional)
INSERT INTO user_profiles (email, password_hash, nama_akun, username, warehouse, role, status, created_by)
VALUES (
  'user@routertrack.com',
  '$2a$10$NNrfUKG2zZVsr5cnmvDxkO6TAU87p2ZM6iTViBJWpFqwa8UhBHs9e',
  'User Demo',
  'user1',
  'Gudang Demo',
  'user',
  'active',
  'system'
) ON DUPLICATE KEY UPDATE email = email;
