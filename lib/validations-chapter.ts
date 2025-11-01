import { ValidationResult, sanitizeInput } from './validations';

// Chapter validation
export function validateChapter(chapterData: any): ValidationResult {
  const errors: string[] = [];
  
  // Title validation
  if (!chapterData.title || typeof chapterData.title !== 'string') {
    errors.push('Bölüm başlığı gerekli');
  } else if (chapterData.title.length < 3) {
    errors.push('Bölüm başlığı en az 3 karakter olmalı');
  } else if (chapterData.title.length > 255) {
    errors.push('Bölüm başlığı en fazla 255 karakter olabilir');
  }
  
  // Content validation
  if (!chapterData.content || typeof chapterData.content !== 'string') {
    errors.push('Bölüm içeriği gerekli');
  } else if (chapterData.content.length < 50) {
    errors.push('Bölüm içeriği en az 50 karakter olmalı');
  } else if (chapterData.content.length > 50000) {
    errors.push('Bölüm içeriği en fazla 50000 karakter olabilir');
  }
  
  // Order validation
  if (chapterData.order !== undefined && chapterData.order !== null) {
    const order = parseInt(chapterData.order);
    if (isNaN(order) || order < 1 || order > 1000) {
      errors.push('Sıra numarası 1-1000 arasında olmalı');
    }
  }
  
  // Excerpt validation
  if (chapterData.excerpt && typeof chapterData.excerpt === 'string') {
    if (chapterData.excerpt.length > 500) {
      errors.push('Özet en fazla 500 karakter olabilir');
    }
  }
  
  // Word count validation
  if (chapterData.word_count !== undefined && chapterData.word_count !== null) {
    const wordCount = parseInt(chapterData.word_count);
    if (isNaN(wordCount) || wordCount < 0 || wordCount > 100000) {
      errors.push('Kelime sayısı 0-100000 arasında olmalı');
    }
  }
  
  // Reading time validation
  if (chapterData.reading_time !== undefined && chapterData.reading_time !== null) {
    const readingTime = parseInt(chapterData.reading_time);
    if (isNaN(readingTime) || readingTime < 0 || readingTime > 1000) {
      errors.push('Okuma süresi 0-1000 dakika arasında olmalı');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizeInput(chapterData)
  };
}

