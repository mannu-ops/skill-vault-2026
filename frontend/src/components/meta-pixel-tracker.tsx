import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { initMetaPixel, trackPageView, setUserProperties, DEFAULT_PIXEL_ID } from '@/lib/meta-pixel';

interface MetaPixelTrackerProps {
  user?: any;
  pixelId?: string;
}

export function MetaPixelTracker({ user, pixelId }: MetaPixelTrackerProps) {
  const [location] = useLocation();
  const prevLocationRef = useRef<string | null>(null);

  // Initialize Meta Pixel on startup (runs init + initial PageView)
  useEffect(() => {
    const activePixelId = pixelId || DEFAULT_PIXEL_ID;
    if (activePixelId) {
      const userData = user ? {
        email: user.email,
        phone: user.phone || user.phoneNumber,
        firstName: user.name?.split(' ')[0] || user.firstName,
        lastName: user.name?.split(' ').slice(1).join(' ') || user.lastName,
        externalId: user.id || user._id,
      } : undefined;

      initMetaPixel(activePixelId, userData);
    }
  }, [pixelId]);

  // Track PageView on initial page load and every SPA route change
  useEffect(() => {
    trackPageView(location);
    prevLocationRef.current = location;
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
