import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Home,
  ShieldAlert,
  ArrowLeft,
  X
} from 'lucide-react';

interface PaymentFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
  paymentId?: string;
  onRetry: () => void;
  onGoHome: () => void;
}

export function PaymentFailedModal({
  isOpen,
  onClose,
  errorMessage,
  paymentId,
  onRetry,
  onGoHome,
}: PaymentFailedModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-[#0d0e18] p-6 sm:p-8 shadow-2xl shadow-rose-950/50 z-10 text-slate-100 overflow-hidden"
        >
          {/* Top Decorative Glow Orbs */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Red Failure Badge */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shadow-xl shadow-rose-500/30 mb-5 flex items-center justify-center"
            >
              <div className="w-full h-full rounded-full bg-[#0d0e18] flex items-center justify-center">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-rose-400/40"
              />
            </motion.div>

            {/* Main Heading */}
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              Payment Unsuccessful
            </h2>
            <p className="mt-1 text-sm text-slate-300 font-medium">
              We couldn't process your transaction. No charges were made to your account.
            </p>

            {/* Error Reason Box */}
            <div className="w-full mt-6 rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 sm:p-5 text-left">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono-custom">
                    Transaction Details
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono-custom bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 break-words">
                    {errorMessage || 'Payment was cancelled or failed to verify with the bank.'}
                  </p>
                  {paymentId && (
                    <p className="text-[11px] font-mono-custom text-slate-400 pt-1">
                      Reference ID: <span className="text-slate-300 font-bold">{paymentId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Common Reasons / Tips */}
            <div className="w-full mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left">
              <span className="text-xs font-mono-custom text-slate-400 font-bold uppercase tracking-wider block mb-2">
                💡 Common Solutions:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                <li>Check UPI PIN or card expiry / CVV number</li>
                <li>Ensure sufficient bank account balance</li>
                <li>Try an alternate payment method (Card / UPI / NetBanking)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-6">
              <button
                type="button"
                onClick={onGoHome}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 transform-gpu active:scale-95"
              >
                <Home className="w-4 h-4 text-emerald-400" />
                Go to home
              </button>
            </div>

            <p className="mt-4 text-[10px] text-slate-500 flex items-center gap-1 font-mono-custom">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Need Help? Email support at admin@skillvault.dev
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PaymentFailedModal;
