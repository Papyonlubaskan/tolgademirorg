import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  generateUniqueName?: boolean;
}

interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
}

class FileUploadSecurity {
  private config: FileUploadConfig;

  constructor(config: FileUploadConfig) {
    this.config = config;
  }

  // File type validation by magic bytes
  private async validateFileType(filePath: string, expectedMimeType: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const magicBytes = buffer.slice(0, 16);

      const magicSignatures: { [key: string]: Buffer[] } = {
        'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
        'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
        'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
        'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
        'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
        'text/plain': [Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from([0xFF, 0xFE]), Buffer.from([0xFE, 0xFF])],
      };

      const signatures = magicSignatures[expectedMimeType];
      if (!signatures) return false;

      return signatures.some(signature => 
        magicBytes.slice(0, signature.length).equals(signature)
      );
    } catch (error) {
      console.error('File type validation error:', error);
      return false;
    }
  }

  // Sanitize filename
  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const basename = path.basename(filename);
    
    // Remove special characters and keep only alphanumeric, dots, hyphens, underscores
    const sanitized = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Ensure filename is not empty and has reasonable length
    if (!sanitized || sanitized.length > 100) {
      return `file_${Date.now()}`;
    }
    
    return sanitized;
  }

  // Generate unique filename
  private generateUniqueFilename(originalName: string): string {
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    const sanitizedBasename = this.sanitizeFilename(basename);
    const hash = crypto.createHash('md5').update(originalName + Date.now()).digest('hex').slice(0, 8);
    
    return `${sanitizedBasename}_${hash}${extension}`;
  }

  // Validate file size
  private validateFileSize(size: number): boolean {
    return size <= this.config.maxSize;
  }

  // Validate file extension
  private validateFileExtension(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return this.config.allowedExtensions.includes(extension);
  }

  // Validate MIME type
  private validateMimeType(mimeType: string): boolean {
    return this.config.allowedTypes.includes(mimeType);
  }

  // Scan file for malicious content
  private async scanFileForMaliciousContent(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 1024)); // First 1MB

      // Check for script tags, eval functions, and other potentially malicious content
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.cookie/i,
        /window\.location/i,
        /document\.write/i,
      ];

      return !maliciousPatterns.some(pattern => pattern.test(content));
    } catch (error) {
      console.error('File content scan error:', error);
      return false;
    }
  }

  // Main upload validation and processing
  async processFile(
    file: File,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
    try {
      // Validate file size
      if (!this.validateFileSize(size)) {
        return {
          success: false,
          error: `Dosya boyutu çok büyük. Maksimum ${Math.round(this.config.maxSize / 1024 / 1024)}MB olabilir.`
        };
      }

      // Validate MIME type
      if (!this.validateMimeType(mimeType)) {
        return {
          success: false,
          error: 'Desteklenmeyen dosya türü.'
        };
      }

      // Validate file extension
      if (!this.validateFileExtension(originalName)) {
        return {
          success: false,
          error: 'Desteklenmeyen dosya uzantısı.'
        };
      }

      // Generate filename
      const filename = this.config.generateUniqueName 
        ? this.generateUniqueFilename(originalName)
        : this.sanitizeFilename(originalName);

      // Create upload directory if it doesn't exist
      await fs.mkdir(this.config.uploadPath, { recursive: true });

      // Write file to disk
      const filePath = path.join(this.config.uploadPath, filename);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      // Validate file type by magic bytes
      const isValidType = await this.validateFileType(filePath, mimeType);
      if (!isValidType) {
        await fs.unlink(filePath); // Remove invalid file
        return {
          success: false,
          error: 'Dosya içeriği belirtilen türle uyuşmuyor.'
        };
      }

      // Scan for malicious content
      const isSafe = await this.scanFileForMaliciousContent(filePath);
      if (!isSafe) {
        await fs.unlink(filePath); // Remove malicious file
        return {
          success: false,
          error: 'Dosya güvenlik taramasından geçemedi.'
        };
      }

      const uploadedFile: UploadedFile = {
        originalName,
        filename,
        path: filePath,
        size,
        mimeType,
        extension: path.extname(filename)
      };

      return { success: true, file: uploadedFile };

    } catch (error) {
      console.error('File upload processing error:', error);
      return {
        success: false,
        error: 'Dosya yükleme sırasında bir hata oluştu.'
      };
    }
  }

  // Delete uploaded file
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  // Get file info
  async getFileInfo(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }
}

// Predefined configurations
export const imageUploadConfig: FileUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  uploadPath: path.join(process.cwd(), 'public', 'uploads', 'images'),
  generateUniqueName: true
};

export const documentUploadConfig: FileUploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.pdf', '.txt', '.doc', '.docx'],
  uploadPath: path.join(process.cwd(), 'public', 'uploads', 'documents'),
  generateUniqueName: true
};

export const createFileUploadSecurity = (config: FileUploadConfig) => new FileUploadSecurity(config);