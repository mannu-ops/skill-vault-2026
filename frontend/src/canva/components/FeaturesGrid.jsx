import React from 'react';
import { Wand2, Image, Layers, Palette, HardDrive, Download, ShieldCheck, MessageSquare, RefreshCw } from 'lucide-react';

const FEATURES = [
  {
    icon: Wand2,
    title: 'Magic Studio AI Tools',
    desc: 'Magic Eraser, Magic Expand, Magic Edit, AI Image Generator & AI Write.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Image,
    title: '100M+ Premium Stock Assets',
    desc: 'Full access to millions of premium photos, vectors, graphics & audio clips.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Layers,
    title: 'Instant Background Remover',
    desc: 'Remove backgrounds from photos & videos in 1 click with surgical precision.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Palette,
    title: 'Brand Kit & Custom Fonts',
    desc: 'Upload custom fonts, set brand colors, logos & design templates effortlessly.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: HardDrive,
    title: '100GB Cloud Storage',
    desc: 'Store all your high-res designs, RAW assets & video projects securely.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Download,
    title: 'SVG & Transparent Export',
    desc: 'Export high-res PNG with transparent background, vector SVGs, and print PDFs.',
    color: 'from-violet-500 to-purple-500',
  },
];

export default function FeaturesGrid() {
  return (
    <div className="space-y-6 sm:space-y-8 pt-4 sm:pt-6">
      
      {/* 24/7 Replacement Link Guarantee Section */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-cyan-950/40 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 100% Replacement & Continuous Access Guarantee
            </div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl md:text-2xl text-white">
              Facing Activation Issues or Link Expiry?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              If you ever face any activation issues or link expiry, simply contact our 24/7 dedicated support team or admin. We provide <strong className="text-amber-300 underline decoration-amber-400 underline-offset-2">instant replacement links</strong> and guarantee continuous access throughout your subscription.
            </p>
          </div>

          <div className="w-full md:w-auto flex items-center justify-center shrink-0 pt-2 md:pt-0">
            <a
              href="https://wa.me/917652072236?text=Hi%20SkillVault%20Admin,%20I%20need%20support%20for%20Canva%20Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-center"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Contact 24/7 Support Admin</span>
            </a>
          </div>
        </div>
      </div>

      <div className="text-center space-y-1.5 sm:space-y-2">
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-white">
          Everything Unlocked With <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Canva Pro Access</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto px-2">
          You get 100% full Canva Pro permissions linked directly to your account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {FEATURES.map((feat, idx) => {
          const IconComp = feat.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-purple-500/30 transition-all hover:-translate-y-1 group"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${feat.color} p-0.5 mb-2.5 sm:mb-3 shadow-md`}>
                <div className="w-full h-full bg-[#0E111F] rounded-[10px] flex items-center justify-center text-white">
                  <IconComp className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <h4 className="font-heading font-bold text-sm sm:text-base text-white mb-1">{feat.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
