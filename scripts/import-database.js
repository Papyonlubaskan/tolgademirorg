/**
 * MySQL Database Import Script
 * SQL dosyasını import eder
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// SQL dosyasını argüman olarak al
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Kullanım: node scripts/import-database.js <sql-file-path>');
  console.error('Örnek: node scripts/import-database.js exports/tolgademir-export-2025-01-10.sql');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tolgademir',
  multipleStatements: true
};

async function importDatabase() {
  const sqlFilePath = path.isAbsolute(sqlFile) ? sqlFile : path.join(process.cwd(), sqlFile);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Dosya bulunamadı: ${sqlFilePath}`);
    process.exit(1);
  }
  
  console.log(`🔄 Import başlıyor: ${sqlFilePath}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL bağlantısı kuruldu');
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📄 SQL dosyası okundu: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    
    // Sorguları çalıştır
    await connection.query(sqlContent);
    
    console.log('✅ Import tamamlandı');
    
    // Tabloları kontrol et
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Toplam ${tables.length} tablo mevcut`);
    
    await connection.end();
    console.log('✅ Bağlantı kapatıldı');
    
  } catch (error) {
    console.error('❌ Import hatası:', error.message);
    process.exit(1);
  }
}

importDatabase();

