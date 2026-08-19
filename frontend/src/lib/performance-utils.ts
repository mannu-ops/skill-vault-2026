/**
 * Smooth scroll utility that uses native CSS scroll-behavior
 * Fallback to element.scrollIntoView() for better performance
 */
export function smoothScrollTo(targetSelector: string) {
  if (targetSelector === '#top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const el = document.querySelector(targetSelector);
  if (!el) return;

  // Use native scrollIntoView for better browser optimization
  const headerOffset = 75;
  const offsetTop = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

  window.scrollTo({ top: offsetTop, behavior: 'smooth' });
}

/**
 * Prefetch images for better perceived performance
 */
export function prefetchImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Debounce function to optimize search and filter performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for scroll and resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= interval) {
      func(...args);
      last = now;
    }
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
