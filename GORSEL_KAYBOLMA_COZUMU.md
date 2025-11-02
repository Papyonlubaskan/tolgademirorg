# 🖼️ GÖRSEL KAYBOLMA SORUNU - KALICI ÇÖZÜM

## ❌ SORUN:
Yüklenen kitap görselleri bir süre sonra kaybolup 404 veriyor.

### Neden Oluyor?
```
❌ Railway Ephemeral Storage (Geçici Depolama)
   ↓
   Her deployment'ta /app/public/uploads siliniyor
   ↓
   Yüklenen görseller kayboluyor
   ↓
   Kitap kapakları 404 veriyor
```

---

## ✅ ÇÖZÜM: RAILWAY VOLUME (KALICI STORAGE)

### Railway Volume Nedir?
```
✅ Kalıcı disk alanı
✅ Deployment'larda korunur
✅ Server restart'ta silinmez
✅ Otomatik backup
✅ Sınırsız dosya depolama (volume boyutuna göre)
```

---

## 🚀 KURULUM ADIMLARI (ADIM ADIM)

### 1️⃣ Railway Dashboard'da Volume Oluştur

**Adım 1: Railway'e Git**
```
1. https://railway.app/dashboard → Giriş yap
2. "tolgademir" projesini seç
3. Service'i seç (Next.js app)
```

**Adım 2: Volume Oluştur**
```
1. Üst menüden "Settings" sekmesine tıkla
2. Sol sidebar'dan "Volumes" sekmesini bul
3. "New Volume" veya "+ Add Volume" butonuna tıkla
```

**Adım 3: Volume Ayarları**
```
Volume Name: uploads
Mount Path: /app/public/uploads
Size: 1 GB (başlangıç için yeterli)

"Create Volume" veya "Add" butonuna tıkla
```

**Adım 4: Redeploy**
```
1. Deployments sekmesine git
2. Son deployment'ı bul
3. "Redeploy" butonuna tıkla
4. 2-3 dakika bekle
```

---

### 2️⃣ Migration Script Çalıştır (İsteğe Bağlı)

**Eğer mevcut görselleri taşımak istersen:**

Railway Console'u aç:
```
1. Railway Dashboard → Service seç
2. Sağ üst köşede "..." (3 nokta) menü
3. "View Logs" veya "Shell" seç
4. Shell'e geç
```

Komutu çalıştır:
```bash
npm run migrate-to-volume
```

**Çıktı:**
```
🚀 Railway Volume Migration Script
================================
✅ Source directory bulundu
📁 Klasör kopyalanıyor: images
📄 Dosya kopyalanıyor: book1.jpg
📄 Dosya kopyalanıying: book2.jpg
✅ Migration tamamlandı!
📊 Toplam kopyalanan dosya sayısı: 15
🎉 Artık dosyalar Railway Volume'da kalıcı olarak saklanıyor!
```

---

### 3️⃣ Test Et

**Test 1: Yeni Görsel Yükle**
```
1. Admin Panel → Kitap Ekle
2. Kapak görseli yükle
3. Kaydet
4. Kitap sayfasına git
5. ✅ Görsel görünüyor mu?
```

**Test 2: Deployment Sonrası Kontrol**
```
1. Railway'de yeni deployment yap
2. Deployment tamamlansın (2-3 dk)
3. Kitap sayfasına git
4. ✅ Görsel HALA görünüyor mu?
```

**Test 3: Railway Shell**
```bash
# Railway Shell'de çalıştır:
ls -la /app/public/uploads/images/

# Dosyaları görmeli:
# -rw-r--r-- 1 root root 245678 Nov 2 12:00 book1.jpg
# -rw-r--r-- 1 root root 187654 Nov 2 12:15 book2.jpg
```

---

## 📋 YAPılandırma Kontrol Listesi

### ✅ Tamamlanmış (Kodda Hazır):
- [x] `railway.json` - Volume tanımı eklendi
- [x] `scripts/migrate-to-volume.js` - Migration script mevcut
- [x] `package.json` - Script tanımı mevcut
- [x] `app/api/upload/route.ts` - Upload API mevcut

### ⏳ Railway Dashboard'da Yapılacak:
- [ ] Volume oluştur (adı: `uploads`)
- [ ] Mount path: `/app/public/uploads`
- [ ] Redeploy yap
- [ ] Migration çalıştır (opsiyonel)

---

## 🎯 RAILWAY VOLUME OLUŞTURMA (DETAYLI)

### Yöntem 1: Dashboard (Önerilen)

**Görsel Rehber:**
```
Railway Dashboard
  └─ Projeni seç: tolgademir
      └─ Service seç (Next.js app)
          └─ Settings
              └─ Volumes
                  └─ + New Volume
                      ├─ Name: uploads
                      ├─ Mount Path: /app/public/uploads
                      └─ Create ✅
```

### Yöntem 2: CLI (Alternatif)

```bash
# Railway CLI kur (eğer yoksa)
npm install -g @railway/cli

# Login
railway login

# Volume oluştur
railway volume create uploads

# Volume mount et
railway volume mount uploads /app/public/uploads
```

---

## 📊 ÖNCE vs SONRA

### ❌ ÖNCESI (Ephemeral Storage):
```
Deployment 1:
  └─ Görsel yükle: book1.jpg ✅
  └─ Görsel görünüyor ✅

Deployment 2:
  └─ Dosya sistemi sıfırlandı ❌
  └─ book1.jpg kayboldu ❌
  └─ 404 Not Found ❌
```

### ✅ SONRASI (Railway Volume):
```
Deployment 1:
  └─ Görsel yükle: book1.jpg ✅
  └─ Volume'a kaydedildi ✅

Deployment 2:
  └─ Volume korundu ✅
  └─ book1.jpg hala mevcut ✅
  └─ Görsel görünüyor ✅

Deployment 100:
  └─ Tüm görseller hala mevcut ✅
```

---

## 🔧 SORUN GİDERME

### Volume Mount Edilmedi?

**Kontrol:**
```bash
# Railway Shell'de
ls -la /app/public/

# "uploads" klasörü görünmeli
# Eğer yoksa volume mount edilmemiş
```

**Çözüm:**
```
1. Railway Dashboard → Settings → Volumes
2. Volume var mı kontrol et
3. Mount path doğru mu: /app/public/uploads
4. Redeploy yap
```

### Görseller Hala Kayboluyor?

**Kontrol 1: Upload Endpoint**
```typescript
// app/api/upload/route.ts
// Dosya kayıt yolu kontrol et:

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
// ✅ Bu doğru
```

**Kontrol 2: Database URL**
```sql
SELECT cover_image FROM books;

-- Görmeli:
-- /uploads/images/book-123456.jpg ✅

-- Görmemeli:
-- /tmp/uploads/book-123456.jpg ❌
-- C:\Users\...\uploads\book.jpg ❌
```

### Permission Hatası?

```bash
# Railway Shell'de
chmod -R 755 /app/public/uploads
chown -R node:node /app/public/uploads
```

---

## 📝 RAILWAY VOLUME OLUŞTURMA DETAYLI ADIMLAR

### Adım 1: Railway Dashboard
```
https://railway.app/dashboard
```

### Adım 2: Proje Seç
```
Projects → tolgademir (veya proje adın)
```

### Adım 3: Service Seç
```
Service → Web (Next.js app)
```

### Adım 4: Settings
```
Üst menü → Settings tıkla
```

### Adım 5: Volumes
```
Sol sidebar → Volumes (veya scroll down)
```

### Adım 6: New Volume
```
+ New Volume butonuna tıkla

Formda doldur:
  Name: uploads
  Mount Path: /app/public/uploads
  
Create butonuna tıkla
```

### Adım 7: Doğrulama
```
Volumes listesinde görünmeli:

Name: uploads
Mount Path: /app/public/uploads  
Status: Active ✅
```

### Adım 8: Redeploy
```
Deployments sekmesi → Latest → Redeploy

Bekleme süresi: 2-3 dakika
```

---

## ✅ BAŞARILI KURULUM BELİRTİLERİ

### Railway Dashboard:
```
✅ Volumes sekmesinde "uploads" görünüyor
✅ Status: Active
✅ Mount Path: /app/public/uploads
✅ Son deployment başarılı
```

### Logs Kontrolü:
```bash
# Railway Logs'da görmelisin:
✅ Volume mounted: /app/public/uploads
✅ Directory exists: /app/public/uploads/images
```

### Test:
```
1. Admin panelden yeni görsel yükle
2. Görsel görünüyor ✅
3. Railway'de redeploy yap
4. Görsel HALA görünüyor ✅
```

---

## 💾 VOLUME BOYUTLARI

### Önerilen Boyutlar:
```
Küçük site: 1 GB (50-100 kitap)
Orta site: 5 GB (500-1000 kitap)
Büyük site: 10+ GB (1000+ kitap)
```

### Boyut Kontrolü:
```bash
# Railway Shell
du -sh /app/public/uploads

# Çıktı örneği:
# 234M    /app/public/uploads
```

---

## 🎉 SONUÇ

**Yapılacaklar:**
1. ✅ railway.json güncellendi (Volume tanımı eklendi)
2. ✅ Migration script hazır
3. ⏳ **SEN YAPACAKSIN:** Railway Dashboard'da volume oluştur
4. ⏳ **SEN YAPACAKSIN:** Redeploy yap
5. ⏳ **SEN YAPACAKSIN:** Test et

**Commit:** Kodlarda her şey hazır!

**Railway Volume oluşturduktan sonra:**
- ✅ Görseller KALICI olacak
- ✅ Deployment'ta kaybolmayacak
- ✅ Server restart'ta silinmeyecek

---

## 🆘 YARDIM

**Volume oluştururken sorun yaşarsan:**
- Railway Docs: https://docs.railway.app/guides/volumes
- Support: Railway Discord sunucusu

**Volume maliyet:**
- İlk 5 GB ücretsiz (Hobby plan)
- Sonrası $0.25/GB/month

---

**Son Güncelleme:** 2 Kasım 2025  
**Durum:** ✅ Kod hazır, Railway'de volume oluştur!

