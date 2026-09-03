import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Mail,
  ShoppingBag,
  Home,
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { Course } from '@/data/courses';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail: string;
  paymentId?: string;
  purchasedItems?: Course[];
  totalAmountInr?: number;
  driveUrl?: string;
  onGoHome: () => void;
  onViewPurchases: () => void;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  customerEmail,
  paymentId,
  purchasedItems = [],
  totalAmountInr = 0,
  driveUrl = '',
  onGoHome,
  onViewPurchases,
}: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  const resolvedDriveUrl = React.useMemo(() => {
    if (driveUrl && driveUrl.trim().startsWith('http')) return driveUrl.trim();
    if (purchasedItems && purchasedItems.length > 0) {
      const found = purchasedItems.find(it => (it as any).driveUrl || (it as any).drive_url);
      if (found) {
        const url = (found as any).driveUrl || (found as any).drive_url;
        if (url && url.startsWith('http')) return url;
      }
    }
    return '';
  }, [driveUrl, purchasedItems]);

  const handleAccessProductClick = () => {
    if (resolvedDriveUrl) {
      window.open(resolvedDriveUrl, '_blank', 'noopener,noreferrer');
    } else {
      onViewPurchases();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-[#0d0f1a] p-4 sm:p-8 shadow-2xl shadow-emerald-950/50 z-10 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {/* Top Decorative Glow Orbs */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Green Success Badge */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/30 mb-4 sm:mb-5 flex items-center justify-center shrink-0"
            >
              <div className="w-full h-full rounded-full bg-[#0d0f1a] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40"
              />
            </motion.div>

            {/* Main Heading */}
            <h2 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 leading-snug">
              <span>Payment Successful!</span> <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
              Thank you! Your order has been confirmed.
            </p>

            {/* Email Delivery Box (Highly Prominent Email Delivery & Spam Warning) */}
            <div className="w-full mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 sm:p-5 text-left shadow-lg shadow-emerald-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-3.5">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/40 shrink-0 mt-0.5 shadow-md self-start">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 animate-pulse" />
                </div>

                <div className="space-y-2 sm:space-y-2.5 min-w-0 flex-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 font-mono-custom bg-emerald-500/20 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 rounded-full break-words">
                      📩 Access Sent to Your Email
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-100 font-semibold leading-relaxed">
                    Your product & digital asset access links have been sent to your registered email address!
                  </p>

                  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-emerald-500/30 font-mono-custom text-[11px] sm:text-xs font-bold text-emerald-300 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate min-w-0 flex-1">{customerEmail || 'your email address'}</span>
                    <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded shrink-0">SENT</span>
                  </div>

                  {/* SPAM / PROMOTIONS WARNING BOX */}
                  <div className="mt-2.5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300 text-[11px] sm:text-xs">
                      <span>⚠️</span> Important Email Instructions
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                      1. Check your <strong>Inbox</strong>.<br />
                      2. If not found in Primary Inbox, check your <strong>Spam Folder</strong> or <strong>Promotions Tab</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Summary List */}
            {purchasedItems.length > 0 && (
              <div className="w-full mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 sm:mb-3">
                  <span className="text-[11px] sm:text-xs font-mono-custom text-slate-400">Order Summary</span>
                  {paymentId && (
                    <span className="text-[9px] sm:text-[10px] font-mono-custom text-slate-500 truncate max-w-[140px] sm:max-w-none">
                      ID: {paymentId.slice(0, 16)}...
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-32 sm:max-h-36 overflow-y-auto pr-1">
                  {purchasedItems.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between text-[11px] sm:text-xs gap-2">
                      <span className="font-semibold text-slate-200 truncate min-w-0 flex-1">
                        • {item.title}
                      </span>
                      <span className="font-mono-custom text-emerald-400 font-bold shrink-0">
                        ₹{item.price || (item as any).priceInr || (item as any).price_inr || '299'}
                      </span>
                    </div>
                  ))}
                </div>

                {totalAmountInr > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>Total Paid:</span>
                    <span className="text-emerald-400 font-mono-custom text-xs sm:text-sm">₹{totalAmountInr}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleAccessProductClick}
                className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 transform-gpu active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {resolvedDriveUrl && resolvedDriveUrl.toLowerCase().includes('canva') ? '🚀 Join Canva Pro Team' : 'Access your Product'}
              </button>

              <button
                type="button"
                onClick={onGoHome}
                className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                Go to home
              </button>
            </div>

            <p className="mt-3 sm:mt-4 text-[10px] text-slate-500 flex items-center gap-1 font-mono-custom">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" /> Guaranteed 256-Bit SSL Secure Purchase
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PaymentSuccessModal;
