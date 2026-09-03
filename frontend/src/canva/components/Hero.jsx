import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative py-1 sm:py-3 lg:py-6 text-center lg:text-left">
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        
        {/* Instant Delivery Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/70 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 uppercase">
            ⚡ Instant 5-Second Team Delivery
          </span>
        </div>

        {/* Main Futuristic Electric Blue Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.65rem] font-heading font-black tracking-tight leading-[1.12]">
          <span className="inline lg:block text-white">Canva Pro </span>
          <span className="inline lg:block text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] via-[#3B82F6] to-[#60A5FA] drop-shadow-[0_0_30px_rgba(0,242,254,0.6)]">
            Instant Activation
          </span>
        </h1>

        {/* Sub-headline - full version on desktop, compact on mobile */}
        <p className="hidden lg:block text-sm sm:text-[15px] text-slate-300 max-w-lg mx-auto lg:mx-0 font-normal leading-relaxed">
          Enter your existing Canva email address, select your preferred plan, and receive an instant team invitation directly to your inbox with full Pro & AI tools unlocked.
        </p>

        {/* Trust Badges - visible on desktop (on mobile rendered below the form) */}
        <div className="hidden lg:flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1 text-xs sm:text-sm font-semibold text-slate-200">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Official Team Invite</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Use Existing Account</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>All Pro & AI Unlocked</span>
          </div>
        </div>

      </div>
    </div>
  );
}
