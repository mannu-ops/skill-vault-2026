import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { PaymentFailedModal } from '@/components/payment-failed-modal';

export function PaymentFailedPage() {
  const [, setLocation] = useLocation();

  // Extract parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const errorMessage = searchParams.get('reason') || searchParams.get('error') || 'Payment verification failed or transaction was cancelled.';
  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || undefined;

  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setLocation('/checkout');
  };

  const handleRetry = () => {
    setLocation('/checkout');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-fade opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Render Payment Failed Modal */}
      <PaymentFailedModal
        isOpen={isOpen}
        onClose={handleClose}
        errorMessage={errorMessage}
        paymentId={paymentId}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    </div>
  );
}

export default PaymentFailedPage;
