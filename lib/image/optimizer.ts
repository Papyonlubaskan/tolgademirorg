import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  progressive?: boolean;
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  size: number;
  width: number;
  height: number;
}

export class ImageOptimizer {
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_QUALITY = 80;
  private static readonly DEFAULT_WIDTH = 1200;
  private static readonly DEFAULT_HEIGHT = 800;

  // Resim dosyasını optimize et
  static async optimizeImage(
    inputBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    try {
      // Dosya boyutu kontrolü
      if (inputBuffer.length > this.MAX_FILE_SIZE) {
        throw new Error('File size too large');
      }

      // Sharp instance oluştur
      let sharpInstance = sharp(inputBuffer);
      
      // Metadata al
      const metadata = await sharpInstance.metadata();
      
      // Format belirle
      const outputFormat = options.format || 'webp';
      
      // Boyutları belirle
      const width = options.width || this.DEFAULT_WIDTH;
      const height = options.height || this.DEFAULT_HEIGHT;
      
      // Resmi yeniden boyutlandır
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Format'a göre optimize et
      switch (outputFormat) {
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: options.quality || this.DEFAULT_QUALITY
          });
          break;
          
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: options.quality || this.DEFAULT_QUALITY
          });
          break;
          
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: options.quality || this.DEFAULT_QUALITY,
            progressive: options.progressive || true,
            mozjpeg: true
          });
          break;
          
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: options.quality || this.DEFAULT_QUALITY,
            progressive: options.progressive || true
          });
          break;
      }

      // Optimize edilmiş resmi oluştur
      const optimizedBuffer = await sharpInstance.toBuffer();
      
      // Yeni metadata al
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        format: outputFormat,
        size: optimizedBuffer.length,
        width: optimizedMetadata.width || width,
        height: optimizedMetadata.height || height
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Image optimization failed');
    }
  }

  // Çoklu boyut optimizasyonu
  static async generateResponsiveImages(
    inputBuffer: Buffer,
    sizes: Array<{ width: number; height?: number; suffix: string }>
  ): Promise<Array<OptimizedImage & { suffix: string }>> {
    try {
      const results = [];

      for (const size of sizes) {
        const optimized = await this.optimizeImage(inputBuffer, {
          width: size.width,
          height: size.height,
          format: 'webp'
        });

        results.push({
          ...optimized,
          suffix: size.suffix
        });
      }

      return results;
    } catch (error) {
      console.error('Responsive image generation failed:', error);
      throw new Error('Responsive image generation failed');
    }
  }

  // Thumbnail oluştur
  static async generateThumbnail(
    inputBuffer: Buffer,
    size: number = 300
  ): Promise<OptimizedImage> {
    try {
      return await this.optimizeImage(inputBuffer, {
        width: size,
        height: size,
        format: 'webp',
        quality: 70
      });
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error('Thumbnail generation failed');
    }
  }

  // Resim formatını kontrol et
  static isValidImageFormat(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return this.SUPPORTED_FORMATS.includes(ext);
  }

  // Resim boyutunu kontrol et
  static isValidImageSize(buffer: Buffer): boolean {
    return buffer.length <= this.MAX_FILE_SIZE;
  }

  // Resim metadata'sını al
  static async getImageMetadata(inputBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  }> {
    try {
      const metadata = await sharp(inputBuffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: inputBuffer.length,
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      console.error('Image metadata extraction failed:', error);
      throw new Error('Image metadata extraction failed');
    }
  }

  // Resim dosyasını disk'e kaydet
  static async saveOptimizedImage(
    optimizedImage: OptimizedImage,
    filePath: string,
    createDir: boolean = true
  ): Promise<void> {
    try {
      if (createDir) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(filePath, optimizedImage.buffer);
    } catch (error) {
      console.error('Image save failed:', error);
      throw new Error('Image save failed');
    }
  }

  // Resim dosyasını disk'ten yükle ve optimize et
  static async optimizeImageFile(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      const optimized = await this.optimizeImage(inputBuffer, options);
      
      await this.saveOptimizedImage(optimized, outputPath);
      
      return optimized;
    } catch (error) {
      console.error('Image file optimization failed:', error);
      throw new Error('Image file optimization failed');
    }
  }

  // Batch resim optimizasyonu
  static async batchOptimizeImages(
    inputPaths: string[],
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{ input: string; output: string; result: OptimizedImage }>> {
    try {
      const results = [];

      for (const inputPath of inputPaths) {
        const filename = path.basename(inputPath, path.extname(inputPath));
        const outputPath = path.join(outputDir, `${filename}.${options.format || 'webp'}`);
        
        const result = await this.optimizeImageFile(inputPath, outputPath, options);
        
        results.push({
          input: inputPath,
          output: outputPath,
          result
        });
      }

      return results;
    } catch (error) {
      console.error('Batch image optimization failed:', error);
      throw new Error('Batch image optimization failed');
    }
  }

  // Resim boyutunu hesapla (aspect ratio korunarak)
  static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  // Resim kalitesi tahmini
  static estimateQuality(fileSize: number, targetSize: number): number {
    const ratio = targetSize / fileSize;
    
    if (ratio >= 1) return 90;
    if (ratio >= 0.8) return 85;
    if (ratio >= 0.6) return 80;
    if (ratio >= 0.4) return 70;
    if (ratio >= 0.2) return 60;
    
    return 50;
  }
}

export const imageOptimizer = ImageOptimizer;
