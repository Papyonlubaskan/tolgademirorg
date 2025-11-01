-- Eksik veritabanı tablolarını oluştur

-- 1. Book views tablosu (kitap görüntülenme sayıları)
CREATE TABLE IF NOT EXISTS book_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_book_ip (book_id, ip_address),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_book_views_book_id (book_id),
    INDEX idx_book_views_viewed_at (viewed_at)
);

-- 2. Site settings tablosu (site ayarları)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_site_settings_key (setting_key),
    INDEX idx_site_settings_public (is_public)
);

-- 3. Admin users tablosu (admin kullanıcıları)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    two_factor_secret VARCHAR(32),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admins_username (username),
    INDEX idx_admins_email (email),
    INDEX idx_admins_active (is_active)
);

-- 4. Security logs tablosu (güvenlik logları)
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id VARCHAR(255),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_security_logs_type (type),
    INDEX idx_security_logs_ip (ip_address),
    INDEX idx_security_logs_severity (severity),
    INDEX idx_security_logs_created_at (created_at)
);

-- 5. Admin notifications tablosu (admin bildirimleri)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    INDEX idx_admin_notifications_type (type),
    INDEX idx_admin_notifications_read (is_read),
    INDEX idx_admin_notifications_priority (priority),
    INDEX idx_admin_notifications_created_at (created_at)
);

-- 6. Backup records tablosu (yedekleme kayıtları)
CREATE TABLE IF NOT EXISTS backup_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type ENUM('full', 'incremental', 'differential') DEFAULT 'full',
    file_path VARCHAR(500),
    file_size BIGINT,
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_backup_records_type (type),
    INDEX idx_backup_records_status (status),
    INDEX idx_backup_records_created_at (created_at)
);

-- 7. Media files tablosu (medya dosyaları)
CREATE TABLE IF NOT EXISTS media_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    mime_type VARCHAR(100),
    alt_text TEXT,
    description TEXT,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_media_files_type (file_type),
    INDEX idx_media_files_uploaded_by (uploaded_by),
    INDEX idx_media_files_created_at (created_at)
);

-- 8. Cache entries tablosu (cache kayıtları)
CREATE TABLE IF NOT EXISTS cache_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value LONGTEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cache_entries_key (cache_key),
    INDEX idx_cache_entries_expires (expires_at)
);

-- 9. Performance metrics tablosu (performans metrikleri)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(20),
    metadata JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_performance_metrics_name (metric_name),
    INDEX idx_performance_metrics_recorded_at (recorded_at)
);

-- 10. SEO data tablosu (SEO verileri)
CREATE TABLE IF NOT EXISTS seo_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_type ENUM('book', 'chapter', 'page', 'home') NOT NULL,
    page_id INT,
    page_slug VARCHAR(255),
    title VARCHAR(200),
    description TEXT,
    keywords TEXT,
    canonical_url VARCHAR(500),
    og_title VARCHAR(200),
    og_description TEXT,
    og_image VARCHAR(500),
    twitter_card VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_seo_data_page_type (page_type),
    INDEX idx_seo_data_page_id (page_id),
    INDEX idx_seo_data_slug (page_slug)
);
