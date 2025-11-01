-- Sarka kitabını kontrol et ve düzelt

-- 1. Mevcut kitapları listele
SELECT id, title, slug, status FROM books ORDER BY id;

-- 2. Sarka kitabını ara
SELECT id, title, slug, status FROM books 
WHERE title LIKE '%sarka%' OR title LIKE '%SARKA%' OR slug LIKE '%sarka%';

-- 3. Eğer kitap yoksa veya slug yanlışsa düzelt
UPDATE books 
SET slug = 'sarka' 
WHERE title = 'SARKAÇ' OR title LIKE '%SARKA%';

-- 4. Son kontrol
SELECT id, title, slug, status FROM books 
WHERE title LIKE '%sarka%' OR title LIKE '%SARKA%' OR slug LIKE '%sarka%';
