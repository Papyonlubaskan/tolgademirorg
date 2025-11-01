'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cdnManager } from '@/lib/cdn';

interface CDNImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  position?: string;
  blur?: number;
  sharpen?: boolean;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function CDNImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'webp',
  fit = 'cover',
  position = 'center',
  blur,
  sharpen = false,
  className = '',
  loading = 'lazy',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}: CDNImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate CDN URL with transformations
  const cdnUrl = cdnManager.generateImageUrl(src, {
    width,
    height,
    quality,
    format,
    fit,
    position,
    blur,
    sharpen
  });

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <i className="ri-image-line text-2xl mb-2"></i>
          <p className="text-sm">Resim yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {isLoading && placeholder === 'blur' && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          style={{ width, height }}
        />
      )}

      {/* Loading spinner */}
      {isLoading && !blurDataURL && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={{ width, height }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      )}

      {/* Main image */}
      <img
        src={cdnUrl}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: fit,
          objectPosition: position
        }}
      />

      {/* Aspect ratio placeholder */}
      {!width && !height && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800"></div>
      )}
    </div>
  );
}

// Responsive CDN image component
interface ResponsiveCDNImageProps extends Omit<CDNImageProps, 'width' | 'height'> {
  breakpoints?: Array<{
    media: string;
    width: number;
    height?: number;
  }>;
  defaultWidth: number;
  defaultHeight?: number;
}

export function ResponsiveCDNImage({
  src,
  alt,
  breakpoints = [
    { media: '(max-width: 640px)', width: 640 },
    { media: '(max-width: 768px)', width: 768 },
    { media: '(max-width: 1024px)', width: 1024 },
    { media: '(max-width: 1280px)', width: 1280 },
    { media: '(min-width: 1281px)', width: 1920 }
  ],
  defaultWidth,
  defaultHeight,
  ...props
}: ResponsiveCDNImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [currentWidth, setCurrentWidth] = useState<number>(defaultWidth);
  const [currentHeight, setCurrentHeight] = useState<number | undefined>(defaultHeight);

  // Generate responsive CDN URL
  const generateResponsiveUrl = (width: number, height?: number) => {
    return cdnManager.generateImageUrl(src, {
      width,
      height,
      quality: props.quality,
      format: props.format,
      fit: props.fit,
      position: props.position,
      blur: props.blur,
      sharpen: props.sharpen
    });
  };

  // Update image based on screen size
  const updateImage = () => {
    const screenWidth = window.innerWidth;
    let selectedBreakpoint = breakpoints[breakpoints.length - 1];

    for (const breakpoint of breakpoints) {
      if (window.matchMedia(breakpoint.media).matches) {
        selectedBreakpoint = breakpoint;
        break;
      }
    }

    setCurrentWidth(selectedBreakpoint.width);
    setCurrentHeight(selectedBreakpoint.height);
    setCurrentSrc(generateResponsiveUrl(selectedBreakpoint.width, selectedBreakpoint.height));
  };

  // Set initial image
  useEffect(() => {
    setCurrentSrc(generateResponsiveUrl(defaultWidth, defaultHeight));
  }, [src, defaultWidth, defaultHeight]);

  // Listen for resize events
  useEffect(() => {
    updateImage();
    window.addEventListener('resize', updateImage);
    return () => window.removeEventListener('resize', updateImage);
  }, [breakpoints]);

  return (
    <CDNImage
      src={currentSrc}
      alt={alt}
      width={currentWidth}
      height={currentHeight}
      {...props}
    />
  );
}

// CDN image with lazy loading
export function LazyCDNImage(props: CDNImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 dark:bg-gray-800 ${props.className}`}
        style={{ width: props.width, height: props.height }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full h-full"></div>
        </div>
      </div>
    );
  }

  return (
    <CDNImage
      {...props}
      onLoad={() => {
        setHasLoaded(true);
        props.onLoad?.();
      }}
    />
  );
}
