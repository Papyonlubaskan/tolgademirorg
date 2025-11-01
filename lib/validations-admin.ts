import { ValidationResult, validateEmail, validatePassword, sanitizeInput } from './validations';

// Admin user validation
export function validateAdminUser(userData: any): ValidationResult {
  const errors: string[] = [];
  
  // Name validation
  if (!userData.name || typeof userData.name !== 'string') {
    errors.push('Ad gerekli');
  } else if (userData.name.length < 2) {
    errors.push('Ad en az 2 karakter olmalı');
  } else if (userData.name.length > 100) {
    errors.push('Ad en fazla 100 karakter olabilir');
  }
  
  // Email validation
  if (!userData.email || typeof userData.email !== 'string') {
    errors.push('E-posta gerekli');
  } else if (!validateEmail(userData.email)) {
    errors.push('Geçerli bir e-posta adresi girin');
  } else if (userData.email.length > 255) {
    errors.push('E-posta en fazla 255 karakter olabilir');
  }
  
  // Password validation
  if (userData.password) {
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }
  
  // Role validation
  if (userData.role && !['admin', 'editor', 'viewer'].includes(userData.role)) {
    errors.push('Geçersiz rol değeri');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitizeInput(userData)
  };
}
