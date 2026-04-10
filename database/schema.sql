-- RouterTrack Database Schema untuk MySQL
-- Jalankan script ini di MySQL (phpMyAdmin atau MySQL Workbench)

-- 1. Tabel untuk data ONT
CREATE TABLE ont_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel untuk data user
CREATE TABLE user_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama_akun VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  warehouse VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel untuk data unrefurbish
CREATE TABLE unrefurbish_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(255) NOT NULL,
  tes_visual JSON NOT NULL,
  photos JSON, -- Array of base64 strings atau URLs
  photo_count INT DEFAULT 0,
  completed_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Unrefurbished',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (serial_number) REFERENCES ont_data(serial_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Indexes untuk performa
CREATE INDEX idx_ont_data_serial_number ON ont_data(serial_number);
CREATE INDEX idx_ont_data_item_code ON ont_data(item_code);
CREATE INDEX idx_ont_data_owner ON ont_data(owner);
CREATE INDEX idx_ont_data_location_code ON ont_data(location_code);
CREATE INDEX idx_ont_data_created_at ON ont_data(created_at);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

CREATE INDEX idx_unrefurbish_data_serial_number ON unrefurbish_data(serial_number);
CREATE INDEX idx_unrefurbish_data_status ON unrefurbish_data(status);
CREATE INDEX idx_unrefurbish_data_completed_at ON unrefurbish_data(completed_at);

-- 5. Insert default admin user
-- Password: admin123 (hash bcrypt)
-- PENTING: Ganti password setelah login pertama kali!
INSERT INTO user_profiles (
  email,
  password_hash,
  nama_akun,
  username,
  warehouse,  
  role,
  status,
  created_by
) VALUES (
  'admin@routertrack.com',
  '$2a$10$YourBcryptHashHere', -- Ganti dengan hash password yang benar
  'Administrator',
  'admin',
  'TA ISO INV BEKASI JUANDAKALIABANG WH',
  'admin',
  'active',
  'system'
) ON DUPLICATE KEY UPDATE
  nama_akun = VALUES(nama_akun),
  warehouse = VALUES(warehouse),
  role = VALUES(role),
  status = VALUES(status);

-- Catatan: 
-- 1. Timestamps (created_at, updated_at) akan otomatis di-handle oleh MySQL
-- 2. Security/authorization harus di-handle di application layer (Next.js)
-- 3. Gunakan script generate-password-hash.js untuk membuat password hash
