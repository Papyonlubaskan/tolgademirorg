-- Books tablosundaki kitapları kontrol et
SELECT id, title, slug, status FROM books ORDER BY id;

-- Saka ve Sanrı kitabını ara
SELECT id, title, slug, status FROM books WHERE title LIKE '%saka%' OR title LIKE '%sanrı%' OR slug LIKE '%saka%';

-- Slug'ları kontrol et
SELECT id, title, slug FROM books WHERE slug IS NOT NULL AND slug != '';
