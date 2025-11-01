-- Saka ve Sanrı kitabını kontrol et ve ekle

-- 1. Mevcut kitapları listele
SELECT id, title, slug, status FROM books ORDER BY id;

-- 2. Saka ve Sanrı kitabını ara
SELECT id, title, slug, status FROM books 
WHERE title LIKE '%saka%' OR title LIKE '%sanrı%' OR slug LIKE '%saka%';

-- 3. Eğer kitap yoksa ekle
INSERT INTO books (title, slug, description, author, status, created_at, updated_at) 
VALUES (
    'Saka ve Sanrı', 
    'saka-ve-sanri', 
    'Bige Saka, evlendiği gün sevdiği adamın bir dolandırıcı olduğunu öğrendiğinde işler onun için...', 
    'Tolga Demir', 
    'published', 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    slug = VALUES(slug),
    description = VALUES(description);

-- 4. Kitabın eklendiğini kontrol et
SELECT id, title, slug, status FROM books WHERE slug = 'saka-ve-sanri';

-- 5. Eğer kitap varsa bölümlerini de ekle
INSERT INTO chapters (book_id, title, slug, content, status, order_number, created_at, updated_at)
SELECT 
    b.id,
    'Bölüm 1: Kiminle Evlendim Ben?',
    '1-bolum-kiminle-evlendim-ben',
    'Bige Saka, evlendiği gün sevdiği adamın bir dolandırıcı olduğunu öğrendiğinde işler onun için...',
    'published',
    1,
    NOW(),
    NOW()
FROM books b 
WHERE b.slug = 'saka-ve-sanri'
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content);
