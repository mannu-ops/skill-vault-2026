import React from 'react';
import { Check, X, Flame, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function PlansSection({ plans, onSelectPlan, loading }) {
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return discount > 0 ? `${discount}% OFF` : null;
  };

  return (
    <section id="plans" className="relative py-12 sm:py-16 lg:py-20 bg-slate-950/50">
      {/* Subtle Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
            Choose Your Canva Pro Access
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Instant activation delivered straight to your email. No hidden fees or recurring traps.
          </p>
        </div>

        {/* Loading Skeleton State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-3xl p-8 h-[480px] animate-pulse flex flex-col justify-between border border-white/5">
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-slate-800 rounded"></div>
                  <div className="h-10 w-2/3 bg-slate-800 rounded"></div>
                  <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 w-full bg-slate-800 rounded"></div>
                  ))}
                </div>
                <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isPopular = plan.is_popular;
              const discountStr = calculateDiscount(plan.price, plan.original_price);

              return (
                <div
                  key={plan.id || plan.name}
                  className={`relative rounded-3xl flex flex-col justify-between transition-all duration-300 h-full ${
                    isPopular
                      ? 'animated-border glass-card bg-slate-900/80 shadow-2xl shadow-cyan-500/20 transform md:-translate-y-3'
                      : 'glass-card glass-card-hover bg-slate-900/40 border border-white/10'
                  } p-8`}
                >
                  {/* Popular Tag Header */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/30 flex items-center space-x-1.5">
                      <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                      <span>🔥 BEST SELLER</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1">
                    {/* Top Row: Plan Name & Badge */}
                    <div className="flex items-center justify-between mb-4 pt-2">
                      <h3 className="text-xl font-extrabold text-white tracking-tight">
                        {plan.name}
                      </h3>
                      {plan.badge && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isPopular 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                            : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline space-x-3">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          ₹{plan.price}
                        </span>
                        {plan.original_price && plan.original_price > plan.price && (
                          <span className="text-lg text-slate-500 line-through font-semibold">
                            ₹{plan.original_price}
                          </span>
                        )}
                        {discountStr && (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {discountStr}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        {plan.duration_label || `${plan.duration_days} Days Access`} • One-time payment
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3.5 mb-8 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Included Features:</p>
                      {(Array.isArray(plan.features) ? plan.features : typeof plan.features === 'string' ? plan.features.split('\n') : []).map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start space-x-3">
                          <div className={`mt-0.5 rounded-full p-1 shrink-0 ${isPopular ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-slate-300'}`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span className="text-sm text-slate-300 font-medium leading-snug">{feature}</span>
                        </div>
                      ))}

                      {/* Not Included Features */}
                      {(Array.isArray(plan.not_included || plan.notIncluded) ? (plan.not_included || plan.notIncluded) : typeof (plan.not_included || plan.notIncluded) === 'string' ? (plan.not_included || plan.notIncluded).split('\n') : []).map((notItem, nfIdx) => (
                        <div key={`nf-${nfIdx}`} className="flex items-start space-x-3 opacity-60">
                          <div className="mt-0.5 rounded-full p-1 shrink-0 bg-rose-500/10 text-rose-400">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-sm text-slate-400 line-through font-medium leading-snug">{notItem}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Select Plan Button */}
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 group mt-auto ${
                      isPopular
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    }`}
                  >
                    <span>Get Access Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
