-- Comments tablosuna parent_id kolonu ekle (yanıt sistemi için)
ALTER TABLE comments
ADD COLUMN parent_id INT DEFAULT NULL;

-- Foreign key constraint ekle
ALTER TABLE comments
ADD CONSTRAINT fk_comments_parent
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Index ekle
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
