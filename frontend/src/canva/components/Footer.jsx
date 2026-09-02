import React from 'react';
import { useLocation } from 'wouter';
import { Instagram, Facebook, Lock, KeyRound } from 'lucide-react';

export default function Footer() {
  const [, setLocation] = useLocation();

  const navTo = (targetId, category) => {
    if (category) {
      sessionStorage.setItem('sv_selected_category', category);
    }
    setLocation('/');
    setTimeout(() => {
      const el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <footer className="border-t border-slate-800/70 py-10 pb-24 lg:pb-10 bg-[#08090e] mt-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Footer Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          
          {/* Brand */}
          <button
            type="button"
            onClick={() => { setLocation('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group flex items-center gap-2 text-left cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md">
              SV
            </div>
            <span className="font-heading font-black tracking-tight text-base sm:text-lg text-white">
              SKILL<span className="text-violet-400">VAULT</span>
            </span>
          </button>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400 font-medium">
            <button
              type="button"
              onClick={() => navTo('#catalog', 'All Products')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => navTo('#catalog', 'Course')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Courses
            </button>
            <button
              type="button"
              onClick={() => navTo('#catalog', 'Software')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Software
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>🎨</span> Canva Pro
            </button>
            <button
              type="button"
              onClick={() => navTo('#why-us')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Why Us
            </button>
            <button
              type="button"
              onClick={() => navTo('#faq')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <a
              href="/admin?tab=canva"
              className="text-slate-500 hover:text-violet-400 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <KeyRound className="w-3.5 h-3.5 text-violet-400" />
              <span>Admin Portal</span>
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://www.instagram.com/theskillvaults/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Instagram"
              title="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61593149424859"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label="Facebook"
              title="Follow us on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs font-mono text-slate-500">
          <p>© 2026 SKILL VAULT STORE • ALL RIGHTS RESERVED</p>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>100% Verified Digital Assets</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
