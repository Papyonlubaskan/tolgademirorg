#!/usr/bin/env node

/**
 * Mevcut görselleri veritabanına migrate et
 * Bu script public/uploads/images/ klasöründeki tüm görselleri MySQL'e BLOB olarak kaydeder
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrateImages() {
  console.log('🚀 Görsel Migration Script Başlatıldı');
  console.log('=====================================\n');

  // Database connection
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'railway'
  });

  console.log('✅ Veritabanı bağlantısı kuruldu\n');

  // Media files tablosunu oluştur
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS media_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        original_name VARCHAR(255) NOT NULL,
        file_data LONGBLOB NOT NULL,
        file_size INT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        width INT DEFAULT NULL,
        height INT DEFAULT NULL,
        alt_text VARCHAR(500) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_filename (filename),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ media_files tablosu hazır\n');
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error.message);
  }

  // Görselleri tara
  const uploadsDir = path.join(__dirname, '../public/uploads/images');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️ Uploads dizini bulunamadı:', uploadsDir);
    await connection.end();
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log(`📁 ${files.length} görsel dosyası bulundu\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filepath = path.join(uploadsDir, file);
    const stat = fs.statSync(filepath);

    if (!stat.isFile()) continue;

    try {
      // Dosyayı oku
      const fileBuffer = fs.readFileSync(filepath);
      const fileType = getFileType(file);

      // Veritabanında var mı kontrol et
      const [existing] = await connection.execute(
        'SELECT id FROM media_files WHERE filename = ?',
        [file]
      );

      if (existing.length > 0) {
        console.log(`⏭️  Zaten mevcut: ${file}`);
        skipCount++;
        continue;
      }

      // Veritabanına ekle
      await connection.execute(
        `INSERT INTO media_files (filename, original_name, file_data, file_size, file_type, is_public, created_at)
         VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
        [file, file, fileBuffer, fileBuffer.length, fileType]
      );

      console.log(`✅ Kaydedildi: ${file} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
      successCount++;

    } catch (error) {
      console.error(`❌ Hata (${file}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 Migration Özeti:');
  console.log(`✅ Başarılı: ${successCount}`);
  console.log(`⏭️  Atlandı: ${skipCount}`);
  console.log(`❌ Hata: ${errorCount}`);
  console.log(`📁 Toplam: ${files.length}`);
  console.log('=====================================\n');

  await connection.end();
  console.log('✅ Migration tamamlandı!');
}

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

// Run migration
migrateImages().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});

