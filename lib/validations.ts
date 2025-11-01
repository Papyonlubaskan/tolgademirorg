export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Helper functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  if (password && password.length > 100) {
    errors.push('Şifre çok uzun');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }
  if (password && !/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return /^(97[89])?\d{9}[\dX]$/.test(cleanISBN);
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

export class Validator {
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('E-posta adresi gereklidir');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Geçerli bir e-posta adresi giriniz');
      }
      if (email.length > 254) {
        errors.push('E-posta adresi çok uzun');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateName(name: string, fieldName: string = 'İsim'): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push(`${fieldName} gereklidir`);
    } else {
      if (name.trim().length < 2) {
        errors.push(`${fieldName} en az 2 karakter olmalıdır`);
      }
      if (name.length > 100) {
        errors.push(`${fieldName} çok uzun`);
      }
      if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name)) {
        errors.push(`${fieldName} sadece harf içermelidir`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateMessage(message: string): ValidationResult {
    const errors: string[] = [];
    
    if (!message || message.trim().length === 0) {
      errors.push('Mesaj gereklidir');
    } else {
      if (message.trim().length < 5) {
        errors.push('Mesaj en az 5 karakter olmalıdır');
      }
      if (message.length > 2000) {
        errors.push('Mesaj çok uzun (maksimum 2000 karakter)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateBookData(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Sadece başlık zorunlu
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Kitap başlığı gereklidir');
    } else if (data.title.length > 200) {
      errors.push('Kitap başlığı çok uzun');
    }
    
    // Diğer alanlar opsiyonel - sadece uzunluk kontrolü
    if (data.description && data.description.length > 2000) {
      errors.push('Kitap açıklaması çok uzun');
    }
    
    if (data.author && data.author.length > 200) {
      errors.push('Yazar adı çok uzun');
    }
    
    if (data.category && data.category.length > 50) {
      errors.push('Kategori adı çok uzun');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (!url) {
      errors.push('URL gereklidir');
    } else {
      try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          errors.push('Geçerli bir URL giriniz (http veya https)');
        }
      } catch {
        errors.push('Geçerli bir URL giriniz');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}