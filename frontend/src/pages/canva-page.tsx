import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '../canva/components/Navbar.jsx';
import Hero from '../canva/components/Hero.jsx';
import ActivationForm from '../canva/components/ActivationForm.jsx';
import FeaturesGrid from '../canva/components/FeaturesGrid.jsx';
import FAQSection from '../canva/components/FAQSection.jsx';
import SuccessModal from '../canva/components/SuccessModal.jsx';
import LiveTicker from '../canva/components/LiveTicker.jsx';
import Footer from '../canva/components/Footer.jsx';
import { fetchPlans, createRazorpayOrder, verifyRazorpayPayment } from '../canva/canvaApi.js';

export function CanvaPage({ cart, auth }: { cart?: any; auth?: any } = {}) {
  const [location, setLocation] = useLocation();

  // If user navigates directly to /canva/admin, redirect to SkillVault Admin Dashboard (Canva tab)
  useEffect(() => {
    if (location === '/canva/admin') {
      setLocation('/admin?tab=canva');
    }
  }, [location, setLocation]);

  // Data States
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [userEmail, setUserEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [deliveredInviteUrl, setDeliveredInviteUrl] = useState('');

  // Fetch Plans for Storefront
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const dbPlans = await fetchPlans();
      if (isMounted) {
        setPlans(dbPlans || []);
        if (dbPlans && dbPlans.length > 0) {
          setSelectedPlan(dbPlans[0]);
        } else {
          setSelectedPlan(null);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Helper to dynamically load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
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

  // Direct 1-Click Razorpay Trigger: No intermediate popups!
  const handleActivateClick = async (email: string) => {
    if (!selectedPlan) return;
    setUserEmail(email);
    setIsProcessing(true);
    setPaymentError('');

    try {
      // 1. Create order on backend
      const orderRes = await createRazorpayOrder(selectedPlan.id, email);
      if (!orderRes.success || !orderRes.orderId) {
        setIsProcessing(false);
        setPaymentError(orderRes.error || 'Payment gateway is temporarily unavailable. Please try again.');
        return;
      }

      // 2. Load SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setIsProcessing(false);
        setPaymentError('Payment gateway script failed to load. Please check your internet connection.');
        return;
      }

      const activeKey = orderRes.keyId || orderRes.razorpayKeyId;

      // 3. Launch Razorpay popup directly
      if (typeof window !== 'undefined' && (window as any).Razorpay && activeKey && activeKey !== 'rzp_test_mock') {
        const options = {
          key: activeKey,
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'The Skill Vault',
          description: `🎨 Canva Pro: ${selectedPlan.name}`,
          order_id: orderRes.orderId,
          prefill: {
            name: email ? email.split('@')[0] : 'Canva Customer',
            email: email.trim(),
          },
          theme: {
            color: '#7D2AE8',
          },
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const eventId = `evt_canva_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customerEmail: email.trim(),
                customerName: email ? email.split('@')[0] : 'Canva Customer',
                planId: selectedPlan.id,
                eventId,
              });

              if (verifyRes.success) {
                const inviteUrl = verifyRes.inviteLink || verifyRes.driveUrl || selectedPlan.invite_link || '';
                setDeliveredInviteUrl(inviteUrl);
                // Trigger the ONLY success popup!
                setIsSuccessOpen(true);

                // Track Meta Pixel Purchase Event
                try {
                  const { trackPurchase } = await import('@/lib/meta-pixel');
                  trackPurchase(
                    {
                      contentIds: [selectedPlan.id],
                      contentName: `Canva Pro: ${selectedPlan.name}`,
                      numItems: 1,
                      value: selectedPlan.price || 199,
                      currency: 'INR',
                      orderId: response.razorpay_payment_id || `pay_${Date.now()}`,
                    },
                    eventId
                  );
                } catch (pixelErr) {
                  console.warn('Meta Pixel tracking error:', pixelErr);
                }
              } else {
                setPaymentError(verifyRes.error || 'Payment verification failed on server.');
              }
            } catch (err: any) {
              console.error('Canva payment verification error:', err);
              setPaymentError('Network error during payment verification. Please contact support.');
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
      } else {
        // Fallback simulation for local dev
        setTimeout(async () => {
          const verifyRes = await verifyRazorpayPayment({
            razorpay_order_id: orderRes.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'mock_signature',
            customerEmail: email,
            planId: selectedPlan.id,
          });
          setIsProcessing(false);
          if (verifyRes.success) {
            const inviteUrl = verifyRes.inviteLink || verifyRes.driveUrl || selectedPlan.invite_link || '';
            setDeliveredInviteUrl(inviteUrl);
            setIsSuccessOpen(true);
          } else {
            setPaymentError(verifyRes.error || 'Payment verification failed!');
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      setPaymentError('Payment initialization failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090E] text-slate-100 font-sans relative selection:bg-cyan-500/30">

      {/* SkillVault Official Unified Navbar */}
      <Navbar
        cartCount={cart?.cartCount || 0}
        onOpenCart={() => cart?.setIsCartOpen?.(true)}
        user={auth?.user}
        onOpenAuthModal={(mode: 'login' | 'signup') => auth?.openAuth?.(mode)}
        onLogout={() => auth?.logout?.()}
        onOpenMyPurchases={() => setLocation('/purchases')}
      />

      {/* Main Content Storefront - Positioned below fixed navbar */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        {/* Above-The-Fold: Hero & Form Visible Without Scrolling */}
        <section className="min-h-[calc(100vh-8rem)] flex flex-col justify-center py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-6">
              <Hero />
            </div>
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <ActivationForm
                plans={plans}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                onActivate={handleActivateClick}
                isProcessing={isProcessing}
                paymentError={paymentError}
              />
            </div>
          </div>
        </section>

        {/* Value Features & FAQs Below The Fold */}
        <div className="space-y-12 md:space-y-16 pt-6 sm:pt-10">
          <FeaturesGrid />
          <FAQSection />
        </div>
      </main>

      {/* SkillVault Official Unified Footer */}
      <Footer />

      {/* Floating Real-Time Activations Ticker */}
      <LiveTicker />

      {/* ONLY ONE Single Success Modal: Welcome to Canva Pro Team! */}
      {selectedPlan && (
        <SuccessModal
          isOpen={isSuccessOpen}
          userEmail={userEmail}
          selectedPlan={selectedPlan}
          inviteUrl={deliveredInviteUrl}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}

    </div>
  );
}

export default CanvaPage;
