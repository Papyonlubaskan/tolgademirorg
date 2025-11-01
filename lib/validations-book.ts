import { ValidationResult, sanitizeInput, validateURL, validateISBN } from './validations';

// Book validation
export function validateBook(bookData: any): ValidationResult {
  const errors: string[] = [];
  
  // Title validation
  if (!bookData.title || typeof bookData.title !== 'string') {
    errors.push('Kitap başlığı gerekli');
  } else if (bookData.title.length < 3) {
    errors.push('Kitap başlığı en az 3 karakter olmalı');
  } else if (bookData.title.length > 255) {
    errors.push('Kitap başlığı en fazla 255 karakter olabilir');
  }
  
  // Description validation
  if (!bookData.description || typeof bookData.description !== 'string') {
    errors.push('Kitap açıklaması gerekli');
  } else if (bookData.description.length < 10) {
    errors.push('Kitap açıklaması en az 10 karakter olmalı');
  } else if (bookData.description.length > 2000) {
    errors.push('Kitap açıklaması en fazla 2000 karakter olabilir');
  }
  
  // Author validation
  if (bookData.author && typeof bookData.author === 'string') {
    if (bookData.author.length > 100) {
      errors.push('Yazar adı en fazla 100 karakter olabilir');
    }
  }
  
  // Status validation
  if (bookData.status && !['draft', 'published', 'archived'].includes(bookData.status)) {
    errors.push('Geçersiz durum değeri');
  }
  
  // Category validation
  if (bookData.category && typeof bookData.category === 'string') {
    const validCategories = ['roman', 'hikaye', 'deneme', 'siir', 'biyografi', 'otobiyografi'];
    if (!validCategories.includes(bookData.category)) {
      errors.push('Geçersiz kategori değeri');
    }
  }
  
  // ISBN validation
  if (bookData.isbn && typeof bookData.isbn === 'string') {
    if (!validateISBN(bookData.isbn)) {
      errors.push('Geçersiz ISBN formatı');
    }
  }
  
  // Page count validation
  if (bookData.page_count !== undefined && bookData.page_count !== null) {
    const pageCount = parseInt(bookData.page_count);
    if (isNaN(pageCount) || pageCount < 1 || pageCount > 10000) {
      errors.push('Sayfa sayısı 1-10000 arasında olmalı');
    }
  }
  
  // URL validations
  if (bookData.amazon_link && !validateURL(bookData.amazon_link)) {
    errors.push('Geçersiz Amazon linki');
  }
  
  if (bookData.dr_link && !validateURL(bookData.dr_link)) {
    errors.push('Geçersiz D&R linki');
  }
  
  if (bookData.idefix_link && !validateURL(bookData.idefix_link)) {
    errors.push('Geçersiz İdefix linki');
  }
  
  if (bookData.cover_image_url && !validateURL(bookData.cover_image_url)) {
    errors.push('Geçersiz kapak resmi URL');
  }
  
  // Tags validation
  if (bookData.tags && Array.isArray(bookData.tags)) {
    if (bookData.tags.length > 10) {
      errors.push('En fazla 10 etiket eklenebilir');
    }
    
    for (let i = 0; i < bookData.tags.length; i++) {
      const tag = bookData.tags[i];
      if (typeof tag !== 'string' || tag.length > 50) {
        errors.push('Etiket en fazla 50 karakter olabilir');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizeInput(bookData)
  };
}

