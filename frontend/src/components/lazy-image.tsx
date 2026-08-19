import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
}

/**
 * LazyImage component for optimized image loading
 * Uses Intersection Observer for efficient lazy loading
 */
export function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'bg-slate-900 blur-sm',
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <img
      ref={imgRef}
      data-src={src}
      src={imageSrc || ''}
      alt={alt}
      className={`transition-all duration-300 ${isLoading ? placeholder : ''} ${className}`}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}
