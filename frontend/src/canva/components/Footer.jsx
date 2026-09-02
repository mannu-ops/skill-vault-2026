import React from 'react';
import { ShieldCheck, Lock, RefreshCw, Zap, KeyRound } from 'lucide-react';

export default function Footer({ onOpenAdmin }) {
  return (
    <footer className="mt-12 sm:mt-20 border-t border-white/10 glass-panel py-8 sm:py-12 px-3 sm:px-4 relative z-10">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center pb-6 sm:pb-8 border-b border-white/10">
          <div className="space-y-1 p-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mx-auto" />
            <h5 className="font-heading font-bold text-xs text-white">Instant 5-Sec Delivery</h5>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Automated Team Invite</p>
          </div>
          <div className="space-y-1 p-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto" />
            <h5 className="font-heading font-bold text-xs text-white">100% Refund Policy</h5>
            <p className="text-[10px] sm:text-[11px] text-slate-400">No Risk Guarantee</p>
          </div>
          <div className="space-y-1 p-2">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto" />
            <h5 className="font-heading font-bold text-xs text-white">256-Bit SSL Secure</h5>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Bank Grade Encryption</p>
          </div>
          <div className="space-y-1 p-2">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mx-auto" />
            <h5 className="font-heading font-bold text-xs text-white">24/7 VIP Support</h5>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Dedicated Helpdesk</p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] sm:text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Canva Pro Instant Activation Portal. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-400">
            <a href="#faq" className="hover:text-cyan-300 transition-colors">Privacy Policy</a>
            <a href="#faq" className="hover:text-cyan-300 transition-colors">Terms of Service</a>
            <a
              href="/admin?tab=canva"
              className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-purple-400" />
              <span>SkillVault Admin</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
