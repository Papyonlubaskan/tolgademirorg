-- Sadece SARKAÇ kitabının slug'ını düzelt (basit yöntem)

-- 1. Mevcut kitapları listele
SELECT id, title, slug FROM books ORDER BY id;

-- 2. SARKAÇ kitabının ID'sini bul
SELECT id, title, slug FROM books WHERE title = 'SARKAÇ';

-- 3. SARKAÇ kitabının slug'ını düzelt (ID ile)
UPDATE books SET slug = 'sarkac' WHERE id = 1;

-- 4. Son kontrol
SELECT id, title, slug FROM books WHERE title = 'SARKAÇ';
