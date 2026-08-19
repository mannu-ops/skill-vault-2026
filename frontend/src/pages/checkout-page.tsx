import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Sparkles,
  Clock,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Trash2,
  Gift,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { Course } from '@/data/courses';
import { getApiUrl } from '@/config';
import { PaymentSuccessModal } from '@/components/payment-success-modal';

interface CheckoutPageProps {
  user: any;
  onLogout?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'signup') => void;
  cartItems: Course[];
  onAddToCart: (course: Course) => void;
  onRemoveCartItem: (id: string) => void;
  onClearCart: () => void;
}

// Fallback Bonus Offer Config
const DEFAULT_BONUS_ASSET: Course = {
  id: 'bonus-vip-toolkit',
  title: 'Add VIP Developer Toolkit & Cheat-Sheets',
  subtitle: 'VIP Developer Toolkit',
  category: 'Software & Tools',
  price: '149',
  originalPrice: '999',
  level: 'Beginner to Advanced',
  duration: 'Instant Access',
  modulesCount: 1,
  iconName: 'Gift',
  themeColor: 'amber',
  rating: 4.9,
  students: '5,000+',
  skills: ['VIP Tools', 'Cheat-Sheets', 'Source Code'],
  description: 'Unlock 50+ scripts, cheat-sheets & tools for just ₹149 extra.',
  imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=300',
  modules: [],
  projects: [],
  faqs: []
};

export function CheckoutPage({
  user,
  onLogout,
  onOpenAuthModal,
  cartItems,
  onAddToCart,
  onRemoveCartItem,
  onClearCart
}: CheckoutPageProps) {
  const [, setLocation] = useLocation();

  // Helper to extract courseId from location search or full URL
  const getDirectCourseId = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let id = searchParams.get('courseId') || searchParams.get('id') || searchParams.get('productId');
      if (!id && typeof window !== 'undefined' && window.location.href.includes('courseId=')) {
        const match = window.location.href.match(/courseId=([^&]+)/);
        if (match) id = decodeURIComponent(match[1]);
      }
      return id;
    } catch {
      return null;
    }
  };

  const directCourseId = getDirectCourseId();

  const [loading, setLoading] = useState(true);

  // Bonus Offer config state (Dynamic from Admin Panel - Up to 3 multiple bonus offers)
  const [bonusAssets, setBonusAssets] = useState<Course[]>([]);
  const [selectedBonusIds, setSelectedBonusIds] = useState<string[]>([]);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [bonusLoaded, setBonusLoaded] = useState(false);

  // Payment Processing & Success Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPaymentId, setSuccessPaymentId] = useState('');
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Buyer Contact Details State
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      if (user.name) setBuyerName(user.name);
      if (user.email) setBuyerEmail(user.email);
      if (user.phone) setBuyerPhone(user.phone);
    }
  }, [user]);

  const [directCourseItem, setDirectCourseItem] = useState<Course | null>(null);

  // Fetch Admin Bonus Offer settings & direct course details
  useEffect(() => {
    const fetchCheckoutData = async () => {
      setLoading(true);
      try {
        // Fetch dynamic bonus product(s) configured by Admin
        const bonusRes = await fetch(getApiUrl('/api/bonus-product'));
        if (bonusRes.ok) {
          const bData = await bonusRes.json();
          let rawList: any[] = [];
          if (Array.isArray(bData.bonuses) && bData.bonuses.length > 0) {
            rawList = bData.bonuses;
          } else if (Array.isArray(bData) && bData.length > 0) {
            rawList = bData;
          } else if (bData && typeof bData === 'object' && (bData.title || bData.id)) {
            rawList = [bData];
          }

          const activeList = rawList
            .filter((item) => item && (item.enabled === true || item.enabled === 'true'))
            .map((bItem, idx) => ({
              id: bItem.id || `bonus-offer-${idx + 1}`,
              title: bItem.title || DEFAULT_BONUS_ASSET.title,
              subtitle: bItem.subtitle || 'VIP Developer Toolkit',
              category: bItem.category || DEFAULT_BONUS_ASSET.category,
              price: String(bItem.price || '149'),
              originalPrice: String(bItem.originalPrice || '999'),
              level: 'Beginner to Advanced' as const,
              duration: 'Instant Access',
              modulesCount: 1,
              iconName: 'Gift',
              themeColor: 'amber' as const,
              rating: 4.9,
              students: '5,000+',
              skills: ['VIP Tools', 'Cheat-Sheets'],
              description: bItem.description || DEFAULT_BONUS_ASSET.description,
              imageUrl: bItem.imageUrl || DEFAULT_BONUS_ASSET.imageUrl,
              driveUrl: bItem.driveUrl || bItem.drive_url || '',
              modules: [],
              projects: [],
              faqs: []
            }));

          setBonusAssets(activeList);
          setBonusEnabled(activeList.length > 0);
        }

        const urlId = getDirectCourseId();
        if (urlId) {
          const res = await fetch(getApiUrl('/api/courses'));
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.products || data.courses || []);
            const found = list.find((c: any) => String(c.id).toLowerCase() === String(urlId).toLowerCase());
            if (found) {
              const formattedItem: Course = {
                ...found,
                id: found.id,
                title: found.title,
                subtitle: found.subtitle || '',
                description: found.description || '',
                category: found.category || 'Digital Product',
                level: 'Beginner to Advanced',
                price: String(found.price || found.priceInr || found.price_inr || '299'),
                originalPrice: String(found.originalPrice || found.originalPriceInr || found.original_price_inr || '999'),
                duration: found.duration || 'Lifetime Access',
                modulesCount: (found.modules && Array.isArray(found.modules)) ? found.modules.length : 1,
                iconName: 'Sparkles',
                themeColor: 'violet',
                skills: found.features || ['Instant Access'],
                modules: found.modules || [],
                projects: [],
                faqs: found.faqs || []
              };
              setDirectCourseItem(formattedItem);
            }
          }
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
      } finally {
        setBonusLoaded(true);
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, []);

  const handleRemoveItem = (itemId: string) => {
    setRemovedItemIds((prev) => [...prev, itemId]);
    setSelectedBonusIds((prev) => prev.filter((id) => id !== itemId));
    if (directCourseItem && String(directCourseItem.id).toLowerCase() === String(itemId).toLowerCase()) {
      setDirectCourseItem(null);
    }
    onRemoveCartItem(itemId);
  };

  // Single source of truth for base items:
  // If user tapped direct "Buy Now" (?courseId=...), ONLY checkout that direct item!
  // If user proceeded from Shopping Cart Drawer (/checkout), checkout cart items.
  const baseItems = useMemo(() => {
    const urlId = getDirectCourseId();
    let raw: Course[] = [];

    if (urlId && directCourseItem) {
      raw = [directCourseItem];
    } else if (cartItems.length > 0) {
      raw = cartItems;
    } else if (directCourseItem) {
      raw = [directCourseItem];
    }

    return raw.filter((item) => item && !removedItemIds.includes(item.id));
  }, [directCourseItem, cartItems, removedItemIds]);
  // Available bonus offers (excluding items already in base cart)
  const availableBonusOffers = useMemo(() => {
    if (!bonusLoaded || !bonusEnabled || bonusAssets.length === 0) return [];
    return bonusAssets.filter((bAsset) => {
      const isAlreadyInCart = baseItems.some((item) => {
        if (!item || !bAsset) return false;
        const itemId = String(item.id || '').toLowerCase().trim();
        const bonusId = String(bAsset.id || '').toLowerCase().trim();
        const itemTitle = String(item.title || '').toLowerCase().trim();
        const bonusTitle = String(bAsset.title || '').toLowerCase().trim();
        return (itemId && bonusId && itemId === bonusId) || (itemTitle && bonusTitle && itemTitle === bonusTitle);
      });
      return !isAlreadyInCart;
    });
  }, [bonusLoaded, bonusEnabled, bonusAssets, baseItems]);

  const toggleBonusSelection = (bId: string) => {
    if (selectedBonusIds.includes(bId)) {
      setSelectedBonusIds(selectedBonusIds.filter((id) => id !== bId));
    } else {
      setSelectedBonusIds([...selectedBonusIds, bId]);
    }
  };

  const selectedBonusItems = useMemo(() => {
    return availableBonusOffers.filter((b) => selectedBonusIds.includes(b.id));
  }, [availableBonusOffers, selectedBonusIds]);

  // Single source of truth for items to checkout: baseItems + selected Bonus Assets
  const itemsToCheckout: Course[] = useMemo(() => {
    const combined = [...baseItems];
    selectedBonusItems.forEach((bItem) => {
      if (!combined.some((c) => String(c.id).toLowerCase() === String(bItem.id).toLowerCase())) {
        combined.push(bItem);
      }
    });
    return combined;
  }, [baseItems, selectedBonusItems]);

  // Calculate pricing
  const rawSubtotal = itemsToCheckout.reduce((sum, item: any) => {
    const rawVal = item?.price ?? item?.priceInr ?? item?.price_inr ?? '299';
    const p = parseFloat(String(rawVal).replace(/[^0-9.]/g, '')) || 0;
    return sum + p;
  }, 0);
  const finalTotal = Math.max(0, Math.round(rawSubtotal));

  // Helper to load Razorpay SDK dynamically
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Direct Razorpay Payment Redirect or Standard Razorpay Popup Modal
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (itemsToCheckout.length === 0) {
      setPaymentError('Your cart is empty. Please add assets before checking out.');
      return;
    }

    if (!buyerEmail || !buyerEmail.includes('@')) {
      setPaymentError('Please enter a valid Email Address so we can send your access link.');
      return;
    }

    if (!buyerPhone || buyerPhone.trim().length < 5) {
      setPaymentError('Please enter a valid Mobile/WhatsApp number.');
      return;
    }

    setIsProcessing(true);

    const userToken = localStorage.getItem('sv_user_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userToken) {
      authHeaders['Authorization'] = `Bearer ${userToken}`;
    }

    try {
      const effectiveCustomerName = (buyerName && buyerName.trim()) || (buyerEmail ? buyerEmail.split('@')[0] : 'Learner');

      // 1. Send items, customer contact details & coupon to backend create-order API
      const res = await fetch(getApiUrl('/api/checkout/create-order'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          items: itemsToCheckout,
          customerName: effectiveCustomerName,
          customerEmail: buyerEmail.trim(),
          customerPhone: buyerPhone.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initiate checkout order');
      }
      const data = await res.json();

      // If Razorpay API credentials are set, open standard Razorpay Popup!
      if (!data.isFallback && data.orderId && data.keyId) {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'Skill Vault Store',
          description: `Order Checkout (${itemsToCheckout.length} Item${itemsToCheckout.length > 1 ? 's' : ''})`,
          order_id: data.orderId,
          prefill: {
            name: effectiveCustomerName,
            email: buyerEmail.trim(),
            contact: buyerPhone.trim(),
          },
          theme: {
            color: '#7c3aed',
          },
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const verifyRes = await fetch(getApiUrl('/api/checkout/verify-payment'), {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  items: itemsToCheckout,
                  customerName: effectiveCustomerName,
                  customerEmail: buyerEmail.trim(),
                  customerPhone: buyerPhone.trim(),
                }),
              });

              const verifyData = await verifyRes.json().catch(() => ({}));

              if (verifyRes.ok && verifyData.success) {
                // Selectively remove ONLY purchased items from cart
                itemsToCheckout.forEach((purchasedItem) => {
                  if (purchasedItem && purchasedItem.id) {
                    onRemoveCartItem(purchasedItem.id);
                  }
                });
                const payId = response.razorpay_payment_id || `pay_${Date.now()}`;
                const driveParam = verifyData.driveUrl ? `&driveUrl=${encodeURIComponent(verifyData.driveUrl)}` : '';
                setLocation(`/payment-success?payment_id=${encodeURIComponent(payId)}&email=${encodeURIComponent(buyerEmail.trim())}&amount=${finalTotal}${driveParam}`);
              } else {
                const errorMsg = verifyData.error || 'Payment verification failed on server.';
                const payId = response.razorpay_payment_id || '';
                setLocation(`/payment-failed?payment_id=${encodeURIComponent(payId)}&reason=${encodeURIComponent(errorMsg)}`);
              }
            } catch (err: any) {
              console.error('Payment verification request failed:', err);
              const payId = response.razorpay_payment_id || '';
              setLocation(`/payment-failed?payment_id=${encodeURIComponent(payId)}&reason=${encodeURIComponent('Network error during payment verification.')}`);
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
        return;
      }

      // Fallback Mode if Keys are not configured in .env yet
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Payment gateway link is currently unavailable');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
      setLocation(`/payment-failed?reason=${encodeURIComponent(err.message || 'Payment initiation failed')}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col font-sans overflow-x-hidden w-full">
      {/* CHECKOUT TOP HEADER */}
      <header className="border-b border-slate-800/80 bg-[#090b14]/90 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="site-shell max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 w-full min-w-0">
          <button
            onClick={() => setLocation('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Assets Store</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <span className="max-w-[100px] sm:max-w-[160px] truncate">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </span>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Log Out"
                    className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
              </div>
            )}

            <div className="hidden md:flex items-center gap-1 text-[10px] sm:text-xs text-emerald-400 font-mono-custom bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-3 py-1 rounded-full shrink-0">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      {/* CHECKOUT MAIN CONTAINER */}
      <main className="flex-1 site-shell max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 w-full min-w-0 overflow-hidden">
        <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Express 1-Click Checkout
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
            Checkout & Get Instant Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your order below and proceed to payment for instant Google Drive delivery.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Preparing secure checkout session...</p>
          </div>
        ) : itemsToCheckout.length === 0 ? (
          /* EMPTY CART CHECKOUT WARNING */
          <div className="bg-[#0b0d19] border border-slate-800 rounded-3xl p-6 sm:p-12 text-center max-w-lg mx-auto w-full">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Your Order is Empty</h2>
            <p className="text-xs text-slate-400 mb-6">
              You don't have any assets selected for checkout right now. Browse our catalog to select your favorite products!
            </p>
            <button
              onClick={() => setLocation('/')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer"
            >
              Explore Products Catalog
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6 w-full min-w-0">
            {/* ORDER SUMMARY CARD */}
            <div className="bg-[#0b0d19] border border-slate-800 rounded-2xl p-4 sm:p-6 w-full min-w-0 overflow-hidden shadow-2xl">
              <h3 className="text-sm font-bold text-white mb-3 sm:mb-4 border-b border-slate-800/80 pb-3 flex items-center justify-between">
                <span>Selected Items</span>
                <span className="text-xs font-mono text-slate-400">{itemsToCheckout.length} Asset{itemsToCheckout.length === 1 ? '' : 's'}</span>
              </h3>

              {/* ITEMS LIST */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {itemsToCheckout.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-slate-900/60 border border-slate-800/80 p-2.5 sm:p-3 rounded-xl min-w-0 overflow-hidden items-center">
                    {(() => {
                      const itemImg = item.imageUrl || (item as any).image_url || (item as any).image || (item as any).bannerUrl;
                      if (itemImg) {
                        return (
                          <img
                            src={itemImg}
                            alt={item.title}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-800 shadow-sm"
                          />
                        );
                      }
                      return (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-900/60 to-indigo-950/80 flex flex-col items-center justify-center text-violet-300 font-bold text-xs shrink-0 shadow-inner p-1 text-center">
                          <Sparkles className="w-3.5 h-3.5 mb-0.5 text-violet-400" />
                          <span className="text-[8px] uppercase tracking-wider font-mono truncate max-w-[45px]">{item.category}</span>
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate">{item.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm font-extrabold text-violet-300">
                          ₹{(item as any).price || (item as any).priceInr || (item as any).price_inr || '299'}
                        </span>
                        {Boolean((item as any).originalPrice || (item as any).originalPriceInr || (item as any).original_price_inr) && (
                          <span className="text-[10px] sm:text-xs text-slate-500 line-through font-medium">
                            ₹{(item as any).originalPrice || (item as any).originalPriceInr || (item as any).original_price_inr || '999'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DYNAMIC ORDER BUMP ADD-ON OFFERS (Excludes products already in cart/checkout) */}
              {availableBonusOffers.length > 0 && (
                <div className="space-y-2.5 mt-3.5">
                  {availableBonusOffers.map((bAsset, bIdx) => {
                    const isChecked = selectedBonusIds.includes(bAsset.id);
                    return (
                      <div
                        key={bAsset.id || bIdx}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border-amber-500/50 shadow-md'
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBonusSelection(bAsset.id)}
                            className="w-3.5 h-3.5 text-violet-600 bg-slate-900 border-slate-700 rounded focus:ring-violet-500 cursor-pointer shrink-0 accent-violet-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                                Add-On Offer
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">
                                {bAsset.title}
                              </h4>
                              <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">+₹{bAsset.price}</span>
                              {bAsset.originalPrice && (
                                <span className="text-[10px] text-slate-500 line-through font-mono shrink-0">₹{bAsset.originalPrice}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {bAsset.description}
                            </p>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BUYER CONTACT DETAILS FORM */}
              <div className="mt-5 p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-400" /> Buyer Contact Info (For Instant Access Delivery)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Mobile / WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210 (For Order Updates)"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{rawSubtotal}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Processing Fee</span>
                  <span className="text-emerald-400 font-semibold">FREE (₹0)</span>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between items-baseline font-bold text-sm text-white">
                  <span>Total Amount</span>
                  <span className="text-xl font-black text-violet-300">₹{finalTotal}</span>
                </div>
              </div>

              {/* PAYMENT ERROR ALERT */}
              {paymentError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* SUBMIT PAYMENT BUTTON */}
              <form onSubmit={handleProceedToPayment} className="mt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-violet-600/25 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 shrink-0 text-violet-200" />
                      <span>Proceed to Payment</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </form>

              {/* TRUST BADGES */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Instant Delivery via Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Lifetime Unlimited Access</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DEDICATED PAYMENT SUCCESS MODAL */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setLocation('/');
        }}
        customerEmail={buyerEmail || user?.email || ''}
        paymentId={successPaymentId}
        purchasedItems={itemsToCheckout}
        totalAmountInr={finalTotal}
        onGoHome={() => {
          setShowSuccessModal(false);
          setLocation('/');
        }}
        onViewPurchases={() => {
          setShowSuccessModal(false);
          setLocation('/');
        }}
      />
    </div>
  );
}

export default CheckoutPage;
