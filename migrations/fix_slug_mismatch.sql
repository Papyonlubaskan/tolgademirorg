-- Slug uyumsuzluğunu düzelt

-- 1. Mevcut kitapları ve slug'larını listele
SELECT id, title, slug FROM books ORDER BY id;

-- 2. SARKAÇ kitabını bul ve slug'ını kontrol et
SELECT id, title, slug FROM books WHERE title LIKE '%SARKAÇ%' OR title LIKE '%Sarkac%';

-- 3. Eğer sarkac slug'ı yoksa ekle
UPDATE books SET slug = 'sarkac' WHERE title LIKE '%SARKAÇ%' OR title LIKE '%Sarkac%';

-- 4. Saka ve Sanrı kitabının slug'ını da kontrol et
SELECT id, title, slug FROM books WHERE title LIKE '%Saka%' OR title LIKE '%Sanrı%';

-- 5. Her iki kitabın da doğru slug'ları olduğundan emin ol
UPDATE books SET slug = 'sarkac' WHERE title = 'SARKAÇ';
UPDATE books SET slug = 'saka-ve-sanri' WHERE title = 'Saka ve Sanrı';

-- 6. Son kontrol
SELECT id, title, slug FROM books WHERE slug IN ('sarkac', 'saka-ve-sanri');
