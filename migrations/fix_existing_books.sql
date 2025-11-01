-- Mevcut kitapların slug'larını düzelt

-- 1. Mevcut kitapları listele
SELECT id, title, slug FROM books ORDER BY id;

-- 2. SARKAÇ kitabını bul ve slug'ını düzelt (safe mode uyumlu)
UPDATE books SET slug = 'sarkac' WHERE id = (SELECT id FROM (SELECT id FROM books WHERE title = 'SARKAÇ' LIMIT 1) AS temp);

-- 3. Saka ve Sanrı kitabının slug'ını kontrol et (safe mode uyumlu)
UPDATE books SET slug = 'saka-ve-sanri' WHERE id = (SELECT id FROM (SELECT id FROM books WHERE title = 'Saka ve Sanrı' LIMIT 1) AS temp);

-- 4. Diğer kitapların slug'larını da düzelt
UPDATE books SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(title, ' ', '-'),
              'ğ', 'g'
            ),
            'ü', 'u'
          ),
          'ş', 's'
        ),
        'ı', 'i'
      ),
      'ö', 'o'
    ),
    'ç', 'c'
  )
) WHERE slug IS NULL OR slug = '';

-- 5. Son kontrol
SELECT id, title, slug FROM books ORDER BY id;
