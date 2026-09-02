import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative py-2 sm:py-4 lg:py-6 text-center lg:text-left">
      <div className="space-y-4 sm:space-y-6">
        
        {/* Instant Delivery Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/70 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(0,242,254,0.3)]">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 uppercase">
            ⚡ Instant 5-Second Team Delivery
          </span>
        </div>

        {/* Main Futuristic Electric Blue Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-black tracking-tight leading-tight">
          <span className="block text-white">Canva Pro </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] via-[#3B82F6] to-[#60A5FA] drop-shadow-[0_0_40px_rgba(0,242,254,0.8)]">
            Instant Activation
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
          Enter your existing Canva email address, select your preferred plan, and receive an instant team invitation directly to your inbox with full Pro & AI tools unlocked.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-1 text-xs sm:text-sm font-semibold text-slate-200">
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
