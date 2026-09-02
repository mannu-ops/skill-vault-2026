import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Mail, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SuccessModal({ isOpen, userEmail, selectedPlan, onClose }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = selectedPlan?.inviteLink || `https://www.canva.com/brand/join?token=INVITE_${Math.random().toString(36).substring(2, 10).toUpperCase()}&team=VIP_PRO`;

  useEffect(() => {
    if (isOpen) {
      // Safe dynamic import for confetti animation
      import('canvas-confetti')
        .then((module) => {
          const confettiFn = module.default || module;
          confettiFn({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#00F2FE', '#7D2AE8', '#FF007A', '#F59E0B', '#10B981']
          });
        })
        .catch(() => {
          console.log('Confetti animation fallback');
        });
    }
  }, [isOpen]);

  if (!isOpen || !selectedPlan) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050711]/95 backdrop-blur-3xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-[0_0_90px_rgba(16,185,129,0.3)] my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Celebration Header Banner */}
        <div className="p-4 sm:p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-purple-950/80 text-center relative border-b border-white/10 space-y-2 sm:space-y-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10" />
          </div>

          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Activation Successful
          </span>

          <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white">
            Welcome to Canva Pro Team!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto px-1">
            Payment verified! An official Canva team invitation link has been generated & dispatched to <strong className="text-cyan-300 break-all">{userEmail}</strong>.
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Main Call To Action Button */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-900/40 to-slate-900 border border-purple-500/30 text-center space-y-2.5 sm:space-y-3 shadow-lg">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-300">Option 1: Direct Instant Join</p>
            
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 sm:py-3.5 md:py-4 px-3 sm:px-6 rounded-xl sm:rounded-2xl btn-futuristic font-heading font-extrabold text-xs sm:text-sm md:text-base text-white inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_rgba(125,42,232,0.6)]"
            >
              <span className="text-center">🚀 Click to Join Canva Pro Team Now</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-xs text-slate-400">
              <span>Or copy team invite link:</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* SIMULATED EMAIL INBOX PREVIEW */}
          <div className="rounded-xl sm:rounded-2xl border border-cyan-500/30 overflow-hidden bg-slate-950/90 shadow-xl">
            <div className="p-3 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold truncate">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Simulated Email Inbox Notification</span>
              </div>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono shrink-0">
                SENT
              </span>
            </div>

            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 text-xs">
              <div className="space-y-1 text-slate-400 pb-2.5 sm:pb-3 border-b border-white/5 break-words">
                <p><strong>From:</strong> Canva Team Invitations &lt;invites@canva.com&gt;</p>
                <p><strong>To:</strong> {userEmail}</p>
                <p><strong>Subject:</strong> <span className="text-white font-semibold">🎉 You've been invited to join Canva Pro Team ({selectedPlan.name})</span></p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2.5 sm:space-y-3">
                <p className="text-slate-300">Hi there,</p>
                <p className="text-slate-300 leading-relaxed">
                  You have been granted <strong>Canva Pro Team permissions</strong> for plan <strong>{selectedPlan.name}</strong>. Click below to accept invitation:
                </p>

                <div className="py-1">
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md text-center"
                  >
                    Accept Canva Team Invite →
                  </a>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Note: Make sure to log into Canva with {userEmail} before clicking.
                </p>
              </div>
            </div>
          </div>

          {/* Quick 3-Step How To Use Guide */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-200">How to activate on your Canva App/Web:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-cyan-400">1. Click Invite Link</span>
                <p className="text-slate-400 text-[10px] sm:text-[11px]">Click the button above or link from your email.</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-purple-400">2. Log In</span>
                <p className="text-slate-400 text-[10px] sm:text-[11px]">Log in with your existing Canva email.</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-400">3. Switch Team</span>
                <p className="text-slate-400 text-[10px] sm:text-[11px]">Click "Join Team" and enjoy unlocked Pro tools!</p>
              </div>
            </div>
          </div>

          {/* 24/7 Replacement Guarantee Note */}
          <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>24/7 Continuous Access & Replacement Guarantee</span>
            </div>
            <p className="text-slate-300 text-[10px] sm:text-[11px] leading-relaxed">
              If you ever face any activation issues or link expiry in the future, simply contact our 24/7 dedicated support team or admin. We provide instant replacement links throughout your subscription.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs text-slate-300 transition-all cursor-pointer"
          >
            Close & Return to Home
          </button>

        </div>

      </div>
    </div>
  );
}
