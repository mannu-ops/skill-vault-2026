import React from 'react';
import { Sparkles, Wand2, Image, Type, HardDrive, Zap, Shield, Award } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: Image,
      title: '100M+ Premium Assets',
      description: 'Access millions of high-res stock photos, vectors, graphics, and video templates directly inside Canva.'
    },
    {
      icon: Wand2,
      title: 'Magic Studio AI Tools',
      description: 'Generate stunning graphics, rewrite text, resize designs instantly, and create AI art with ease.'
    },
    {
      icon: Sparkles,
      title: '1-Click Background Remover',
      description: 'Effortlessly erase image and video backgrounds in seconds with precision artificial intelligence.'
    },
    {
      icon: Type,
      title: 'Brand Kits & Custom Fonts',
      description: 'Upload your own custom brand fonts, logos, color palettes, and maintain brand consistency across designs.'
    },
    {
      icon: HardDrive,
      title: '100GB Cloud Storage',
      description: 'Never run out of room. Safely store and manage all your high-resolution assets and project files.'
    },
    {
      icon: Zap,
      title: 'Instant Team Activation',
      description: 'Receive an automated team invite link right after checkout. Start designing in under 60 seconds.'
    }
  ];

  return (
    <section id="benefits" className="relative py-20 bg-[#030712]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>Why Canva Pro?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything You Need To Create Like A Pro
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Supercharge your workflow with official Canva Pro features at an unbelievable single-subscription price.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="glass-card glass-card-hover p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:text-cyan-300 transition-all duration-300">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
