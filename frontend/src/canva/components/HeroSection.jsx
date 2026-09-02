import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Award, CheckCircle } from 'lucide-react';

export default function HeroSection({ onExploreClick, onBenefitsClick }) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/15 blur-[120px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/10 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>✨ Premium Canva Pro Access</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
          Design Without <br className="hidden sm:inline" />
          <span className="text-gradient-cyan">Limits.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-5 duration-900">
          Unlock the full power of Canva Pro with 100M+ premium photos, videos, AI Magic tools, background remover, and custom brand kits — delivered instantly.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3 group"
          >
            <span>Explore Plans</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onBenefitsClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-base border border-white/15 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>View Benefits</span>
          </button>
        </div>

        {/* Highlight Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Zap, title: 'Instant Activation', desc: 'Auto email invite link' },
            { icon: ShieldCheck, title: 'Official Canva Team', desc: '100% genuine access' },
            { icon: Award, title: '100M+ Assets', desc: 'Photos, fonts & templates' },
            { icon: CheckCircle, title: '24/7 Guarantee', desc: 'Dedicated customer support' },
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-4 rounded-2xl flex items-center space-x-3 text-left border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
