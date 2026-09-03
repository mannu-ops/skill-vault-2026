import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Mail, Copy, Check, ExternalLink, ShieldCheck, X } from 'lucide-react';

export default function SuccessModal({ isOpen, userEmail, selectedPlan, inviteUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = inviteUrl || selectedPlan?.invite_link || selectedPlan?.inviteLink || 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE';

  useEffect(() => {
    if (!isOpen) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#00F2FE', '#7D2AE8', '#FF007A', '#F59E0B', '#10B981', '#38BDF8'];
      const particles = Array.from({ length: 70 }, () => ({
        x: canvas.width * (0.35 + Math.random() * 0.3),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 13 - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        alpha: 1
      }));

      let animationFrame;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = 0;
        particles.forEach(p => {
          if (p.alpha <= 0.01) return;
          active++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.38;
          p.rotation += p.vr;
          p.alpha -= 0.012;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });

        if (active > 0) {
          animationFrame = requestAnimationFrame(render);
        } else {
          canvas.remove();
        }
      };
      animationFrame = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrame);
        canvas.remove();
      };
    } catch (e) { }
  }, [isOpen]);

  if (!isOpen || !selectedPlan) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#050711]/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-[0_0_70px_rgba(16,185,129,0.3)] bg-[#0A0D18] text-slate-100 p-4 sm:p-6 my-auto">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-1.5 sm:space-y-2 pb-3 border-b border-white/10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Activation Successful</span>
          </div>

          <h2 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-white">
            Welcome to Canva Pro Team!
          </h2>

          <p className="text-xs text-slate-300">
            Access link dispatched to <span className="text-cyan-300 font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Action Content */}
        <div className="mt-3.5 sm:mt-4 space-y-3 sm:space-y-3.5">
          
          {/* Main Join Button */}
          <a
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl btn-futuristic font-heading font-extrabold text-xs sm:text-sm text-white inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_rgba(125,42,232,0.6)] transform-gpu active:scale-95 transition-all"
          >
            <span>🚀 Click to Join Canva Pro Team Now</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          {/* Copy Link Input Bar */}
          <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="bg-transparent text-slate-300 text-[11px] sm:text-xs px-2 flex-1 truncate outline-none font-mono selection:bg-purple-500/30"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Compact 3-Step Instructions */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px]">
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="font-bold text-cyan-400 block">1. Click Link</span>
              <span className="text-slate-400 text-[9px] sm:text-[10px]">Open invite above</span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="font-bold text-purple-400 block">2. Log In</span>
              <span className="text-slate-400 text-[9px] sm:text-[10px]">With Canva account</span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="font-bold text-emerald-400 block">3. Join Team</span>
              <span className="text-slate-400 text-[9px] sm:text-[10px]">Enjoy Pro features</span>
            </div>
          </div>

          {/* Compact Support Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px]">
            <span className="text-amber-300 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 24/7 Replacement Guarantee
            </span>
            <a
              href="https://wa.me/917652072236?text=Hi%20SkillVault%20Admin,%20I%20need%20assistance%20with%20my%20Canva%20Pro%20activation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              💬 WhatsApp Support
            </a>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs text-slate-300 transition-all cursor-pointer"
          >
            Close & Return to Home
          </button>

        </div>

      </div>
    </div>
  );
}
