import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, Copy, Check, Lock, Sparkles, ArrowRight, Smartphone } from 'lucide-react';

export default function CheckoutModal({ plan, onClose, onSuccess, showToast }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details'); // 'details' | 'payment'

  const upiId = 'canvapro.access@upi';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    if (showToast) showToast('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      if (showToast) showToast('Please enter a valid email address', 'error');
      return;
    }
    setPaymentStep('payment');
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      // Simulate/Trigger order completion through API service
      const order = {
        planId: plan.id,
        customerEmail: email,
        customerName: name || 'Customer',
        paymentMethod: 'UPI'
      };
      await onSuccess(order);
    } catch (err) {
      if (showToast) showToast('Payment processing failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Complete Your Order</h3>
            <p className="text-xs text-slate-400">Instant Canva Pro Activation</p>
          </div>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Selected Plan</span>
            <h4 className="text-base font-bold text-white">{plan.name}</h4>
            <p className="text-xs text-slate-400">{plan.duration_label || `${plan.duration_days} Days Access`}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-white">₹{plan.price}</span>
            {plan.original_price && plan.original_price > plan.price && (
              <p className="text-xs text-slate-500 line-through">₹{plan.original_price}</p>
            )}
          </div>
        </div>

        {paymentStep === 'details' ? (
          /* Step 1: Customer Info Form */
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Email Address <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Canva team invitation will be sent to this email.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center space-x-2 mt-4"
            >
              <span>Continue to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: UPI / QR Payment Screen */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-center relative overflow-hidden">
              
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-3">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan & Pay via any UPI App</span>
              </div>

              {/* Dynamic QR Box Visual */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center justify-center relative mb-3">
                <QrCode className="w-36 h-36 text-slate-950" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                  <span className="text-[10px] font-bold bg-cyan-500 text-white px-2 py-0.5 rounded shadow">UPI SCAN</span>
                </div>
              </div>

              {/* UPI ID Box */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 max-w-xs mx-auto">
                <span className="text-xs font-mono text-cyan-300 font-semibold">{upiId}</span>
                <button
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPaymentStep('details')}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Verifying Access...</span>
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>I Have Paid — Get Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Protected by 256-Bit SSL Encryption • 100% Genuine Guarantee</span>
        </div>

      </div>
    </div>
  );
}
