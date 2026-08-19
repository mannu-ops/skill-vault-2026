import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { PaymentSuccessModal } from '@/components/payment-success-modal';
import { Course } from '@/data/courses';

interface PaymentSuccessPageProps {
  user?: any;
  onOpenMyPurchases?: () => void;
}

export function PaymentSuccessPage({ user, onOpenMyPurchases }: PaymentSuccessPageProps) {
  const [, setLocation] = useLocation();

  // Extract parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const customerEmail = searchParams.get('email') || user?.email || 'your email address';
  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || `pay_${Date.now()}`;
  const totalAmountInr = Number(searchParams.get('amount') || searchParams.get('total') || 0);
  const driveUrl = searchParams.get('driveUrl') || searchParams.get('drive_url') || '';

  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setLocation('/');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  const handleViewPurchases = () => {
    setLocation('/purchases');
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-fade opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Render Payment Confirmation Modal */}
      <PaymentSuccessModal
        isOpen={isOpen}
        onClose={handleClose}
        customerEmail={customerEmail}
        paymentId={paymentId}
        totalAmountInr={totalAmountInr}
        driveUrl={driveUrl}
        onGoHome={handleGoHome}
        onViewPurchases={handleViewPurchases}
      />
    </div>
  );
}

export default PaymentSuccessPage;
