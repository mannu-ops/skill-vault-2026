import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { initMetaPixel, trackPageView, setUserProperties, DEFAULT_PIXEL_ID } from '@/lib/meta-pixel';

interface MetaPixelTrackerProps {
  user?: any;
  pixelId?: string;
}

export function MetaPixelTracker({ user, pixelId }: MetaPixelTrackerProps) {
  const [location] = useLocation();
  const isInitialMount = useRef(true);

  // Initialize Meta Pixel on startup (runs init + initial PageView)
  useEffect(() => {
    const activePixelId = pixelId || DEFAULT_PIXEL_ID;
    console.log('[Meta Pixel Log] 1. Before initMetaPixel call with Pixel ID:', activePixelId);
    if (activePixelId) {
      const userData = user ? {
        email: user.email,
        phone: user.phone || user.phoneNumber,
        firstName: user.name?.split(' ')[0] || user.firstName,
        lastName: user.name?.split(' ').slice(1).join(' ') || user.lastName,
        externalId: user.id || user._id,
      } : undefined;

      const res = initMetaPixel(activePixelId, userData);
      console.log('[Meta Pixel Log] 4. After initMetaPixel call. Result:', res, 'callMethod exists:', typeof (window as any).fbq?.callMethod === 'function');
    }
  }, [pixelId]);

  // Track PageView on subsequent SPA route changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    trackPageView(location);
  }, [location]);

  // Update user properties when user state changes
  useEffect(() => {
    if (user) {
      setUserProperties({
        email: user.email,
        phone: user.phone || user.phoneNumber,
        firstName: user.name?.split(' ')[0] || user.firstName,
        lastName: user.name?.split(' ').slice(1).join(' ') || user.lastName,
        externalId: user.id || user._id,
      });
    }
  }, [user]);

  return null;
}

export default MetaPixelTracker;
