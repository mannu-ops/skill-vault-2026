/**
 * Meta Pixel (Meta Dataset) SDK & Conversion Tracking Utility
 * 
 * Provides safe, robust client-side tracking for Meta Ads standard and custom events,
 * Advanced Matching (user data hashing/passing), SPA pageview tracking, and Event ID generation
 * for Meta Conversions API (CAPI) deduplication.
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    __META_PIXEL_INITIALIZED__?: boolean;
    __META_PIXEL_ID__?: string;
  }
}

// Default fallback Pixel ID (can be overridden via VITE_META_PIXEL_ID or backend config)
export const DEFAULT_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '1050246971041721';

/**
 * Generate a unique event ID for deduplicating events between Client Meta Pixel and Server CAPI
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `evt_${timestamp}_${randomStr}`;
}

/**
 * Sanitize and normalize string for Advanced Matching
 */
function cleanString(str?: string): string | undefined {
  if (!str) return undefined;
  const trimmed = str.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Clean phone number for Advanced Matching (numbers only)
 */
function cleanPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 ? digits : undefined;
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  externalId?: string;
}

export interface EventContentItem {
  id: string;
  title?: string;
  price?: number | string;
  category?: string;
  quantity?: number;
}

/**
 * Format user data object for Meta Pixel Advanced Matching
 */
export function formatUserData(userData?: UserData): Record<string, string> {
  if (!userData) return {};
  const data: Record<string, string> = {};

  const em = cleanString(userData.email);
  if (em) data.em = em;

  const ph = cleanPhone(userData.phone);
  if (ph) data.ph = ph;

  const fn = cleanString(userData.firstName);
  if (fn) data.fn = fn;

  const ln = cleanString(userData.lastName);
  if (ln) data.ln = ln;

  const ct = cleanString(userData.city);
  if (ct) data.ct = ct;

  const st = cleanString(userData.state);
  if (st) data.st = st;

  const country = cleanString(userData.country);
  if (country) data.country = country;

  const zp = cleanString(userData.zip);
  if (zp) data.zp = zp;

  const ext = cleanString(userData.externalId);
  if (ext) data.external_id = ext;

  return data;
}

/**
 * Initialize Meta Pixel SDK on window object
 */
export function initMetaPixel(pixelId: string = DEFAULT_PIXEL_ID, userData?: UserData): boolean {
  if (typeof window === 'undefined') return false;

  const targetPixelId = pixelId || DEFAULT_PIXEL_ID;
  if (!targetPixelId) {
    if (import.meta.env.DEV) {
      console.warn('[Meta Pixel] No Pixel ID provided. Tracking is inactive. Set VITE_META_PIXEL_ID in your .env file.');
    }
    return false;
  }

  window.__META_PIXEL_ID__ = targetPixelId;

  if (window.__META_PIXEL_INITIALIZED__) {
    if (userData && Object.keys(userData).length > 0) {
      setUserProperties(userData);
    }
    return true;
  }

  // Inject Meta Pixel script if not present
  if (!window.fbq) {
    /* eslint-disable */
    const n: any = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = document.getElementsByTagName('script')[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    } else {
      document.head.appendChild(t);
    }
    /* eslint-enable */
  }

  const advancedMatchingData = formatUserData(userData);

  // Initialize Pixel ID with optional Advanced Matching user data
  if (Object.keys(advancedMatchingData).length > 0) {
    window.fbq('init', targetPixelId, advancedMatchingData);
  } else {
    window.fbq('init', targetPixelId);
  }

  window.__META_PIXEL_INITIALIZED__ = true;

  if (import.meta.env.DEV) {
    console.log(`[Meta Pixel] Initialized successfully with Pixel ID: ${targetPixelId}`, advancedMatchingData);
  }

  return true;
}

/**
 * Set or update user properties for Advanced Matching
 */
export function setUserProperties(userData: UserData): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  const matchingData = formatUserData(userData);
  if (Object.keys(matchingData).length > 0) {
    try {
      window.fbq('setUserProperties', window.__META_PIXEL_ID__, matchingData);
      if (import.meta.env.DEV) {
        console.log('[Meta Pixel] Updated Advanced Matching User Properties:', matchingData);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Meta Pixel] setUserProperties error:', e);
    }
  }
}

/**
 * Track Standard PageView
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', 'PageView');
    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel Event] PageView ${url ? `(${url})` : ''}`);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] PageView error:', e);
  }
}

/**
 * Track ViewContent Event (Product/Course View)
 */
export function trackViewContent(params: {
  contentId: string;
  contentName: string;
  category?: string;
  value?: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_category: params.category || 'Digital Asset',
      content_type: 'product',
      value: params.value || 0,
      currency: params.currency || 'INR',
    };
    window.fbq('track', 'ViewContent', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] ViewContent', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] ViewContent error:', e);
  }
}

/**
 * Track Search Event
 */
export function trackSearch(searchQuery: string): void {
  if (typeof window === 'undefined' || !window.fbq || !searchQuery?.trim()) return;
  try {
    const payload = {
      search_string: searchQuery.trim(),
    };
    window.fbq('track', 'Search', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] Search', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] Search error:', e);
  }
}

/**
 * Track AddToCart Event
 */
export function trackAddToCart(params: {
  contentId: string;
  contentName: string;
  category?: string;
  value?: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_category: params.category || 'Digital Asset',
      content_type: 'product',
      value: params.value || 0,
      currency: params.currency || 'INR',
    };
    window.fbq('track', 'AddToCart', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] AddToCart', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] AddToCart error:', e);
  }
}

/**
 * Track InitiateCheckout Event
 */
export function trackInitiateCheckout(params: {
  contentIds: string[];
  contentName?: string;
  numItems: number;
  value: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_ids: params.contentIds,
      content_name: params.contentName || 'Cart Checkout',
      content_type: 'product',
      num_items: params.numItems,
      value: params.value,
      currency: params.currency || 'INR',
    };
    window.fbq('track', 'InitiateCheckout', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] InitiateCheckout', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] InitiateCheckout error:', e);
  }
}

/**
 * Track AddPaymentInfo Event
 */
export function trackAddPaymentInfo(params: {
  contentIds: string[];
  value: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_ids: params.contentIds,
      content_type: 'product',
      value: params.value,
      currency: params.currency || 'INR',
    };
    window.fbq('track', 'AddPaymentInfo', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] AddPaymentInfo', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] AddPaymentInfo error:', e);
  }
}

/**
 * Track Purchase Event (with optional Event ID for CAPI deduplication)
 */
export function trackPurchase(
  params: {
    contentIds: string[];
    contentName?: string;
    numItems: number;
    value: number;
    currency?: string;
    orderId?: string;
  },
  eventId?: string
): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_ids: params.contentIds,
      content_name: params.contentName || 'Digital Course Purchase',
      content_type: 'product',
      num_items: params.numItems,
      value: params.value,
      currency: params.currency || 'INR',
      order_id: params.orderId || '',
    };

    if (eventId) {
      window.fbq('track', 'Purchase', payload, { eventID: eventId });
    } else {
      window.fbq('track', 'Purchase', payload);
    }

    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel Event] Purchase ${eventId ? `(eventId: ${eventId})` : ''}`, payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] Purchase error:', e);
  }
}

/**
 * Track CompleteRegistration Event (Signup/Login)
 */
export function trackCompleteRegistration(params?: {
  method?: string;
  status?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    const payload = {
      content_name: params?.method || 'Email/Google',
      status: params?.status || 'success',
    };
    window.fbq('track', 'CompleteRegistration', payload);
    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Event] CompleteRegistration', payload);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('[Meta Pixel] CompleteRegistration error:', e);
  }
}

/**
 * Track Custom Event
 */
export function trackCustomEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.fbq || !eventName) return;
  try {
    window.fbq('trackCustom', eventName, params || {});
    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel Custom Event] ${eventName}`, params);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error(`[Meta Pixel] Custom event (${eventName}) error:`, e);
  }
}
