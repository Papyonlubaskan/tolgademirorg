import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  background?: string;
  blur?: number;
  sharpen?: boolean;
  progressive?: boolean;
}

interface OptimizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'bmp'];
const OPTIMIZED_DIR = path.join(process.cwd(), 'public', 'optimized');

// Ensure optimized directory exists
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

// Generate cache key for optimized image
function generateCacheKey(
  originalPath: string, 
  options: ImageOptimizationOptions
): string {
  const stats = fs.statSync(originalPath);
  const optionsStr = JSON.stringify(options);
  const hash = require('crypto')
    .createHash('md5')
    .update(originalPath + stats.mtime.getTime() + optionsStr)
    .digest('hex');
  
  return `${hash}.${options.format || 'webp'}`;
}

// Check if optimized image exists and is newer than original
function isOptimizedImageValid(
  originalPath: string, 
  optimizedPath: string
): boolean {
  if (!fs.existsSync(optimizedPath)) return false;
  
  const originalStats = fs.statSync(originalPath);
  const optimizedStats = fs.statSync(optimizedPath);
  
  return optimizedStats.mtime > originalStats.mtime;
}

// Optimize image
export async function optimizeImage(
  inputPath: string,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
    position = 'center',
    background = '#ffffff',
    blur,
    sharpen = true,
    progressive = true
  } = options;

  // Validate input file
  if (!fs.existsSync(inputPath)) {
    throw new Error('Input file does not exist');
  }

  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;

  // Check cache first
  const cacheKey = generateCacheKey(inputPath, options);
  const cachedPath = path.join(OPTIMIZED_DIR, cacheKey);
  
  if (isOptimizedImageValid(inputPath, cachedPath)) {
    const cachedBuffer = fs.readFileSync(cachedPath);
    const cachedStats = fs.statSync(cachedPath);
    
    return {
      buffer: cachedBuffer,
      width: 0, // Will be filled by metadata
      height: 0, // Will be filled by metadata
      format,
      size: cachedStats.size,
      originalSize,
      compressionRatio: (1 - cachedStats.size / originalSize) * 100
    };
  }

  // Load and process image
  let pipeline = sharp(inputPath);

  // Resize if dimensions specified
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      position,
      background
    });
  }

  // Apply blur if specified
  if (blur && blur > 0) {
    pipeline = pipeline.blur(blur);
  }

  // Apply sharpening if enabled
  if (sharpen) {
    pipeline = pipeline.sharpen();
  }

  // Convert to specified format
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality,
        progressive,
        mozjpeg: true
      });
      break;
    case 'png':
      pipeline = pipeline.png({
        quality,
        progressive,
        compressionLevel: 9
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({
        quality,
        effort: 6
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({
        quality,
        effort: 4
      });
      break;
  }

  // Process image
  const buffer = await pipeline.toBuffer();
  const metadata = await sharp(buffer).metadata();

  // Save to cache
  fs.writeFileSync(cachedPath, buffer);

  return {
    buffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format,
    size: buffer.length,
    originalSize,
    compressionRatio: (1 - buffer.length / originalSize) * 100
  };
}

// Generate responsive images
export async function generateResponsiveImages(
  inputPath: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
  options: Omit<ImageOptimizationOptions, 'width' | 'height'> = {}
): Promise<Array<{
  width: number;
  src: string;
  size: number;
  format: string;
}>> {
  const results = [];

  for (const size of sizes) {
    try {
      const optimized = await optimizeImage(inputPath, {
        ...options,
        width: size,
        height: size
      });

      const filename = `${path.basename(inputPath, path.extname(inputPath))}-${size}w.${optimized.format}`;
      const outputPath = path.join(OPTIMIZED_DIR, filename);
      
      fs.writeFileSync(outputPath, optimized.buffer);

      results.push({
        width: size,
        src: `/optimized/${filename}`,
        size: optimized.size,
        format: optimized.format
      });
    } catch (error) {
      console.error(`Error generating ${size}px image:`, error);
    }
  }

  return results;
}

// Generate placeholder image
export async function generatePlaceholder(
  inputPath: string,
  width: number = 20,
  height: number = 20,
  blur: number = 5
): Promise<string> {
  const optimized = await optimizeImage(inputPath, {
    width,
    height,
    blur,
    quality: 20,
    format: 'jpeg'
  });

  return `data:image/jpeg;base64,${optimized.buffer.toString('base64')}`;
}

// Get image metadata
export async function getImageMetadata(inputPath: string) {
  const metadata = await sharp(inputPath).metadata();
  const stats = fs.statSync(inputPath);
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: stats.size,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    channels: metadata.channels,
    space: metadata.space
  };
}

// Clean up old cached images
export function cleanupOptimizedImages(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 days
  const now = Date.now();
  
  try {
    const files = fs.readdirSync(OPTIMIZED_DIR);
    
    for (const file of files) {
      const filePath = path.join(OPTIMIZED_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old optimized image: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up optimized images:', error);
  }
}

// Get optimization statistics
export function getOptimizationStats() {
  try {
    const files = fs.readdirSync(OPTIMIZED_DIR);
    let totalSize = 0;
    let fileCount = 0;
    
    for (const file of files) {
      const filePath = path.join(OPTIMIZED_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      fileCount++;
    }
    
    return {
      fileCount,
      totalSize,
      averageSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0
    };
  } catch (error) {
    console.error('Error getting optimization stats:', error);
    return { fileCount: 0, totalSize: 0, averageSize: 0 };
  }
}
