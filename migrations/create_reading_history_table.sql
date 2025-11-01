-- Reading History tablosunu oluştur
CREATE TABLE IF NOT EXISTS reading_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    book_id INT NOT NULL,
    chapter_id INT DEFAULT NULL,
    line_number INT DEFAULT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_reading_progress (user_id, book_id, chapter_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Index'ler oluştur
CREATE INDEX IF NOT EXISTS idx_reading_history_user_book_chapter ON reading_history (user_id, book_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read_at ON reading_history (last_read_at);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history (user_id);
