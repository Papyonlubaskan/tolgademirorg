#!/usr/bin/env node

/**
 * Railway Volume'a dosya taşıma script'i
 * Bu script mevcut uploads klasöründeki dosyaları Railway Volume'a taşır
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../public/uploads');
const TARGET_DIR = '/app/public/uploads'; // Railway Volume mount path

console.log('🚀 Railway Volume Migration Script');
console.log('================================');

// Source directory kontrolü
if (!fs.existsSync(SOURCE_DIR)) {
  console.log('❌ Source directory bulunamadı:', SOURCE_DIR);
  process.exit(1);
}

console.log('✅ Source directory bulundu:', SOURCE_DIR);

// Target directory oluştur (eğer yoksa)
if (!fs.existsSync(TARGET_DIR)) {
  console.log('📁 Target directory oluşturuluyor:', TARGET_DIR);
  fs.mkdirSync(TARGET_DIR, { recursive: true });
} else {
  console.log('✅ Target directory mevcut:', TARGET_DIR);
}

// Recursive dosya kopyalama fonksiyonu
function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    console.log('⚠️ Source directory bulunamadı:', source);
    return;
  }

  // Target directory oluştur
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  let copiedFiles = 0;

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      console.log(`📁 Klasör kopyalanıyor: ${item}`);
      copyDirectory(sourcePath, targetPath);
    } else {
      console.log(`📄 Dosya kopyalanıyor: ${item}`);
      fs.copyFileSync(sourcePath, targetPath);
      copiedFiles++;
    }
  }

  return copiedFiles;
}

try {
  console.log('🔄 Dosyalar Railway Volume\'a kopyalanıyor...');
  const copiedFiles = copyDirectory(SOURCE_DIR, TARGET_DIR);
  
  console.log('✅ Migration tamamlandı!');
  console.log(`📊 Toplam kopyalanan dosya sayısı: ${copiedFiles}`);
  console.log('🎉 Artık dosyalar Railway Volume\'da kalıcı olarak saklanıyor!');
  
} catch (error) {
  console.error('❌ Migration hatası:', error);
  process.exit(1);
}
