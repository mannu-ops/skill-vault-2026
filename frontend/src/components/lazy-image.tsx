import { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '../lib/imagekit';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: string;
}

/**
 * LazyImage component for optimized image loading with ImageKit CDN transformations
 * Uses Intersection Observer for efficient lazy loading and automated format/quality compression
 */
export function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  placeholder = 'bg-slate-900 blur-sm',
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'auto'
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            setImageSrc(img.dataset.src || '');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [optimizedSrc]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <img
      ref={imgRef}
      data-src={optimizedSrc}
      src={imageSrc || ''}
      alt={alt}
      className={`transition-all duration-300 ${isLoading ? placeholder : ''} ${className}`}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}
