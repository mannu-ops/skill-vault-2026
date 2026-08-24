import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { initMetaPixel, trackPageView, setUserProperties, DEFAULT_PIXEL_ID } from '@/lib/meta-pixel';

interface MetaPixelTrackerProps {
  user?: any;
  pixelId?: string;
}

export function MetaPixelTracker({ user, pixelId }: MetaPixelTrackerProps) {
  const [location] = useLocation();

  // Initialize Meta Pixel on startup
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

  // Track PageView on route changes
  useEffect(() => {
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
