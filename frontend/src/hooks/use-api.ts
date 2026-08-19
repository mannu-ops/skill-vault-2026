import { useEffect, useState, useCallback, useRef } from 'react';
import { COURSES, type Course } from '@/data/courses';
import { getApiUrl } from '@/config';
import { getCategoryDetails } from '@/lib/category-config';

export function useLiveCourses(): { courses: Course[]; loading: boolean; error: Error | null } {
  const [liveCourses, setLiveCourses] = useState<Course[]>(() => (Array.isArray(COURSES) ? COURSES : []));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        let res = await fetch(getApiUrl('/api/products'), {
          signal: abortControllerRef.current?.signal,
        });

        if (!res.ok) {
          res = await fetch(getApiUrl('/api/courses'), {
            signal: abortControllerRef.current?.signal,
          });
        }

        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.products || data.courses || []);

        if (rawList && rawList.length > 0) {
          const coursesFromDb: Course[] = rawList.map((dbCourse: any) => {
            const meta = getCategoryDetails(dbCourse.category || '', dbCourse.id || '');

            const parsedModules =
              dbCourse.modules && Array.isArray(dbCourse.modules) && dbCourse.modules.length > 0
                ? dbCourse.modules.map((m: any, idx: number) => ({
                    number: String(idx + 1).padStart(2, '0'),
                    title: typeof m === 'string' ? m : m.title,
                    detail: m.detail || 'Practical hands-on lab & security testing module.',
                    lessons: m.lessons || '1 Lesson',
                  }))
                : meta.modules;

            const parsedFaqs =
              dbCourse.faqs && Array.isArray(dbCourse.faqs) && dbCourse.faqs.length > 0
                ? dbCourse.faqs.map((f: any) =>
                    Array.isArray(f) ? (f as [string, string]) : ([f.question, f.answer] as [string, string])
                  )
                : [
                    ['Is this course beginner-friendly?', 'Yes, it starts from fundamentals and progresses step-by-step to advanced concepts.'],
                    ['How long do I get access?', 'You get lifetime access to all course materials and Google Drive updates.'],
                    ['How do I access course materials?', 'Course access links are delivered directly to your email inbox immediately after purchase.'],
                  ];

            const rawPrice = dbCourse.priceInr ?? dbCourse.price_inr ?? dbCourse.price ?? 299;
            const pInr = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);

            const rawOrig = dbCourse.originalPriceInr ?? dbCourse.original_price_inr ?? dbCourse.originalPrice ?? (pInr * 3);
            const origInr = typeof rawOrig === 'number' ? rawOrig : (parseFloat(String(rawOrig).replace(/[^0-9.]/g, '')) || pInr * 3);

            return {
              id: dbCourse.id,
              title: dbCourse.title,
              subtitle: dbCourse.subtitle || '',
              description: dbCourse.description || '',
              category: dbCourse.category || 'Course',
              level: 'Beginner to Advanced',
              price: pInr.toLocaleString('en-IN'),
              originalPrice: origInr.toLocaleString('en-IN'),
              duration: dbCourse.duration || `${parsedModules.length} Modules • Lifetime Access`,
              modulesCount: parsedModules.length,
              iconName: meta.iconName,
              themeColor: meta.themeColor,
              badge: meta.badge,
              skills:
                (dbCourse.features && Array.isArray(dbCourse.features) && dbCourse.features.length > 0)
                  ? dbCourse.features
                  : meta.skills,
              modules: parsedModules,
              projects: meta.projects,
              faqs: parsedFaqs,
              bonus: dbCourse.bonus || undefined,
              testimonials:
                dbCourse.testimonials && Array.isArray(dbCourse.testimonials)
                  ? dbCourse.testimonials
                  : undefined,
              imageUrl: dbCourse.imageUrl || dbCourse.image_url || undefined,
            };
          });

          setLiveCourses(coursesFromDb);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch live database courses:', err);
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCourses();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { courses: liveCourses, loading, error };
}

export function useCart(user?: any, availableCourses?: Course[]) {
  const userId = user?.id || user?.email || 'guest';
  const storageKey = `sv_cart_items_${userId}`;

  const [cartItems, setCartItems] = useState<Course[]>(() => {
    try {
      // 1. Try user-specific local storage
      const userRaw = localStorage.getItem(storageKey);
      if (userRaw) return JSON.parse(userRaw);

      // 2. Try DB user cart if present
      if (user?.cart && Array.isArray(user.cart) && user.cart.length > 0) {
        return user.cart;
      }

      // 3. Fallback to guest storage
      const guestRaw = localStorage.getItem('sv_cart_items');
      return guestRaw ? JSON.parse(guestRaw) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Reload/Sync when user logs in or user object updates
  useEffect(() => {
    if (user?.id) {
      const userRaw = localStorage.getItem(storageKey);
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw);
          // Merge guest cart if user cart is empty
          const guestRaw = localStorage.getItem('sv_cart_items');
          const guestItems: Course[] = guestRaw ? JSON.parse(guestRaw) : [];

          if (parsed.length === 0 && guestItems.length > 0) {
            setCartItems(guestItems);
            localStorage.setItem(storageKey, JSON.stringify(guestItems));
          } else {
            setCartItems(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      } else if (user?.cart && Array.isArray(user.cart)) {
        setCartItems(user.cart);
        try {
          localStorage.setItem(storageKey, JSON.stringify(user.cart));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user?.id]);

  // Purge any deleted/unavailable courses from cart
  useEffect(() => {
    if (Array.isArray(availableCourses) && availableCourses.length > 0 && cartItems.length > 0) {
      const activeIds = new Set(availableCourses.map((c) => c && c.id));
      const validCart = cartItems.filter((item) => item && activeIds.has(item.id));
      if (validCart.length !== cartItems.length) {
        setCartItems(validCart);
      }
    }
  }, [availableCourses, cartItems.length]);

  // Persist locally & Sync with backend PostgreSQL database
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
      if (!user?.id) {
        localStorage.setItem('sv_cart_items', JSON.stringify(cartItems));
      }
    } catch (e) {
      console.error('Failed to save cart items:', e);
    }

    // Sync to PostgreSQL DB via API if user is authenticated
    const token = localStorage.getItem('sv_user_token');
    if (user?.id && token) {
      const timer = setTimeout(() => {
        fetch(getApiUrl('/api/cart'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cartItems })
        }).catch((err) => console.warn('Failed to sync cart to DB:', err));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [cartItems, storageKey, user?.id]);

  const addToCart = useCallback((course: Course) => {
    setCartItems((prev) => (prev.some((c) => c.id === course.id) ? prev : [...prev, course]));
  }, []);

  const removeFromCart = useCallback((courseId: string) => {
    setCartItems((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.setItem(storageKey, '[]');
      localStorage.setItem('sv_cart_items', '[]');
    } catch (e) {
      console.error('Failed to clear local cart:', e);
    }
  }, [storageKey]);

  const isInCart = useCallback((courseId: string) => {
    return cartItems.some((c) => c.id === courseId);
  }, [cartItems]);

  return {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
  };
}

export function useAuth() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('sv_user_token') || '');
  const [user, setUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('sv_user_data');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const logout = useCallback(() => {
    const prevName = user?.name || user?.email?.split('@')[0] || '';
    setUser(null);
    setToken('');
    setPurchases([]);
    localStorage.removeItem('sv_user_token');
    localStorage.removeItem('sv_user_data');
    setAuthNotice(
      `👋 Logged out successfully! See you soon${prevName ? ', ' + prevName : ''}.`
    );
    setTimeout(() => setAuthNotice(''), 4000);
  }, [user]);

  const fetchProfile = useCallback(
    async (authToken = token) => {
      if (!authToken) return;

      abortControllerRef.current = new AbortController();
      setLoading(true);

      try {
        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: abortControllerRef.current.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('sv_user_data', JSON.stringify(data.user));
          }
          if (Array.isArray(data.purchases)) {
            setPurchases(data.purchases);
          }
        } else if (res.status === 401 || res.status === 404) {
          logout();
        }
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('Failed to fetch user profile:', e);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, logout]
  );

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [token, fetchProfile]);

  const loginSuccess = useCallback((userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('sv_user_token', userToken);
    localStorage.setItem('sv_user_data', JSON.stringify(userData));
    fetchProfile(userToken);
    setAuthNotice(
      `🎉 Welcome back, ${userData.name || userData.email.split('@')[0]}! Logged in successfully.`
    );
    setTimeout(() => setAuthNotice(''), 4500);
  }, [fetchProfile]);

  const openAuth = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  return {
    user,
    token,
    purchases,
    loading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    isPurchasesModalOpen,
    setIsPurchasesModalOpen,
    authNotice,
    setAuthNotice,
    openAuth,
    logout,
    loginSuccess,
    fetchProfile,
  };
}
