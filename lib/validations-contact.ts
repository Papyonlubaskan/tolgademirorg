import { ValidationResult, sanitizeInput, validateEmail } from './validations';

// Contact message validation
export function validateContactMessage(messageData: any): ValidationResult {
  const errors: string[] = [];
  
  // Name validation
  if (!messageData.name || typeof messageData.name !== 'string') {
    errors.push('Ad gerekli');
  } else if (messageData.name.length < 2) {
    errors.push('Ad en az 2 karakter olmalı');
  } else if (messageData.name.length > 100) {
    errors.push('Ad en fazla 100 karakter olabilir');
  }
  
  // Email validation
  if (!messageData.email || typeof messageData.email !== 'string') {
    errors.push('E-posta gerekli');
  } else if (!validateEmail(messageData.email)) {
    errors.push('Geçerli bir e-posta adresi girin');
  } else if (messageData.email.length > 255) {
    errors.push('E-posta en fazla 255 karakter olabilir');
  }
  
  // Subject validation
  if (messageData.subject && typeof messageData.subject === 'string') {
    if (messageData.subject.length > 255) {
      errors.push('Konu en fazla 255 karakter olabilir');
    }
  }
  
  // Message validation
  if (!messageData.message || typeof messageData.message !== 'string') {
    errors.push('Mesaj gerekli');
  } else if (messageData.message.length < 10) {
    errors.push('Mesaj en az 10 karakter olmalı');
  } else if (messageData.message.length > 2000) {
    errors.push('Mesaj en fazla 2000 karakter olabilir');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizeInput(messageData)
  };
}

// Newsletter subscription validation
export function validateNewsletterSubscription(subscriptionData: any): ValidationResult {
  const errors: string[] = [];
  
  // Email validation
  if (!subscriptionData.email || typeof subscriptionData.email !== 'string') {
    errors.push('E-posta gerekli');
  } else if (!validateEmail(subscriptionData.email)) {
    errors.push('Geçerli bir e-posta adresi girin');
  } else if (subscriptionData.email.length > 255) {
    errors.push('E-posta en fazla 255 karakter olabilir');
  }
  
  // Preferences validation
  if (subscriptionData.preferences && Array.isArray(subscriptionData.preferences)) {
    if (subscriptionData.preferences.length > 10) {
      errors.push('En fazla 10 tercih seçilebilir');
    }
    
    const validPreferences = ['books', 'chapters', 'news', 'events', 'promotions'];
    for (let i = 0; i < subscriptionData.preferences.length; i++) {
      const preference = subscriptionData.preferences[i];
      if (!validPreferences.includes(preference)) {
        errors.push('Geçersiz tercih değeri');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizeInput(subscriptionData)
  };
}

