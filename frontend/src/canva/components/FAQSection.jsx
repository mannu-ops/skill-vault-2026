import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does the Canva Pro activation process work?',
      a: 'After completing your payment, you will instantly receive an invitation link on your screen and email. Click the link to join the Canva team. If you already have a Canva account, your existing designs will remain safe and sound in your account.'
    },
    {
      q: 'Is this an official Canva Pro subscription access?',
      a: 'Yes, 100%. You are joining an official Canva Brand Team with genuine Canva Pro privileges. All premium templates, fonts, background remover, and AI Magic Studio features will be unlocked immediately.'
    },
    {
      q: 'Will my personal designs stay private?',
      a: 'Absolutely! Your designs are completely private to your account. Team admins or other members cannot view, edit, or access your personal design files unless you explicitly share them.'
    },
    {
      q: 'Can I use Canva Pro on Android, iPhone, iPad, and Desktop?',
      a: 'Yes! Once activated, your Canva Pro status syncs across all devices — including web browsers, desktop apps (Windows/Mac), and mobile apps (iOS & Android).'
    },
    {
      q: 'What happens if the team invite link expires or I need help?',
      a: 'If you ever face any activation issues or link expiry, simply contact our 24/7 dedicated support team or admin. We provide instant replacement links and guarantee continuous access throughout your subscription.'
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, CRED), credit/debit cards, net banking, and instant QR scan payments.'
    }
  ];

  return (
    <div id="faq" className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
      <div className="text-center space-y-1.5 sm:space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Got Questions?</span>
        </div>
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-white">
          Frequently Asked Questions
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto px-2">
          Everything you need to know about your Canva Pro access portal.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`glass-card rounded-xl sm:rounded-2xl border transition-all overflow-hidden ${
                isOpen ? 'border-purple-500/40 bg-slate-900/80 shadow-lg' : 'border-white/10 bg-slate-900/40 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full p-3.5 sm:p-5 text-left flex items-center justify-between gap-3 sm:gap-4 focus:outline-none cursor-pointer"
              >
                <span className="font-heading font-bold text-xs sm:text-sm md:text-base text-white">
                  {faq.q}
                </span>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-white/5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400 bg-cyan-500/20' : 'text-slate-400'}`}>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-white/5 pt-2.5 sm:pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
