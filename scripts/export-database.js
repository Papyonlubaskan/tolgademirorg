/**
 * MySQL Database Export Script
 * Manuel export için kullanılabilir
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tolgademir'
};

async function exportDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(process.cwd(), 'exports');
  const outputFile = path.join(outputDir, `tolgademir-export-${timestamp}.sql`);
  
  // Export klasörünü oluştur
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`🔄 Export başlıyor: ${outputFile}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL bağlantısı kuruldu');
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📋 ${tableNames.length} tablo bulundu:`, tableNames);
    
    let sqlDump = `-- Tolga Demir Database Export
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

    for (const tableName of tableNames) {
      console.log(`   📦 Export: ${tableName}...`);
      
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `\n-- Tablo: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += createTable[0]['Create Table'] + ';\n\n';
      
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
    
    fs.writeFileSync(outputFile, sqlDump, 'utf8');
    console.log(`✅ Export tamamlandı: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
    console.log(`📁 Dosya: ${outputFile}`);
    
    await connection.end();
    console.log('✅ Bağlantı kapatıldı');
    
  } catch (error) {
    console.error('❌ Export hatası:', error.message);
    process.exit(1);
  }
}

exportDatabase();

