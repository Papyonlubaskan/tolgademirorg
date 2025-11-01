// JSON File Synchronization System
// Admin paneli işlemlerinden sonra JSON dosyalarını günceller
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CONTENT_DIR = path.join(DATA_DIR, 'content');

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CONTENT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

// Books JSON synchronization
export const syncBooksJSON = async (books: any[]) => {
  try {
    await ensureDirectories();
    
    const booksData = {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        slug: book.slug,
        description: book.description,
        cover_image: book.cover_image,
        author: book.author,
        publish_date: book.publish_date,
        status: book.status,
        created_at: book.created_at,
        updated_at: book.updated_at
      })),
      last_updated: new Date().toISOString()
    };

    const filePath = path.join(DATA_DIR, 'books.json');
    await fs.writeFile(filePath, JSON.stringify(booksData, null, 2));
    
    console.log('✅ Books JSON synchronized');
    return { success: true };
  } catch (error) {
    console.error('❌ Books JSON sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Chapter content JSON synchronization
export const syncChapterJSON = async (bookSlug: string, chapters: any[]) => {
  try {
    await ensureDirectories();
    
    const chapterData = {
      book_slug: bookSlug,
      chapters: chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        slug: chapter.slug,
        content: chapter.content,
        order_index: chapter.order_index,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at
      })),
      last_updated: new Date().toISOString()
    };

    const filePath = path.join(CONTENT_DIR, `${bookSlug}.json`);
    await fs.writeFile(filePath, JSON.stringify(chapterData, null, 2));
    
    console.log(`✅ Chapter JSON synchronized for ${bookSlug}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Chapter JSON sync failed for ${bookSlug}:`, error);
    return { success: false, error: error.message };
  }
};

// Settings JSON synchronization
export const syncSettingsJSON = async (settings: any) => {
  try {
    await ensureDirectories();
    
    const settingsData = {
      ...settings,
      last_updated: new Date().toISOString()
    };

    const filePath = path.join(DATA_DIR, 'settings.json');
    await fs.writeFile(filePath, JSON.stringify(settingsData, null, 2));
    
    console.log('✅ Settings JSON synchronized');
    return { success: true };
  } catch (error) {
    console.error('❌ Settings JSON sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Complete sync - updates all JSON files
export const syncAllJSON = async () => {
  try {
    // Sync books - Disabled (MySQL only)
    return { success: true, message: 'JSON sync disabled - using MySQL directly' };
    
    /* Disabled code - JSON sync not needed for MySQL-only setup */
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return { success: false, error: error.message };
  }
};

// Read JSON files (for frontend)
export const readBooksJSON = async () => {
  try {
    const filePath = path.join(DATA_DIR, 'books.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error('❌ Read books JSON failed:', error);
    return { success: false, error: error.message };
  }
};

export const readChapterJSON = async (bookSlug: string) => {
  try {
    const filePath = path.join(CONTENT_DIR, `${bookSlug}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error(`❌ Read chapter JSON failed for ${bookSlug}:`, error);
    return { success: false, error: error.message };
  }
};

export const readSettingsJSON = async () => {
  try {
    const filePath = path.join(DATA_DIR, 'settings.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error('❌ Read settings JSON failed:', error);
    return { success: false, error: error.message };
  }
};

// Delete JSON files (when content is deleted)
export const deleteChapterJSON = async (bookSlug: string) => {
  try {
    const filePath = path.join(CONTENT_DIR, `${bookSlug}.json`);
    await fs.unlink(filePath);
    console.log(`✅ Chapter JSON deleted for ${bookSlug}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Delete chapter JSON failed for ${bookSlug}:`, error);
    return { success: false, error: error.message };
  }
};

export default {
  syncBooksJSON,
  syncChapterJSON,
  syncSettingsJSON,
  syncAllJSON,
  readBooksJSON,
  readChapterJSON,
  readSettingsJSON,
  deleteChapterJSON
};
