/**
 * Custom hook for common animation patterns
 * Provides reusable animation logic
 */

import { useEffect, useState } from 'react';
import { useAnimation, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';

/**
 * Hook for managing animation state on mount
 */
export function useAnimationOnMount(delay = 0) {
  const controls = useAnimation();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start('animate');
      setHasMounted(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [controls, delay]);

  return { controls, hasMounted };
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation() {
  const controls = useAnimation();
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        controls.start('animate');
        observer.unobserve(ref);
      }
    }, { threshold: 0.1 });

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, controls]);

  return { ref, controls };
}

/**
 * Hook for mouse position tracking (for glow effects)
 */
export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePosition;
}

/**
 * Hook for smooth scroll animation
 */
export function useSmoothScroll() {
  const scrollTo = (element: HTMLElement | string) => {
    let targetElement: HTMLElement | null = null;

    if (typeof element === 'string') {
      targetElement = document.querySelector(element);
    } else {
      targetElement = element;
    }

    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { scrollTo };
}

/**
 * Hook for parallax scroll effect
 */
export function useParallax(offset = 50) {
  const y = useMotionValue(0);
  const backgroundY = useTransform(y, (latest) => latest * 0.5);

  useEffect(() => {
    const handleScroll = () => {
      y.set(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [y]);

  return { y: backgroundY };
}

/**
 * Hook for fade in animation
 */
export function useFadeIn() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, transition: { duration: 0.5 } });
  }, [controls]);

  return controls;
}

/**
 * Hook for slide animation
 */
export function useSlideIn(direction: 'left' | 'right' | 'up' | 'down' = 'up') {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -50, opacity: 0 };
      case 'right': return { x: 50, opacity: 0 };
      case 'up': return { y: 50, opacity: 0 };
      case 'down': return { y: -50, opacity: 0 };
      default: return { opacity: 0 };
    }
  };

  return {
    initial: getInitialPosition(),
    animate: { x: 0, y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' },
  };
}

/**
 * Hook for debounced animations
 */
export function useDebounceAnimation(value: boolean, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for hover animation state
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
}

/**
 * Hook for click animation (ripple effect)
 */
export function useClickAnimation() {
  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setClicks((prev) => [...prev, { id, x, y }]);

    setTimeout(() => {
      setClicks((prev) => prev.filter((click) => click.id !== id));
    }, 600);
  };

  return { clicks, handleClick };
}

/**
 * Hook for loading state animations
 */
export function useLoadingAnimation(isLoading: boolean) {
  const controls = useAnimation();

  useEffect(() => {
    if (isLoading) {
      controls.start({
        opacity: [0.5, 1, 0.5],
        transition: { duration: 1.5, repeat: Infinity },
      });
    } else {
      controls.start({ opacity: 1, transition: { duration: 0.3 } });
    }
  }, [isLoading, controls]);

  return controls;
}
