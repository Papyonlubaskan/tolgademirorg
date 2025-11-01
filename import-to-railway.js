const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importToRailway() {
  const connection = await mysql.createConnection({
    host: 'caboose.proxy.rlwy.net',
    port: 34103,
    user: 'root',
    password: 'mgOmJFOQKbwbnmnybMHWEpxDcQrwdshG',
    database: 'railway',
    multipleStatements: true
  });

  console.log('✅ Railway MySQL bağlantısı kuruldu');

  const sqlFile = fs.readFileSync(path.join(__dirname, 'duzenle.sql'), 'utf8');
  console.log('📄 SQL dosyası okundu');

  await connection.query(sqlFile);
  console.log('✅ Import tamamlandı!');

  await connection.end();
}

importToRailway().catch(console.error);

