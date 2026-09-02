import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, Sparkles, AlertTriangle, CreditCard } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../utils/api.js';

export default function PaymentModal({ isOpen, onClose, selectedPlan, userEmail, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Auto-launch Razorpay Checkout as soon as Modal opens!
  useEffect(() => {
    if (!isOpen || !selectedPlan) return;
    setIsProcessing(false);
    setPaymentError('');
    handlePayNow();
  }, [isOpen, selectedPlan]);

  if (!isOpen || !selectedPlan) return null;

  async function handlePayNow() {
    setPaymentError('');
    setIsProcessing(true);
    setProcessingStep('Creating Razorpay Route Order...');

    try {
      // 1. Create order on backend with server-side price & route transfer split
      const orderRes = await createRazorpayOrder(selectedPlan.id, userEmail);

      if (!orderRes.success) {
        setIsProcessing(false);
        setPaymentError(orderRes.error || 'Payments are temporarily unavailable for this store.');
        return;
      }

      setProcessingStep('Opening Secure Razorpay Gateway...');

      // 2. Dynamically load Razorpay SDK if not present
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
          script.onerror = resolve;
        });
      }

      // 3. Open Razorpay Checkout Window or execute test verification flow
      if (typeof window !== 'undefined' && window.Razorpay && orderRes.razorpayKeyId && orderRes.razorpayKeyId !== 'rzp_test_mock') {
        const options = {
          key: orderRes.razorpayKeyId,
          amount: orderRes.amount * 100,
          currency: orderRes.currency || 'INR',
          name: 'Canva Pro Instant Activation',
          description: `${selectedPlan.name} Access`,
          order_id: orderRes.orderId,
          prefill: {
            email: userEmail
          },
          theme: {
            color: '#7D2AE8'
          },
          handler: async function (response) {
            setProcessingStep('Verifying Payment Signature & Activating Canva Pro Access...');
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customerEmail: userEmail,
              planId: selectedPlan.id
            });

            setIsProcessing(false);
            if (verifyRes.success) {
              onSuccess(verifyRes.inviteLink);
            } else {
              setPaymentError(verifyRes.error || 'Payment verification failed!');
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test / Fallback verification flow (for dev mode without live Razorpay keys)
        setTimeout(async () => {
          setProcessingStep('Verifying Payment Signature & Executing Route Split...');
          const verifyRes = await verifyRazorpayPayment({
            razorpay_order_id: orderRes.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature',
            customerEmail: userEmail,
            planId: selectedPlan.id
          });

          setIsProcessing(false);
          if (verifyRes.success) {
            onSuccess(verifyRes.inviteLink);
          } else {
            setPaymentError(verifyRes.error || 'Payment verification failed!');
          }
        }, 1200);
      }

    } catch (err) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      setPaymentError('Payment initialization failed. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050711]/95 backdrop-blur-3xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl border border-purple-500/40 shadow-[0_0_80px_rgba(125,42,232,0.3)] my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Processing Full Screen Loading Overlay */}
        {isProcessing && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6 animate-fade-in min-h-[280px]">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-purple-500/20 border-t-cyan-400 border-r-purple-500 animate-spin" />
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 absolute animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-heading font-extrabold text-lg sm:text-xl text-white">Opening Razorpay Gateway</h4>
              <p className="text-xs font-semibold text-cyan-300 animate-pulse">{processingStep}</p>
            </div>

            <div className="w-full max-w-xs bg-slate-800/60 h-2 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-pink-500 animate-pulse w-3/4" />
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400">Connecting to 256-Bit SSL Razorpay Route Gateway...</p>
          </div>
        )}

        {/* Normal Gateway Card View */}
        {!isProcessing && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-sm sm:text-base text-white truncate">Razorpay Secure Gateway</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[190px] sm:max-w-[220px]">Email: {userEmail}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary Box */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selected Plan:</span>
                <span className="font-bold text-white text-right">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                <span>Total Payable Amount:</span>
                <span className="font-heading font-black text-lg sm:text-xl text-cyan-300">₹{selectedPlan.price}</span>
              </div>
            </div>

            {/* Error Alert if any */}
            {paymentError && (
              <div className="p-3 sm:p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Pay / Retry Button */}
            <button
              onClick={handlePayNow}
              className="w-full py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl btn-futuristic font-heading font-extrabold text-xs sm:text-sm md:text-base text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="text-center">Launch Gateway (Pay ₹{selectedPlan.price})</span>
            </button>

            <p className="text-[10px] sm:text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct Bank Payment via Official Razorpay</span>
            </p>

          </div>
        )}

      </div>
    </div>
  );
}
