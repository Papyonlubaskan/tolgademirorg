-- 404 hatasını çözmek için hızlı düzeltme

-- 1. Books tablosunda slug'ları kontrol et
SELECT id, title, slug FROM books WHERE slug IS NOT NULL;

-- 2. Eğer slug yoksa oluştur
UPDATE books SET slug = LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), 'ı', 'i'), 'ş', 's')) WHERE slug IS NULL OR slug = '';

-- 3. Saka ve Sanrı kitabını kontrol et
SELECT * FROM books WHERE title LIKE '%saka%' OR title LIKE '%sanrı%';

-- 4. Eğer kitap yoksa ekle
INSERT INTO books (title, slug, description, author, status, created_at) 
VALUES ('Test Kitap', 'test-kitap', 'Test kitap açıklaması', 'Tolga Demir', 'published', NOW())
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 5. Gerekli tabloları oluştur
CREATE TABLE IF NOT EXISTS book_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_book_ip (book_id, ip_address),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Varsayılan ayarları ekle
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('maintenance_mode', 'false'),
('site_title', 'Tolga Demir'),
('site_description', 'Yazar & Hikaye Anlatıcı');
