/**
 * ImageKit CDN URL Generator & Dynamic Optimization Helper
 * 
 * Provides automated format optimization (WebP/AVIF), quality compression (q-80),
 * and responsive dimension scaling across devices.
 */

export const IMAGEKIT_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/e1wrzy1j2';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Transforms an image URL to an optimized ImageKit URL with specified parameters.
 * If the image is not hosted on ImageKit, returns the original source unchanged.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  options: ImageTransformOptions = {}
): string {
  if (!src) return '';
  
  // Clean whitespace
  const cleanSrc = src.trim();

  // If not an ImageKit URL, return source as is
  if (!cleanSrc.includes('ik.imagekit.io') && !cleanSrc.startsWith(IMAGEKIT_ENDPOINT)) {
    return cleanSrc;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    blur,
    crop,
    focus
  } = options;

  const transforms: string[] = [];

  if (width) transforms.push(`w-${Math.round(width)}`);
  if (height) transforms.push(`h-${Math.round(height)}`);
  if (quality) transforms.push(`q-${quality}`);
  if (format) transforms.push(`f-${format}`);
  if (blur) transforms.push(`bl-${blur}`);
  if (crop) transforms.push(`c-${crop}`);
  if (focus) transforms.push(`fo-${focus}`);

  if (transforms.length === 0) {
    return cleanSrc;
  }

  const transformString = `tr=${transforms.join(',')}`;

  // Parse URL to append query parameter cleanly
  const separator = cleanSrc.includes('?') ? '&' : '?';
  
  // If tr= is already present, replace it or append
  if (cleanSrc.includes('tr=')) {
    return cleanSrc.replace(/tr=[^&]+/, transformString);
  }

  return `${cleanSrc}${separator}${transformString}`;
}

/**
 * Preset helper for fast thumbnail & card images (300px - 600px width)
 */
export function getImageThumbnail(src: string | undefined | null, width = 450): string {
  return getOptimizedImageUrl(src, {
    width,
    quality: 80,
    format: 'auto'
  });
}

/**
 * Preset helper for high-resolution hero banners and modal views (800px - 1400px width)
 */
export function getImageBanner(src: string | undefined | null, width = 1200): string {
  return getOptimizedImageUrl(src, {
    width,
    quality: 85,
    format: 'auto'
  });
}

/**
 * Preset helper for compact avatar and icon previews (64px - 128px)
 */
export function getImageAvatar(src: string | undefined | null, size = 96): string {
  return getOptimizedImageUrl(src, {
    width: size,
    height: size,
    crop: 'maintain_ratio',
    quality: 80,
    format: 'auto'
  });
}
