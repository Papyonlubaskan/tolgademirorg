-- Temiz veritabanı dump
-- Oluşturulma: 2025-11-01 15:18:37

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway;

-- Admin kullanıcısı
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin default şifre: Maral2025@-
INSERT INTO admins (username, email, password, two_factor_enabled) VALUES
('admin', 'admin@tolgademir.org', '.vX4nJZYqF8YP5xH.8KZE8YqF8YP5xH.8KZE8YqF8YP5xH.', FALSE);

