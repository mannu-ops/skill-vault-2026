import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '../canva/components/Navbar.jsx';
import Hero from '../canva/components/Hero.jsx';
import ActivationForm from '../canva/components/ActivationForm.jsx';
import FeaturesGrid from '../canva/components/FeaturesGrid.jsx';
import FAQSection from '../canva/components/FAQSection.jsx';
import PaymentModal from '../canva/components/PaymentModal.jsx';
import SuccessModal from '../canva/components/SuccessModal.jsx';
import LiveTicker from '../canva/components/LiveTicker.jsx';
import Footer from '../canva/components/Footer.jsx';
import { fetchPlans, fetchActivations } from '../canva/canvaApi.js';

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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
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

  const handleActivateClick = (email: string) => {
    setUserEmail(email);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (inviteLink?: string) => {
    if (inviteLink) {
      setDeliveredInviteUrl(inviteLink);
    }
    setIsPaymentOpen(false);
    setIsSuccessOpen(true);
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

      {/* Payment Gateway Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          selectedPlan={selectedPlan}
          userEmail={userEmail}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Success & Invite Link Delivery Modal */}
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
