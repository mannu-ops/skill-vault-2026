import { useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AnimationProvider } from '@/components/animation-provider';
import { AnimatedButton } from '@/components/animated-button';
import { AnimatedCard } from '@/components/animated-card';
import { fadeInUp, containerAnimation, listItemAnimation } from '@/lib/animations';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  LockKeyhole,
  Terminal,
  Layers3,
  Layers,
  Code2,
  FileText,
  Zap,
  GitBranch,
  Database,
  Server,
  Sparkles,
  ShieldCheck,
  Play,
  CircleCheck,
  Braces,
  Search,
  BookOpen,
  Clock,
  Award,
  BookMarked,
  ArrowLeft,
  Share2,
  CheckCircle2,
  ShoppingBag,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingCart,
  ShieldAlert,
  Maximize2,
  Instagram,
  Facebook
} from 'lucide-react';
import { Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { COURSES, type Course, type CourseModule } from './data/courses';
import { getApiUrl } from './config';
import { AuthModal } from './components/auth-modal';
import { CartDrawer } from './components/cart-drawer';
import { CheckoutPage } from './pages/checkout-page';
import { PaymentSuccessPage } from './pages/payment-success-page';
import { PaymentFailedPage } from './pages/payment-failed-page';
import { PurchasesPage } from './pages/purchases-page';
import { MetaPixelTracker } from './components/meta-pixel-tracker';
import { trackAddToCart, trackCompleteRegistration, trackSearch, trackViewContent } from './lib/meta-pixel';
import { getImageThumbnail, getImageBanner } from './lib/imagekit';
import { CanvaPage } from './pages/canva-page';

const queryClient = new QueryClient();

type PaymentState = 'idle' | 'loading' | 'setup' | 'success' | 'cancelled' | 'pending';

const CATEGORIES = [
  'All Products',
  'Course',
  'Software',
  'Architecture & Design',
  'Game',
  'Notes',
  'Hacks',
  'Blog'
] as const;

function getCourseIcon(iconName: string) {
  switch (iconName) {
    case 'Server': return Server;
    case 'Sparkles': return Sparkles;
    case 'Layers3': return Layers3;
    case 'GitBranch': return GitBranch;
    case 'ShieldCheck': return ShieldCheck;
    case 'Terminal':
    default: return Terminal;
  }
}

function getThemeClasses(themeColor: Course['themeColor']) {
  switch (themeColor) {
    case 'cyan':
      return {
        badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
        accentText: 'text-cyan-300',
        borderHover: 'hover:border-cyan-400/40',
        buttonBg: 'bg-cyan-300 text-slate-950 hover:bg-cyan-200',
        pill: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
      };
    case 'emerald':
      return {
        badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        accentText: 'text-emerald-300',
        borderHover: 'hover:border-emerald-400/40',
        buttonBg: 'bg-emerald-300 text-slate-950 hover:bg-emerald-200',
        pill: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
      };
    case 'amber':
      return {
        badge: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        accentText: 'text-amber-300',
        borderHover: 'hover:border-amber-400/40',
        buttonBg: 'bg-amber-300 text-slate-950 hover:bg-amber-200',
        pill: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
      };
    case 'rose':
      return {
        badge: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
        accentText: 'text-rose-300',
        borderHover: 'hover:border-rose-400/40',
        buttonBg: 'bg-rose-300 text-slate-950 hover:bg-rose-200',
        pill: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
      };
    case 'indigo':
      return {
        badge: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
        accentText: 'text-indigo-300',
        borderHover: 'hover:border-indigo-400/40',
        buttonBg: 'bg-indigo-300 text-slate-950 hover:bg-indigo-200',
        pill: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/20',
      };
    case 'violet':
    default:
      return {
        badge: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
        accentText: 'text-violet-300',
        borderHover: 'hover:border-violet-400/40',
        buttonBg: 'bg-violet-300 text-slate-950 hover:bg-violet-200',
        pill: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
      };
  }
}

function smoothScrollTo(targetSelector: string) {
  const headerOffset = 75;
  let targetY = 0;

  if (targetSelector !== '#top') {
    const el = document.querySelector(targetSelector);
    if (el) {
      targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    }
  }

  const startY = window.pageYOffset;
  const distance = targetY - startY;
  if (Math.abs(distance) < 5) return;

  const duration = 650;
  let startTime: number | null = null;

  function step(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeInOutCubic for ultra smooth motion
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startY + distance * ease);

    if (elapsed < duration) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="button-brand"
      className="group flex items-center gap-2.5 text-left cursor-pointer shrink-0 transition-opacity hover:opacity-90"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-violet-600/20">
        SV
      </div>
      <span className="font-heading font-black tracking-tight text-base sm:text-lg text-white">
        SKILL<span className="text-violet-400">VAULT</span>
      </span>
    </button>
  );
}

function CheckoutButton({
  course,
  courseId,
  onAddToCart,
  label = 'Buy Now',
  className = ''
}: {
  course?: Course;
  courseId?: string;
  onAddToCart?: (course: Course) => void;
  label?: string;
  onState?: (state: PaymentState) => void;
  className?: string;
}) {
  const [, setLocation] = useLocation();

  const handleCheckout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (course && onAddToCart) {
      onAddToCart(course);
    }
    const targetId = course?.id || courseId;
    if (targetId) {
      setLocation(`/checkout?courseId=${encodeURIComponent(targetId)}`);
    } else {
      setLocation('/checkout');
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCheckout}
      data-testid={`button-checkout-${course?.id || courseId || 'default'}`}
      className={`glow-button inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-violet-300 px-4 text-xs sm:text-sm md:text-base font-bold text-slate-950 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-70 cursor-pointer w-full ${className}`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {label} <ArrowUpRight size={15} className="shrink-0" />
    </motion.button>
  );
}

function AuthNoticeBanner({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  const isLogout = message.toLowerCase().includes('logged out');

  return (
    <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
      <div className={`bg-slate-900/95 border rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-3 ${isLogout
        ? 'border-amber-500/40 shadow-amber-950/40'
        : 'border-emerald-500/40 shadow-emerald-950/40'
        }`}>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${isLogout
          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
          : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          }`}>
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white">
            {isLogout ? 'Account Logged Out' : 'Authentication Status'}
          </h4>
          <p className={`text-xs mt-0.5 ${isLogout ? 'text-amber-300' : 'text-emerald-300'}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function useAuth() {
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

  const fetchProfile = async (authToken = token, targetEmail = user?.email, silent = false) => {
    if (!authToken && !targetEmail) return;
    if (!silent) setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const emailQuery = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : '';
      const res = await fetch(getApiUrl(`/api/auth/me${emailQuery}`), { headers });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('sv_user_data', JSON.stringify(data.user));
        }
        if (Array.isArray(data.purchases)) {
          setPurchases(data.purchases);
        }
      } else if (res.status === 401 && authToken) {
        logout();
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token || user?.email) fetchProfile(token, user?.email, true);
  }, [token, user?.email]);

  useEffect(() => {
    if (isPurchasesModalOpen) {
      fetchProfile(token, user?.email, true);
    }
  }, [isPurchasesModalOpen]);

  const [authNotice, setAuthNotice] = useState('');

  const loginSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('sv_user_token', userToken);
    localStorage.setItem('sv_user_data', JSON.stringify(userData));
    fetchProfile(userToken);
    trackCompleteRegistration({ method: 'AuthModal', status: 'success' });
    setAuthNotice(`🎉 Welcome back, ${userData.name || userData.email.split('@')[0]}! Logged in successfully.`);
    setTimeout(() => setAuthNotice(''), 4500);
  };

  const logout = () => {
    const prevName = user?.name || user?.email?.split('@')[0] || '';
    setUser(null);
    setToken('');
    setPurchases([]);
    localStorage.removeItem('sv_user_token');
    localStorage.removeItem('sv_user_data');
    setAuthNotice(`👋 Logged out successfully! See you soon${prevName ? ', ' + prevName : ''}.`);
    setTimeout(() => setAuthNotice(''), 4000);
    try {
      for (let i = 0; i < 15; i++) {
        window.history.pushState(null, '', '/');
      }
      window.onpopstate = function () {
        window.history.forward();
      };
    } catch (e) { }
    window.location.replace('/');
  };

  const openAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

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

function useCart(user?: any, availableCourses?: Course[]) {
  const userId = user?.id || user?.email || 'guest';
  const storageKey = `sv_cart_items_${userId}`;
  const isHydratedRef = useRef(false);

  const parseCart = (raw: any): Course[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [cartItems, setCartItems] = useState<Course[]>(() => {
    try {
      const userRaw = localStorage.getItem(storageKey);
      if (userRaw) return parseCart(userRaw);

      const dbCart = parseCart(user?.cart);
      if (dbCart.length > 0) return dbCart;

      const guestRaw = localStorage.getItem('sv_cart_items');
      return parseCart(guestRaw);
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const userRaw = localStorage.getItem(storageKey);
      const dbCart = parseCart(user?.cart);
      const guestRaw = localStorage.getItem('sv_cart_items');
      const guestItems = parseCart(guestRaw);

      if (userRaw) {
        const parsed = parseCart(userRaw);
        if (parsed.length === 0 && guestItems.length > 0) {
          setCartItems(guestItems);
          localStorage.setItem(storageKey, JSON.stringify(guestItems));
        } else {
          setCartItems(parsed);
        }
      } else if (dbCart.length > 0) {
        setCartItems(dbCart);
        localStorage.setItem(storageKey, JSON.stringify(dbCart));
      } else if (guestItems.length > 0) {
        setCartItems(guestItems);
        localStorage.setItem(storageKey, JSON.stringify(guestItems));
      }
      isHydratedRef.current = true;
    } else {
      const guestRaw = localStorage.getItem('sv_cart_items');
      setCartItems(parseCart(guestRaw));
      isHydratedRef.current = true;
    }
  }, [user?.id, JSON.stringify(user?.cart)]);

  useEffect(() => {
    if (Array.isArray(availableCourses) && availableCourses.length > 0 && cartItems.length > 0) {
      const courseMap = new Map(availableCourses.map((c) => [String(c.id).toLowerCase(), c]));
      let hasChanged = false;

      const syncedCart = cartItems
        .filter((item) => item && item.id && courseMap.has(String(item.id).toLowerCase()))
        .map((item) => {
          const fresh = courseMap.get(String(item.id).toLowerCase());
          if (!fresh) return item;

          const freshPrice = String(fresh.price || fresh.priceInr || (fresh as any).price_inr || item.price);
          const freshOrigPrice = String(fresh.originalPrice || fresh.originalPriceInr || (fresh as any).original_price_inr || item.originalPrice);
          const freshTitle = fresh.title || item.title;

          if (String(item.price) !== freshPrice || String(item.originalPrice) !== freshOrigPrice || item.title !== freshTitle) {
            hasChanged = true;
            return {
              ...item,
              title: freshTitle,
              price: freshPrice,
              originalPrice: freshOrigPrice,
              imageUrl: fresh.imageUrl || item.imageUrl,
              driveUrl: fresh.driveUrl || (fresh as any).drive_url || item.driveUrl
            };
          }
          return item;
        });

      if (hasChanged || syncedCart.length !== cartItems.length) {
        setCartItems(syncedCart);
        try {
          localStorage.setItem(storageKey, JSON.stringify(syncedCart));
          if (!user?.id) {
            localStorage.setItem('sv_cart_items', JSON.stringify(syncedCart));
          }
        } catch { }
      }
    }
  }, [availableCourses, cartItems.length]);

  useEffect(() => {
    if (!isHydratedRef.current && user?.id) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
      if (!user?.id) {
        localStorage.setItem('sv_cart_items', JSON.stringify(cartItems));
      }
    } catch (e) {
      console.error('Failed to save cart items:', e);
    }

    const token = localStorage.getItem('sv_user_token');
    if (user?.id && token && isHydratedRef.current) {
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

  const addToCart = (course: Course) => {
    setCartItems((prev) => {
      if (prev.some((c) => c.id === course.id)) return prev;
      return [...prev, course];
    });
    trackAddToCart({
      contentId: course.id,
      contentName: course.title,
      category: course.category,
      value: parseFloat(String(course.price || '0').replace(/[^0-9.]/g, '')),
      currency: 'INR',
    });
  };

  const removeFromCart = (courseId: string) => {
    setCartItems((prev) => prev.filter((c) => c.id !== courseId));
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.setItem(storageKey, '[]');
      localStorage.setItem('sv_cart_items', '[]');
    } catch (e) {
      console.error('Failed to clear local cart:', e);
    }
  };

  const isInCart = (courseId: string) => {
    return cartItems.some((c) => c.id === courseId);
  };

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

function Header({
  menuOpen,
  setMenuOpen,
  onSelectCategory,
  user,
  onOpenAuthModal,
  onLogout,
  onOpenMyPurchases,
  cartCount,
  onOpenCart,
}: {
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
  onSelectCategory?: (category: string) => void;
  user: any;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenMyPurchases: () => void;
  cartCount: number;
  onOpenCart: () => void;
}) {
  const [location, setLocation] = useLocation();
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const close = () => {
    setMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  const navTo = (targetId: string, category?: string) => {
    close();
    if (category) onSelectCategory?.(category);

    const isHomePage = location === '/' || location === '';

    if (isHomePage) {
      smoothScrollTo(targetId);
    } else {
      setLocation('/');
      setTimeout(() => {
        smoothScrollTo(targetId);
      }, 150);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-white/[0.08] bg-[#08090E]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <Brand onClick={() => navTo('#top')} />

        {/* Center Desktop Navigation - Spacious & Organized */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMoreDropdownOpen(true)}
            onMouseLeave={() => setMoreDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180 text-violet-400' : ''}`} />
            </button>

            {moreDropdownOpen && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="rounded-2xl border border-slate-800 bg-[#0d0f19]/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-0.5">
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'All Products')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Layers className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">All Products</div>
                      <div className="text-[10px] text-slate-500 font-normal">Browse entire vault</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Course')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Video Courses</div>
                      <div className="text-[10px] text-slate-500 font-normal">Bootcamps & tutorials</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Software')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Software & Tools</div>
                      <div className="text-[10px] text-slate-500 font-normal">Scripts & templates</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Notes')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Study Notes & PDFs</div>
                      <div className="text-[10px] text-slate-500 font-normal">Cheat-sheets & roadmaps</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Hacks')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Hacks & Cheats</div>
                      <div className="text-[10px] text-slate-500 font-normal">Productivity boosters</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canva Pro Pill - Sleek & Highlighted */}
          <button
            type="button"
            onClick={() => {
              close();
              setLocation('/canva');
            }}
            className="px-3 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white hover:bg-white/[0.05]"
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Canva Pro</span>
            <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight">
              VIP
            </span>
          </button>

          {/* Why Us */}
          <button
            type="button"
            onClick={() => navTo('#why-us')}
            className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            Why Us
          </button>

          {/* FAQ */}
          <button
            type="button"
            onClick={() => navTo('#faq')}
            className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Section: Clean Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shopping Cart Button */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-violet-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#08090E]">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocation('/purchases')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-400" /> My Purchases
                </button>
                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                  <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" /> {user.name || user.email?.split('@')[0]}
                  </span>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      title="Logout"
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-[#0c0e17]/98 px-5 py-4 md:hidden shadow-2xl backdrop-blur-2xl">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => { close(); setLocation('/canva'); }}
              className="w-full py-2.5 px-3 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-purple-950/60 to-cyan-950/60 text-left text-xs font-bold text-white flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🎨</span>
                <span className="text-cyan-300 font-bold">Canva Pro Portal</span>
              </div>
              <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                ₹99
              </span>
            </button>

            <button type="button" onClick={() => navTo('#catalog', 'All Products')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Layers className="w-3.5 h-3.5 text-violet-400" /> All Products
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Course')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Video Courses
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Software')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Software & Tools
            </button>
            <button type="button" onClick={() => navTo('#why-us')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Why Us
            </button>
            <button type="button" onClick={() => navTo('#faq')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <span>❓</span> FAQ
            </button>

            {!user ? (
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal('login'); }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg text-center"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal('signup'); }}
                  className="flex-1 py-2 text-xs font-bold bg-violet-600 text-white rounded-lg text-center"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => { close(); setLocation('/purchases'); }}
                  className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-400" /> My Purchases
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { close(); onLogout(); }}
                    className="w-full py-1 text-xs text-rose-400 text-center"
                  >
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function PaymentNotice({ state, setState }: { state: PaymentState; setState: (state: PaymentState) => void }) {
  if (state === 'idle' || state === 'loading') return null;
  const content = {
    setup: ['Checkout is being configured.', 'Add RAZORPAY_PAYMENT_LINK_URL to server environment to enable live Razorpay payments.'],
    success: ['Payment confirmed!', 'Your Skill Vault course access is being delivered to your email inbox.'],
    cancelled: ['Checkout cancelled.', 'No charges were made. Select any course when you are ready.'],
    pending: ['Processing payment...', 'Waiting for payment confirmation. Check your inbox.'],
  }[state];
  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-lg rounded-xl border border-violet-300/30 bg-[#151322] p-4 shadow-2xl shadow-violet-950/40" role="status" data-testid={`status-payment-${state}`}>
      <div className="flex gap-3">
        <div className="mt-0.5 text-violet-300">{state === 'success' ? <CircleCheck size={18} /> : <LockKeyhole size={18} />}</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-100">{content[0]}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{content[1]}</p>
        </div>
        <button type="button" onClick={() => setState('idle')} data-testid="button-dismiss-payment" className="self-start text-slate-500 hover:text-slate-200" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function getCategoryDetails(category: string, id: string) {
  const cat = category.toLowerCase();
  const cId = id.toLowerCase();

  if (cat.includes('full stack') || cId.includes('mern')) {
    return {
      badge: 'Best Seller',
      themeColor: 'violet' as const,
      iconName: 'Terminal',
      duration: '12 Modules • 48 Hours',
      modulesCount: 12,
      skills: ['JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Git', 'Deployment'],
      modules: [
        { number: '01', title: 'Web Development Fundamentals', detail: 'Understand browsers, servers, command line, and web architecture.', lessons: '4 Lessons' },
        { number: '02', title: 'HTML5 & Responsive CSS', detail: 'Build modern grid layouts, flexbox, and responsive UI components.', lessons: '5 Lessons' },
        { number: '03', title: 'Modern JavaScript (ES6+)', detail: 'Master async/await, closures, DOM manipulation, and promises.', lessons: '6 Lessons' },
        { number: '04', title: 'React.js Core & Hooks', detail: 'Build dynamic interfaces, custom hooks, and manage app state.', lessons: '7 Lessons' },
        { number: '05', title: 'Node.js & Server Fundamentals', detail: 'Build event-driven backend scripts and filesystem operations.', lessons: '4 Lessons' },
        { number: '06', title: 'Express.js Framework & Middleware', detail: 'Design modular REST APIs, route parameters, and error handling.', lessons: '5 Lessons' },
        { number: '07', title: 'MongoDB & Database Storage', detail: 'Schema design, indexes, aggregations, and persistent storage.', lessons: '6 Lessons' },
        { number: '08', title: 'Full Stack MERN Capstone Project', detail: 'Combine frontend and backend into a production SaaS application.', lessons: '8 Lessons' },
      ],
      projects: [
        { title: 'Interactive React Dashboard', description: 'Dynamic analytics dashboard with charts.', tags: ['React', 'Tailwind'] },
        { title: 'RESTful E-Commerce API', description: 'Backend API with auth and cart routes.', tags: ['Node.js', 'MongoDB'] },
        { title: 'Full Stack SaaS Web Application', description: 'Production MERN app with user auth.', tags: ['MERN', 'REST API'] }
      ]
    };
  } else if (cat.includes('devops') || cat.includes('cloud') || cId.includes('devops')) {
    return {
      badge: 'High Demand',
      themeColor: 'cyan' as const,
      iconName: 'Server',
      duration: '10 Modules • 42 Hours',
      modulesCount: 10,
      skills: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions', 'Terraform', 'Nginx', 'Prometheus', 'Grafana'],
      modules: [
        { number: '01', title: 'Linux Administration & Shell Automation', detail: 'Process management and bash scripts.', lessons: '5 Lessons' },
        { number: '02', title: 'Docker Containers & Multi-Stage Builds', detail: 'Dockerfile optimization and Docker Compose.', lessons: '6 Lessons' },
        { number: '03', title: 'Kubernetes Orchestration & Clusters', detail: 'Deployments, services, and ingress controllers.', lessons: '7 Lessons' },
        { number: '04', title: 'CI/CD Pipelines with GitHub Actions', detail: 'Automated test, build, and deploy workflows.', lessons: '5 Lessons' },
        { number: '05', title: 'Infrastructure as Code with Terraform', detail: 'Declarative cloud provisioning.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Dockerized Microservices Environment', description: 'Multi-container orchestration setup.', tags: ['Docker', 'Redis'] },
        { title: 'Production K8s Deployment Pipeline', description: 'Automated CI/CD cluster deployment.', tags: ['Kubernetes', 'AWS'] }
      ]
    };
  } else if (cat.includes('ai') || cat.includes('data') || cId.includes('ai')) {
    return {
      badge: 'Trending',
      themeColor: 'emerald' as const,
      iconName: 'Sparkles',
      duration: '14 Modules • 56 Hours',
      modulesCount: 14,
      skills: ['Python', 'PyTorch', 'Pandas & NumPy', 'Scikit-Learn', 'LLMs & Prompting', 'LangChain', 'Vector DBs', 'RAG'],
      modules: [
        { number: '01', title: 'Python for Data Science & AI', detail: 'NumPy vector operations and Pandas DataFrames.', lessons: '6 Lessons' },
        { number: '02', title: 'Neural Networks with PyTorch', detail: 'Tensors, backpropagation, and training loops.', lessons: '7 Lessons' },
        { number: '03', title: 'LLMs & Retrieval-Augmented Generation', detail: 'Vector databases, Pinecone, and RAG pipelines.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Predictive ML Analytics Model', description: 'Customer churn prediction model.', tags: ['Python', 'Scikit-Learn'] },
        { title: 'Enterprise RAG Knowledge Assistant', description: 'AI assistant querying private PDFs.', tags: ['LangChain', 'LLMs'] }
      ]
    };
  } else if (cat.includes('mobile') || cId.includes('mobile')) {
    return {
      badge: 'Popular',
      themeColor: 'amber' as const,
      iconName: 'Layers3',
      duration: '10 Modules • 36 Hours',
      modulesCount: 10,
      skills: ['React Native', 'Expo', 'TypeScript', 'Expo Router', 'NativeWind', 'AsyncStorage', 'Push Notifications'],
      modules: [
        { number: '01', title: 'React Native & Expo Workflow', detail: 'Development builds and mobile UI layout.', lessons: '4 Lessons' },
        { number: '02', title: 'Mobile Navigation & Deep Links', detail: 'Stack, tab bars, and Expo Router.', lessons: '5 Lessons' },
        { number: '03', title: 'Device APIs & Storage', detail: 'Camera, GPS, and local persistence.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Cross-Platform Fitness App', description: 'Workout tracker with charts.', tags: ['React Native', 'Expo'] }
      ]
    };
  } else if (cat.includes('system') || cId.includes('system')) {
    return {
      badge: 'Advanced',
      themeColor: 'indigo' as const,
      iconName: 'GitBranch',
      duration: '9 Modules • 32 Hours',
      modulesCount: 9,
      skills: ['Microservices', 'System Design', 'Redis Caching', 'Kafka', 'DB Sharding', 'CDN', 'Rate Limiting'],
      modules: [
        { number: '01', title: 'System Design Foundations & CAP Theorem', detail: 'Latency, throughput, and availability.', lessons: '4 Lessons' },
        { number: '02', title: 'Load Balancing & Caching with Redis', detail: 'Cache invalidation and reverse proxies.', lessons: '5 Lessons' },
        { number: '03', title: 'Database Sharding & Microservices', detail: 'Partitioning keys and message queues.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'High-Throughput Rate Limiter', description: 'Redis-backed rate limiter for 50k req/sec.', tags: ['Redis', 'System Design'] }
      ]
    };
  } else {
    return {
      badge: 'Essential',
      themeColor: 'rose' as const,
      iconName: 'ShieldCheck',
      duration: '10 Modules • 38 Hours',
      modulesCount: 10,
      skills: ['Ethical Hacking', 'OWASP Top 10', 'Wireshark', 'Burp Suite', 'Nmap', 'Penetration Testing'],
      modules: [
        { number: '01', title: 'Network Reconnaissance with Nmap', detail: 'Port scanning and packet analysis.', lessons: '5 Lessons' },
        { number: '02', title: 'OWASP Top 10 Exploitation', detail: 'SQL Injection and XSS mitigation.', lessons: '5 Lessons' },
        { number: '03', title: 'API Security & Burp Suite', detail: 'Session hijacking and security audits.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Web Vulnerability Assessment', description: 'Security audit against OWASP top 10.', tags: ['Burp Suite', 'OWASP'] }
      ]
    };
  }
}

function useLiveCourses(): { courses: Course[]; loading: boolean } {
  const [liveCourses, setLiveCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        let res = await fetch(getApiUrl('/api/products')).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(getApiUrl('/api/courses')).catch(() => null);
        }
        if (!res || !res.ok) return;
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.products || data.courses || []);

        if (rawList && rawList.length > 0) {
          const coursesFromDb: Course[] = rawList.map((dbCourse: any) => {
            const meta = getCategoryDetails(dbCourse.category || '', dbCourse.id || '');
            const parsedModules = dbCourse.modules && Array.isArray(dbCourse.modules) && dbCourse.modules.length > 0
              ? dbCourse.modules.map((m: any, idx: number) => ({
                number: String(idx + 1).padStart(2, '0'),
                title: typeof m === 'string' ? m : m.title,
                detail: m.detail || '',
                lessons: m.lessons || '1 Lesson'
              }))
              : [];

            const parsedFaqs = dbCourse.faqs && Array.isArray(dbCourse.faqs) && dbCourse.faqs.length > 0
              ? dbCourse.faqs.map((f: any) => Array.isArray(f) ? f : [f.question || f[0] || '', f.answer || f[1] || ''] as [string, string]).filter(f => f[0] && f[1])
              : [];

            const parsedSkills = (dbCourse.features && Array.isArray(dbCourse.features) && dbCourse.features.length > 0)
              ? dbCourse.features
              : [];

            const parsedTestimonials = (dbCourse.testimonials && Array.isArray(dbCourse.testimonials) && dbCourse.testimonials.length > 0)
              ? dbCourse.testimonials.filter((t: any) => t && (t.comment || t.name))
              : undefined;

            const pInr = Number(dbCourse.priceInr ?? dbCourse.price_inr ?? 0);
            const origInr = Number(dbCourse.originalPriceInr ?? dbCourse.original_price_inr ?? pInr * 3);

            return {
              id: dbCourse.id,
              title: dbCourse.title,
              subtitle: dbCourse.subtitle || '',
              description: dbCourse.description || '',
              category: (dbCourse.category as any) || 'Course',
              level: 'Beginner to Advanced',
              price: pInr.toLocaleString('en-IN'),
              originalPrice: origInr.toLocaleString('en-IN'),
              duration: dbCourse.duration || (parsedModules.length > 0 ? `${parsedModules.length} Modules` : ''),
              modulesCount: parsedModules.length,
              iconName: meta.iconName || 'Terminal',
              themeColor: meta.themeColor || 'violet',
              badge: dbCourse.badge || undefined,
              skills: parsedSkills,
              modules: parsedModules,
              projects: [],
              faqs: parsedFaqs,
              bonus: dbCourse.bonus || undefined,
              installationProcess: dbCourse.installationProcess || dbCourse.installation_process || undefined,
              galleryImages: (dbCourse.galleryImages && Array.isArray(dbCourse.galleryImages) && dbCourse.galleryImages.length > 0)
                ? dbCourse.galleryImages
                : ((dbCourse.gallery_images && Array.isArray(dbCourse.gallery_images) && dbCourse.gallery_images.length > 0)
                  ? dbCourse.gallery_images
                  : (typeof dbCourse.gallery_images === 'string' ? JSON.parse(dbCourse.gallery_images) : undefined)),
              testimonials: parsedTestimonials,
              imageUrl: dbCourse.imageUrl || dbCourse.image_url || undefined,
              isPublished: dbCourse.isPublished !== undefined ? Boolean(dbCourse.isPublished) : (dbCourse.is_published !== undefined ? Boolean(dbCourse.is_published) : true),
            };
          });
          setLiveCourses(coursesFromDb);
        }
      } catch (err) {
        console.error('Failed to fetch live database courses:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  return { courses: liveCourses.length > 0 ? liveCourses : COURSES, loading: loading && liveCourses.length === 0 };
}

{/* DEDICATED COURSE DETAIL PAGE */ }
function CourseDetailPage({ cart: propCart, auth: propAuth }: { cart?: any; auth?: any }) {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [openModule, setOpenModule] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { courses: allCourses, loading } = useLiveCourses();
  const authLocal = useAuth();
  const auth = propAuth || authLocal;
  const cartLocal = useCart(auth.user, allCourses);
  const cart = propCart || cartLocal;

  const course = useMemo(() => {
    return allCourses.find((c) => c.id === params.id);
  }, [allCourses, params.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const queryState = new URLSearchParams(window.location.search).get('payment');
    if (queryState === 'success' || queryState === 'pending') setPaymentState('pending');
    if (queryState === 'cancelled') setPaymentState('cancelled');
    if (course) {
      trackViewContent({
        contentId: course.id,
        contentName: course.title,
        category: course.category,
        value: parseFloat(String(course.price || '0').replace(/[^0-9.]/g, '')),
        currency: 'INR',
      });
    }
  }, [params.id, course?.id]);

  if (loading && !course) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#090a10] px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs sm:text-sm md:text-base font-mono text-slate-400">Loading course curriculum...</p>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#090a10] px-6 text-center">
        <div>
          <p className="eyebrow text-[10px] sm:text-xs md:text-sm">Course Not Found</p>
          <h1 className="mt-4 font-display text-2xl sm:text-4xl md:text-5xl font-semibold text-slate-100">Course does not exist</h1>
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="mt-6 rounded-lg bg-violet-300 px-5 py-2.5 text-xs sm:text-sm md:text-base font-bold text-slate-950 cursor-pointer"
          >
            Return to All Courses
          </button>
        </div>
      </main>
    );
  }

  const IconComponent = getCourseIcon(course.iconName);
  const theme = getThemeClasses(course.themeColor);

  return (
    <div className="site-page min-h-[100dvh] bg-[#090a10]">
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={auth.user}
        onOpenAuthModal={auth.openAuth}
        onLogout={auth.logout}
        onOpenMyPurchases={() => auth.setIsPurchasesModalOpen(true)}
        cartCount={cart.cartItems.length}
        onOpenCart={() => cart.setIsCartOpen(true)}
      />

      <main className="pt-24 pb-24">
        {/* COURSE BREADCRUMB & TOP HEADER */}
        <section className="border-b border-slate-800/80 bg-[#0c0e17] py-8 sm:py-12 md:py-16">
          <div className="site-shell max-w-5xl">
            <button
              type="button"
              onClick={() => setLocation('/')}
              className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-mono-custom text-xs sm:text-sm text-slate-400 hover:border-slate-700 hover:text-white transition mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to All Courses
            </button>

            {/* FULL WIDTH RESPONSIVE IMAGE DIRECTLY ABOVE TITLE */}
            {course.imageUrl && (
              <div className="w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-[#07080e] p-1.5 mb-8 shadow-2xl shadow-violet-950/40 flex items-center justify-center">
                <img
                  src={getImageBanner(course.imageUrl, 1200)}
                  alt={course.title}
                  className="w-full h-auto max-h-[550px] object-contain rounded-xl bg-[#07080e] mx-auto block"
                  loading="eager"
                />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm md:text-base font-medium ${theme.badge}`}>
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {course.category}
                </span>
                {course.badge && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 font-mono-custom text-xs sm:text-sm md:text-base text-violet-300">
                    {course.badge}
                  </span>
                )}
                <span className="font-mono-custom text-xs sm:text-sm md:text-base text-slate-500">{course.level}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-100 leading-snug">
                {course.title}
              </h1>
              <p className="mt-3 text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-3xl">
                {course.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 font-mono-custom text-xs sm:text-sm md:text-base text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.accentText}`} /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.accentText}`} /> Instant Delivery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN DETAILS & STICKY BUY BOX GRID */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="site-shell grid gap-8 sm:gap-12 lg:grid-cols-[1fr_360px]">
            {/* LEFT COLUMN: ABOUT, SYLLABUS, PROJECTS, FAQS */}
            <div className="space-y-8 sm:space-y-12">
              {/* Overview / About This Product */}
              {(course.description || (course.skills && course.skills.length > 0)) && (
                <div className="rounded-2xl border border-slate-800/90 bg-[#0c0e17] p-5 sm:p-7 md:p-8 shadow-xl shadow-slate-950/20">
                  {course.description && (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="eyebrow text-[10px] sm:text-xs text-violet-400">Overview</span>
                      </div>
                      <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-100 mb-5">
                        About This Product
                      </h2>
                      <div className="space-y-4 text-xs sm:text-sm md:text-base leading-relaxed text-slate-300">
                        {course.description.split('\n').filter((line) => line.trim().length > 0).map((para, idx) => {
                          const trimmed = para.trim();
                          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
                          const cleanText = isBullet ? trimmed.replace(/^[•\-\*\d\.]+\s*/, '') : trimmed;

                          if (isBullet) {
                            return (
                              <div key={idx} className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                                <div className="mt-0.5 shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-300">
                                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </div>
                                <span className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                                  {cleanText}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <p key={idx} className="leading-relaxed sm:leading-7 text-slate-300">
                              {trimmed}
                            </p>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {course.skills && course.skills.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-800/80">
                      <h3 className="font-mono-custom text-xs sm:text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Key Features & Technologies
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {course.skills.map((skill) => (
                          <span key={skill} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 font-mono-custom text-xs sm:text-sm text-slate-200 hover:border-violet-500/40 hover:bg-slate-800/80 transition-all flex items-center gap-2 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Syllabus / Modules */}
              {course.modules && course.modules.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-[#0c0e17] p-5 sm:p-7 md:p-8">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                    <div>
                      <p className="eyebrow text-[10px] sm:text-xs md:text-sm">Product Content</p>
                      <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100">Product Content</h2>
                    </div>
                    <span className="font-mono-custom text-xs sm:text-sm md:text-base text-slate-500">{course.modulesCount} Contents</span>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {course.modules.map((mod: CourseModule, idx: number) => (
                      <div key={mod.number || idx} className="py-3">
                        <button
                          type="button"
                          onClick={() => setOpenModule(openModule === idx ? -1 : idx)}
                          className="flex w-full items-center justify-between py-3 text-left transition hover:text-violet-300 cursor-pointer gap-2"
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <span className={`font-mono-custom text-xs sm:text-sm md:text-base font-bold shrink-0 ${theme.accentText}`}>
                              {mod.number || String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-display text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-slate-200 truncate">
                              {mod.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/90 px-2 sm:px-2.5 py-1 font-mono-custom text-[10px] sm:text-xs md:text-sm text-slate-400">
                              <LockKeyhole size={12} className="text-amber-400" /> Locked
                            </span>
                            <ChevronDown size={18} className={`text-slate-500 transition-transform ${openModule === idx ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {openModule === idx && (
                          <div className="pb-4 pl-9 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed text-slate-400">
                            {mod.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Software Installation Guide (Only displays if filled by admin) */}
              {Boolean((course.installationProcess || (course as any).installation_process) && String(course.installationProcess || (course as any).installation_process).trim().length > 0) && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 sm:p-7 md:p-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-mono-custom text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-emerald-400" />Setup Guide
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-mono-custom font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Step-by-Step Instructions
                    </span>
                  </div>

                  <div className="font-mono text-xs sm:text-sm md:text-base lg:text-lg text-emerald-100 bg-[#070a14] border border-emerald-900/60 rounded-xl p-4 sm:p-5 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
                    {course.installationProcess || (course as any).installation_process}
                  </div>
                </div>
              )}

              {/* Product Photo Gallery (Only displays if image links exist) */}
              {(() => {
                const rawGallery = course.galleryImages || (course as any).gallery_images;
                const galleryList: string[] = Array.isArray(rawGallery)
                  ? rawGallery
                  : (typeof rawGallery === 'string' ? (JSON.parse(rawGallery || '[]') || []) : []);

                if (!galleryList || galleryList.length === 0) return null;
                const currentImg = selectedGalleryImg || galleryList[0];

                return (
                  <div className="rounded-2xl border border-cyan-500/30 bg-[#0c0e17] p-5 sm:p-7 md:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <p className="eyebrow text-[10px] sm:text-xs md:text-sm text-cyan-400">Visual Tour</p>
                        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100 flex items-center gap-2">
                          📸 Gallery
                        </h2>
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-mono-custom font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                        {galleryList.length} Photo{galleryList.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Main Featured Image Preview */}
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-[#07080e] aspect-video flex items-center justify-center shadow-xl">
                      <img
                        src={getImageBanner(currentImg, 1200)}
                        alt="Product Gallery Preview"
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                        onClick={() => { setSelectedGalleryImg(currentImg); setIsLightboxOpen(true); }}
                      />
                      <button
                        type="button"
                        onClick={() => { setSelectedGalleryImg(currentImg); setIsLightboxOpen(true); }}
                        className="absolute bottom-3 right-3 bg-slate-950/80 hover:bg-slate-900 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm md:text-base font-bold font-mono-custom px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                      >
                        <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Fullscreen View
                      </button>
                    </div>

                    {/* Thumbnails Strip */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                      {galleryList.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedGalleryImg(imgUrl)}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-[#07080e] ${currentImg === imgUrl
                            ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                            }`}
                        >
                          <img src={getImageThumbnail(imgUrl, 300)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>

                    {/* Fullscreen Lightbox Modal */}
                    {isLightboxOpen && selectedGalleryImg && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-in fade-in duration-200">
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(false)}
                          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2.5 bg-slate-900/80 rounded-full border border-slate-800 cursor-pointer transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <img
                          src={getImageBanner(selectedGalleryImg, 1800)}
                          alt="Fullscreen Product View"
                          className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-cyan-500/30"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
              {course.bonus && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-7 md:p-8">
                  <div className="flex items-center gap-2 text-amber-300 font-mono-custom text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider mb-2">
                    🎁 Special Bonus Included
                  </div>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-slate-100 leading-relaxed">
                    {course.bonus}
                  </p>
                </div>
              )}

              {/* Testimonials */}
              {course.testimonials && course.testimonials.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-[#0c0e17] p-5 sm:p-7 md:p-8">
                  <p className="eyebrow text-[10px] sm:text-xs md:text-sm">Student Reviews</p>
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100 mb-6">What Customers Say</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {course.testimonials.map((t) => (
                      <div key={t.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 italic leading-relaxed">"{t.comment}"</p>
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="font-display text-xs sm:text-sm md:text-base font-semibold text-slate-100">{t.name}</span>
                          <span className="text-amber-400 text-xs sm:text-sm font-mono-custom">★★★★★</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course-Specific FAQs */}
              {course.faqs && course.faqs.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-[#0c0e17] p-5 sm:p-7 md:p-8">
                  <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-100 mb-4">Course FAQ</h2>
                  <div className="divide-y divide-slate-800 border-y border-slate-800">
                    {course.faqs.map(([q, a], idx) => (
                      <div key={q}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                          className="flex w-full items-center justify-between py-4 text-left text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-slate-200 hover:text-violet-300 transition-colors cursor-pointer gap-2"
                        >
                          <span>{q}</span>
                          <ChevronDown size={17} className={`text-slate-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-violet-400' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {openFaq === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden transform-gpu"
                            >
                              <p className="pb-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed text-slate-400">{a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY PRICING & BUY CARD */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-violet-400/30 bg-[#0c0e18] p-5 sm:p-7 shadow-2xl shadow-violet-950/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-custom text-xs sm:text-sm uppercase text-violet-300">Enrollment Open</span>
                  <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 font-mono-custom text-[10px] sm:text-xs md:text-sm text-emerald-300">
                    Instant Access
                  </span>
                </div>

                <div className="mt-5 flex items-baseline gap-2.5">
                  <span className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100">₹{course.price}</span>
                  <span className="font-mono-custom text-xs sm:text-sm md:text-base text-slate-500 line-through">₹{course.originalPrice}</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm md:text-base text-slate-400">One-time payment • Lifetime product access</p>

                <div className="my-6 h-px bg-slate-800/80" />

                <div className="space-y-3 text-xs sm:text-sm md:text-base text-slate-300 mb-6">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-cyan-300 shrink-0 w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span>
                      {course.category === 'Course' && course.modulesCount > 0
                        ? `Complete ${course.modulesCount} modules curriculum`
                        : 'Instant access to full product files'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-cyan-300 shrink-0 w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span>
                      {course.category === 'Course'
                        ? 'Hands-on projects & source code'
                        : 'Complete assets, source code & documentation'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-cyan-300 shrink-0 w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span>Lifetime access & free future updates</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="text-cyan-300 shrink-0 w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span>100% Verified Razorpay secure checkout</span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                  {/* Primary Buy Now Button */}
                  <div className="w-full">
                    <CheckoutButton course={course} courseId={course.id} onAddToCart={cart.addToCart} label="Buy Now & Get Access" onState={setPaymentState} />
                  </div>

                  {/* Secondary Add to Cart Button Below */}
                  <button
                    type="button"
                    onClick={() => {
                      if (cart.isInCart(course.id)) {
                        cart.removeFromCart(course.id);
                      } else {
                        cart.addToCart(course);
                      }
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl border font-bold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${cart.isInCart(course.id)
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-violet-500/50 hover:bg-slate-800'
                      }`}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {cart.isInCart(course.id) ? 'Remove from Cart' : 'Add to Cart'}
                  </button>
                </div>

                <p className="mt-4 text-center font-mono-custom text-[10px] sm:text-xs md:text-sm text-slate-500">
                  <LockKeyhole size={11} className="inline mr-1" /> 256-bit SSL encrypted checkout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE STICKY BOTTOM BUY BAR */}
        <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-3 border-t border-slate-800/90 bg-[#090b14]/95 px-4 py-3 backdrop-blur-md lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-100">₹{course.price}</span>
              <span className="font-mono-custom text-xs sm:text-sm text-slate-500 line-through">₹{course.originalPrice}</span>
            </div>
            <span className="font-mono-custom text-[10px] sm:text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={11} /> Instant Access
            </span>
          </div>
          <div className="flex-1 max-w-[170px] sm:max-w-xs">
            <CheckoutButton course={course} courseId={course.id} onAddToCart={cart.addToCart} label="Get Access" onState={setPaymentState} className="text-xs sm:text-sm md:text-base px-4 py-2.5 min-h-10 font-bold" />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/70 py-8 pb-24 lg:pb-8 bg-[#08090e]">
        <div className="site-shell flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-custom text-xs text-slate-500">
          <Brand onClick={() => setLocation('/')} />
          <p>© 2026 SKILL VAULT STORE • ALL RIGHTS RESERVED</p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/theskillvaults/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Instagram"
              title="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61593149424859"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Facebook"
              title="Follow us on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

      <PaymentNotice state={paymentState} setState={setPaymentState} />
      <AnimatePresence mode="wait">
        {auth.isAuthModalOpen && (
          <AuthModal
            isOpen={auth.isAuthModalOpen}
            onClose={() => auth.setIsAuthModalOpen(false)}
            onSuccess={auth.loginSuccess}
            initialMode={auth.authModalMode}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {cart.isCartOpen && (
          <CartDrawer
            isOpen={cart.isCartOpen}
            onClose={() => cart.setIsCartOpen(false)}
            items={cart.cartItems}
            onRemoveItem={cart.removeFromCart}
            onClearCart={cart.clearCart}
            onCheckout={(courseId) => {
              cart.setIsCartOpen(false);
              setLocation(courseId ? `/checkout?courseId=${courseId}` : '/checkout');
            }}
          />
        )}
      </AnimatePresence>
      <AuthNoticeBanner message={auth.authNotice} onClose={() => auth.setAuthNotice('')} />
    </div>
  );
}

{/* HOME CATALOG PAGE */ }
function PlatformCatalog({ cart: propCart, auth: propAuth }: { cart?: any; auth?: any }) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const { courses: liveCoursesList, loading: coursesLoading } = useLiveCourses();
  const allCourses = useMemo(() => (liveCoursesList && liveCoursesList.length > 0 ? liveCoursesList : COURSES), [liveCoursesList]);
  const authLocal = useAuth();
  const auth = propAuth || authLocal;
  const cartLocal = useCart(auth.user, allCourses);
  const cart = propCart || cartLocal;

  useEffect(() => {
    const queryState = new URLSearchParams(window.location.search).get('payment');
    if (queryState === 'success' || queryState === 'pending') setPaymentState('pending');
    if (queryState === 'cancelled') setPaymentState('cancelled');
  }, []);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const catLower = (course.category || '').toLowerCase();
      const selLower = (selectedCategory || '').toLowerCase();

      const nonCourseTypes = ['software', 'game', 'notes', 'hacks', 'blog'];
      const matchesCategory =
        selLower === 'all products' ||
        selLower === 'all courses' ||
        catLower === selLower ||
        (selLower === 'course' && !nonCourseTypes.includes(catLower));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.skills.some(s => s.toLowerCase().includes(q));
      return course.isPublished !== false && matchesCategory && matchesSearch;
    });
  }, [allCourses, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCourses, startIndex]);

  return (
    <div className="site-page min-h-[100dvh]" id="top">
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        user={auth.user}
        onOpenAuthModal={auth.openAuth}
        onLogout={auth.logout}
        onOpenMyPurchases={() => auth.setIsPurchasesModalOpen(true)}
        cartCount={cart.cartItems.length}
        onOpenCart={() => cart.setIsCartOpen(true)}
      />

      <main>
        {/* HERO SECTION */}
        <section className="relative isolate min-h-[640px] overflow-hidden border-b border-slate-800/70 pt-28 sm:pt-36" aria-labelledby="hero-title">
          <div className="grid-fade absolute inset-0 -z-10 opacity-60" />
          <div className="hero-orb absolute -right-48 top-20 -z-10 size-[620px] rounded-full" />
          <div className="cyan-orb absolute -left-60 top-[380px] -z-10 size-[520px] rounded-full" />

          <div className="site-shell relative pb-20 text-center">
            <div className="mx-auto max-w-4xl">
              <div className="fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/5 px-4 py-1.5 font-mono-custom text-[11px] text-violet-200">
                <span className="size-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_hsl(269_100%_72%)]" />
                SKILL VAULT & DIGITAL ASSETS HUB
              </div>

              <h1 id="hero-title" className="hero-title fade-up delay-1 font-display text-[clamp(1.65rem,5vw,5.2rem)] font-bold leading-[1.1] sm:leading-[1.05] tracking-[-0.03em] sm:tracking-[-0.04em] text-slate-100">
                All-in-One Vault to <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  Learn Tech Skills & Access Digital Assets.
                </span>
              </h1>

              <p className="fade-up delay-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-400">
                High-impact video courses, developer software tools, cybersecurity toolkits, game packs, and study notes. Everything you need to learn, build, and scale.
              </p>

              {/* SEARCH & FILTER BAR */}
              <div className="fade-up delay-3 mx-auto mt-9 max-w-xl">
                <div className="relative flex items-center rounded-xl border border-slate-700/80 bg-[#0e101a] p-2 shadow-2xl focus-within:border-violet-400/50">
                  <Search size={18} className="ml-3 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets (e.g., Android Security, Full Stack, Software, Hacks, Notes)..."
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mr-2 rounded-md p-1 text-slate-500 hover:text-slate-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 font-mono-custom text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Award size={15} className="text-violet-300" /> Premium Digital Assets & Courses
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-cyan-300" /> Verified Razorpay Checkout
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={15} className="text-emerald-300" /> Instant Delivery & Lifetime Access
                </span>
              </div>
            </div>
          </div>
        </section>



        {/* COURSE CATALOG GRID */}
        <section id="catalog" className="py-16 sm:py-24">
          <div className="site-shell">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
              <div>
                <p className="eyebrow">Explore Digital Assets</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100">
                  {selectedCategory === 'All Products' || selectedCategory === 'All Courses' ? 'All Digital Assets' : selectedCategory}
                </h2>
              </div>
              <p className="font-mono-custom text-xs text-slate-500">
                Showing {filteredCourses.length} asset{filteredCourses.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* MOBILE-FRIENDLY CATEGORY FILTER PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${selectedCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 border border-violet-500/50'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0b0d14] p-12 text-center">
                <BookMarked size={36} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-display text-lg font-semibold text-slate-200">No matching assets found</h3>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your search query or selecting another category.</p>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('All Products'); setSearchQuery(''); }}
                  className="mt-5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerAnimation}
                  initial="initial"
                  animate="animate"
                  viewport={{ once: true }}
                >
                  {paginatedCourses.map((course, index) => {
                    const IconComponent = getCourseIcon(course.iconName);
                    const theme = getThemeClasses(course.themeColor);

                    return (
                      <motion.div
                        key={course.id}
                        variants={listItemAnimation}
                      >
                        <AnimatedCard
                          hover="lift"
                          delay={index * 0.05}
                          onClick={(e) => {
                            // Avoid trigger if child button/link was clicked
                            if ((e.target as HTMLElement).closest('button, a')) return;
                            setLocation(`/course/${course.id}`);
                          }}
                          className={`group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#0c0e17] p-5 card-hover-effect pop-in ${theme.borderHover} hover:shadow-2xl hover:shadow-violet-950/30 cursor-pointer`}
                        >
                          <div>
                            {/* Full Width Top Image */}
                            {course.imageUrl && (
                              <div className="-mx-5 -mt-5 mb-4 overflow-hidden border-b border-slate-800/90 bg-[#07080e] rounded-t-2xl aspect-video">
                                <img
                                  src={getImageThumbnail(course.imageUrl, 600)}
                                  alt={course.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${theme.badge}`}>
                                <IconComponent size={13} /> {course.category}
                              </span>
                              {course.badge && (
                                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-0.5 font-mono-custom text-[10px] text-violet-300">
                                  {course.badge}
                                </span>
                              )}
                            </div>

                            {/* Title & Subtitle */}
                            <h3 className="font-display text-xl font-semibold text-slate-100 group-hover:text-violet-200 transition leading-snug">
                              {course.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {course.subtitle}
                            </p>
                          </div>

                          {/* Footer Info & Actions */}
                          <div className="mt-4 border-t border-slate-800/80 pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-2xl font-bold text-slate-100">₹{course.price}</span>
                                <span className="font-mono-custom text-xs text-slate-500 line-through">₹{course.originalPrice}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <motion.button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cart.isInCart(course.id)) {
                                    cart.removeFromCart(course.id);
                                  } else {
                                    cart.addToCart(course);
                                  }
                                }}
                                className={`inline-flex min-h-10 items-center justify-center rounded-lg border font-bold text-xs transition-all gap-1.5 cursor-pointer ${cart.isInCart(course.id)
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                  : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-violet-500/50 hover:text-white'
                                  }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                {cart.isInCart(course.id) ? 'In Cart' : 'Add to Cart'}
                              </motion.button>
                              <CheckoutButton course={course} courseId={course.id} onAddToCart={cart.addToCart} label="Buy Now" onState={setPaymentState} />
                            </div>
                          </div>
                        </AnimatedCard>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* PAGINATION CONTROLS BAR */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
                    <p className="font-mono-custom text-xs text-slate-500">
                      Showing <span className="font-semibold text-slate-300">{startIndex + 1}</span> to <span className="font-semibold text-slate-300">{Math.min(startIndex + ITEMS_PER_PAGE, filteredCourses.length)}</span> of <span className="font-semibold text-slate-300">{filteredCourses.length}</span> assets
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={15} /> Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNum);
                            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`size-8 rounded-lg text-xs font-mono-custom font-semibold transition cursor-pointer ${currentPage === pageNum
                            ? 'bg-violet-300 text-slate-950 font-bold shadow-md shadow-violet-950/40'
                            : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                            }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* WHY SKILL VAULT SECTION */}
        <section id="why-us" className="border-t border-slate-800/70 py-20 sm:py-28 bg-[#0a0b12]">
          <div className="site-shell">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">The Skill Vault Advantage</p>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-slate-100">
                Built for Developers Who Learn by Shipping
              </h2>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Project-First Learning', text: 'No endless slides. Build real products, APIs, and microservices.', icon: Terminal },
                { title: 'Zero Fluff Modules', text: 'Curriculum designed directly around in-demand tech company roles.', icon: Braces },
                { title: 'Lifetime Access', text: 'Instant access to all current and future updates to course material.', icon: BookOpen },
                { title: 'Secure Instant Delivery', text: 'Razorpay integration with instant course access sent to your email.', icon: LockKeyhole },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-[#0d0f19] p-6">
                  <div className="mb-4 grid size-10 place-items-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-300">
                    <item.icon size={18} />
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-200">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="border-t border-slate-800/70 py-20 sm:py-28">
          <div className="site-shell grid gap-12 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <p className="eyebrow">Frequently Asked Questions</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-100">
                Got Questions?
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-slate-400">
                Everything you need to know about Skill Vault platform, digital assets, purchasing, and instant delivery.
              </p>
            </div>

            <div className="divide-y divide-slate-800 border-y border-slate-800">
              {[
                ['What is Skill Vault?', 'Skill Vault is a digital asset store and learning platform offering premium digital products, source codes, tech courses, and development tools with instant access.'],
                ['How do I purchase and access assets on Skill Vault?', 'Simply select the asset or course you want, click Buy Now or Enroll, and complete checkout. Your access links and downloads are instantly generated on screen and emailed to you.'],
                ['Will I get instant access after payment?', 'Yes! Access is 100% automated. Immediately after a successful payment on Razorpay, your download links are unlocked on your receipt page and sent to your email address.'],
                ['Do I need to create an account before buying?', 'No separate account setup is required! Just provide your valid email during checkout, and your purchase will be automatically linked to your email.'],
                ['What payment methods are supported?', 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Wallets through secure Razorpay payment gateway.'],
                ['Is my payment safe and secure?', 'Yes, absolutely. All transactions are protected with industry-standard 256-bit SSL encryption processed via Razorpay. We do not store any card or UPI credentials.'],
                ['What if I do not receive my email after payment?', 'Check your email Spam or Promotions folder first. If you still cannot locate it, contact our support team with your payment transaction ID for instant assistance.'],
                ['Can I access my purchased assets on multiple devices?', 'Yes, your access links can be opened on mobile phones, tablets, laptops, or desktops anytime you need them.'],
                ['How can I contact Skill Vault support for help?', 'You can reach out to our dedicated support team via the Contact Us section or support email listed at the bottom of the page.']
              ].map(([q, a], idx) => (
                <div key={q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="flex w-full items-center justify-between py-5 text-left text-sm font-semibold text-slate-200 hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    <span>{q}</span>
                    <ChevronDown size={17} className={`text-slate-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-violet-400' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden transform-gpu"
                      >
                        <p className="pb-5 text-xs sm:text-sm leading-relaxed text-slate-400">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/70 py-8 bg-[#08090e]">
        <div className="site-shell flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-custom text-xs text-slate-500">
          <Brand onClick={() => smoothScrollTo('#top')} />
          <p>© 2026 SKILL VAULT STORE • ALL RIGHTS RESERVED</p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/theskillvaults/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Instagram"
              title="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61593149424859"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Facebook"
              title="Follow us on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

      {/* Payment Notice Notification */}
      <PaymentNotice state={paymentState} setState={setPaymentState} />
      <AnimatePresence mode="wait">
        {auth.isAuthModalOpen && (
          <AuthModal
            isOpen={auth.isAuthModalOpen}
            onClose={() => auth.setIsAuthModalOpen(false)}
            onSuccess={auth.loginSuccess}
            initialMode={auth.authModalMode}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {cart.isCartOpen && (
          <CartDrawer
            isOpen={cart.isCartOpen}
            onClose={() => cart.setIsCartOpen(false)}
            items={cart.cartItems}
            onRemoveItem={cart.removeFromCart}
            onClearCart={cart.clearCart}
            onCheckout={(courseId) => {
              cart.setIsCartOpen(false);
              setLocation(courseId ? `/checkout?courseId=${courseId}` : '/checkout');
            }}
          />
        )}
      </AnimatePresence>
      <AuthNoticeBanner message={auth.authNotice} onClose={() => auth.setAuthNotice('')} />
    </div>
  );
}

import AdminPanelPage from './pages/admin-panel';

function Router() {
  const [, setLocation] = useLocation();
  const { courses: liveCoursesList } = useLiveCourses();
  const allCourses = useMemo(() => (liveCoursesList && liveCoursesList.length > 0 ? liveCoursesList : COURSES), [liveCoursesList]);
  const auth = useAuth();
  const cart = useCart(auth.user, allCourses);

  return (
    <>
      <MetaPixelTracker user={auth.user} />
      <Switch>
        <Route path="/canva">
          {() => <CanvaPage cart={cart} auth={auth} />}
        </Route>
        <Route path="/canva-pro">
          {() => <CanvaPage cart={cart} auth={auth} />}
        </Route>
        <Route path="/canva/admin" component={AdminPanelPage} />
        <Route path="/admin" component={AdminPanelPage} />
        <Route path="/admin-panel" component={AdminPanelPage} />
        <Route path="/course/:id">
          {() => <CourseDetailPage cart={cart} auth={auth} />}
        </Route>
        <Route path="/checkout">
          {() => (
            <CheckoutPage
              user={auth.user}
              onLogout={auth.logout}
              onOpenAuthModal={auth.openAuth}
              cartItems={cart.cartItems}
              onAddToCart={cart.addToCart}
              onRemoveCartItem={cart.removeFromCart}
              onClearCart={cart.clearCart}
            />
          )}
        </Route>
        <Route path="/purchases">
          {() => (
            <PurchasesPage
              user={auth.user}
              onLogout={auth.logout}
              purchases={auth.purchases}
              loading={auth.loading}
            />
          )}
        </Route>
        <Route path="/my-purchases">
          {() => (
            <PurchasesPage
              user={auth.user}
              onLogout={auth.logout}
              purchases={auth.purchases}
              loading={auth.loading}
            />
          )}
        </Route>
        <Route path="/payment-success">
          {() => (
            <PaymentSuccessPage
              user={auth.user}
              onOpenMyPurchases={() => setLocation('/purchases')}
            />
          )}
        </Route>
        <Route path="/payment-failed" component={PaymentFailedPage} />
        <Route path="/">
          {() => <PlatformCatalog cart={cart} auth={auth} />}
        </Route>
        <Route component={NotFound} />
      </Switch>

      <AnimatePresence mode="wait">
        {cart.isCartOpen && (
          <CartDrawer
            isOpen={cart.isCartOpen}
            onClose={() => cart.setIsCartOpen(false)}
            items={cart.cartItems}
            onRemoveItem={cart.removeFromCart}
            onClearCart={cart.clearCart}
            onCheckout={() => {
              cart.setIsCartOpen(false);
              setLocation('/checkout');
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {auth.isAuthModalOpen && (
          <AuthModal
            isOpen={auth.isAuthModalOpen}
            onClose={() => auth.setIsAuthModalOpen(false)}
            onSuccess={auth.loginSuccess}
            initialMode={auth.authModalMode}
          />
        )}
      </AnimatePresence>
      <AuthNoticeBanner message={auth.authNotice} onClose={() => auth.setAuthNotice('')} />
    </>
  );
}

function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#090a10] px-6 text-center">
      <motion.div {...fadeInUp}>
        <p className="eyebrow">404 / route not found</p>
        <h1 className="mt-5 font-display text-5xl font-semibold text-slate-100">Page Not Found</h1>
        <AnimatedButton
          onClick={() => setLocation('/')}
          data-testid="button-return-home"
          className="mt-8 rounded-lg bg-violet-300 px-5 py-3 text-sm font-bold text-slate-950"
        >
          Return to Skill Vault Catalog
        </AnimatedButton>
      </motion.div>
    </main>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function RevokedAccessModal() {
  const [isOpen, setIsOpen] = useState(() => {
    return window.location.search.includes('revoked=true');
  });

  const handleClose = () => {
    setIsOpen(false);
    // Remove ?revoked=true from URL cleanly without reloading
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0d0f19] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative border-t-2 border-t-rose-500">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white">Account Access Revoked</h3>
            <p className="text-xs text-rose-300 font-medium">
              Your 24/7 active session has been terminated by Administrator.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-300 leading-relaxed">
            <p>🔒 <strong>Access Status:</strong> <span className="text-rose-400 font-bold">DISABLED / REVOKED</span></p>
            <p className="text-slate-400 text-[11px]">
              Aapka account access Administrator dwara disable kar diya gaya hai. Aapko har ek device se automatic logout kar diya gaya hai.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthHeartbeatListener() {
  useEffect(() => {
    const checkSessionHeartbeat = async () => {
      const userToken = localStorage.getItem('sv_user_token');
      if (!userToken) return;

      try {
        const res = await fetch(getApiUrl('/api/auth/heartbeat'), {
          headers: { Authorization: `Bearer ${userToken}` }
        });

        if (!res.ok || res.status === 401 || res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.sessionRevoked || !res.ok) {
            console.warn('🔒 [SESSION REVOKED]: Account access disabled by Administrator.');
            localStorage.removeItem('sv_user_token');
            localStorage.removeItem('sv_user_data');
            localStorage.removeItem('sv_user');

            const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
            window.location.href = `${baseUrl}/?revoked=true`;
          }
        }
      } catch (err) { }
    };

    checkSessionHeartbeat();
    const interval = setInterval(checkSessionHeartbeat, 3000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export default function App() {
  useEffect(() => {
    // Pre-warm backend API to wake up Render on user visit
    fetch(getApiUrl('/api/health')).catch(() => { });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimationProvider mode="wait">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthHeartbeatListener />
            <RevokedAccessModal />
            <RoutedErrorBoundary>
              <Router />
            </RoutedErrorBoundary>
          </WouterRouter>
          <Toaster />
        </AnimationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}