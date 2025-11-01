/**
 * Railway Otomatik Backup Script
 * Her gece 03:00'te çalışır
 */

const mysql = require('mysql2/promise');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { execSync } = require('child_process');

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvgsmuhjt',
  api_key: process.env.CLOUDINARY_API_KEY || '911194959441699',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vCFmQl3ffuacqiOnE38E3la6dg8'
});

// MySQL Config
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `tolgademir-backup-${timestamp}.sql`;
  const backupPath = `/tmp/${backupFileName}`;
  
  console.log(`🔄 Backup başlıyor: ${backupFileName}`);
  
  try {
    // MySQL bağlantısı kur
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL bağlantısı kuruldu');
    
    // Tüm tabloları al
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📋 ${tableNames.length} tablo bulundu:`, tableNames);
    
    let sqlDump = `-- Tolga Demir Database Backup
-- Tarih: ${new Date().toLocaleString('tr-TR')}
-- Database: ${dbConfig.database}

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

`;

    // Her tablo için CREATE TABLE ve INSERT INTO oluştur
    for (const tableName of tableNames) {
      console.log(`   📦 Export: ${tableName}...`);
      
      // CREATE TABLE
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `\n-- Tablo: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += createTable[0]['Create Table'] + ';\n\n';
      
      // INSERT INTO (verileri al)
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const columnNames = columns.map(c => `\`${c}\``).join(', ');
        
        sqlDump += `-- Veriler: ${tableName} (${rows.length} kayıt)\n`;
        sqlDump += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;
        
        const values = rows.map(row => {
          const vals = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          return `(${vals.join(', ')})`;
        });
        
        sqlDump += values.join(',\n') + ';\n\n';
      }
    }
    
    sqlDump += `\nCOMMIT;\n`;
    sqlDump += `/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n`;
    sqlDump += `/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n`;
    sqlDump += `/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n`;
    
    // SQL dosyasını yaz
    fs.writeFileSync(backupPath, sqlDump, 'utf8');
    console.log(`✅ SQL dump oluşturuldu: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
    
    // Cloudinary'ye yükle (raw file olarak)
    console.log('☁️  Cloudinary\'ye yükleniyor...');
    const uploadResult = await cloudinary.uploader.upload(backupPath, {
      folder: 'tolgademir/backups',
      resource_type: 'raw',
      public_id: `backup-${timestamp}`,
      access_mode: 'authenticated' // Sadece API key ile erişilebilir
    });
    
    console.log(`✅ Cloudinary'ye yüklendi: ${uploadResult.secure_url}`);
    
    // Temp dosyayı sil
    fs.unlinkSync(backupPath);
    
    // Bağlantıyı kapat
    await connection.end();
    
    console.log(`🎉 Backup tamamlandı: ${backupFileName}`);
    console.log(`📊 Boyut: ${(uploadResult.bytes / 1024).toFixed(2)} KB`);
    console.log(`🔗 URL: ${uploadResult.secure_url}`);
    
    return {
      success: true,
      fileName: backupFileName,
      size: uploadResult.bytes,
      url: uploadResult.secure_url
    };
    
  } catch (error) {
    console.error('❌ Backup hatası:', error);
    throw error;
  }
}

// Script'i çalıştır
if (require.main === module) {
  createBackup()
    .then(() => {
      console.log('✅ Backup işlemi başarıyla tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Backup başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = { createBackup };

