import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, Zap, ArrowRight, Sparkles, Lock, Crown, ChevronDown } from 'lucide-react';

export default function ActivationForm({ plans = [], selectedPlan, onSelectPlan, onActivate, isProcessing = false, paymentError = '' }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isProcessing) return;
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid Canva account email address.');
      return;
    }
    setError('');
    onActivate(email);
  };

  const currentPrice = selectedPlan ? selectedPlan.price : (plans[0] ? plans[0].price : 0);

  return (
    <div className="w-full max-w-xl mx-auto glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 relative border border-purple-500/40 shadow-[0_0_70px_rgba(125,42,232,0.3)]">
      
      <div className="space-y-4 sm:space-y-5">
        
        {/* Form Header */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#7D2AE8] to-[#00F2FE] p-[2px] shadow-lg shrink-0">
              <div className="w-full h-full bg-[#0D0F1A] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg md:text-xl text-white leading-tight">Instant Pro Activation</h3>
              <p className="text-xs sm:text-[13px] text-slate-400">Official Canva Team Invite</p>
            </div>
          </div>

          <span className="text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" /> 5-Sec Delivery
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          
          {/* FIELD 1: CANVA ACCOUNT EMAIL INPUT */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Canva Account Email <span className="text-pink-500">*</span></span>
              <span className="text-[11px] text-slate-500 font-normal">Use existing account</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. yourname@gmail.com"
                className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-white/15 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/30 transition-all text-sm sm:text-base"
              />

              {email.includes('@') && email.includes('.') && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 animate-scale-in" />
                </div>
              )}
            </div>
          </div>

          {/* FIELD 2: SELECT DROPDOWN */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Crown className="w-4 h-4 text-amber-400" /> Select Canva Plan <span className="text-pink-500">*</span>
              </span>
              <span className="text-xs sm:text-sm text-cyan-400 font-extrabold bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                Selected: ₹{currentPrice}
              </span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-purple-400">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <select
                value={selectedPlan ? selectedPlan.id : ''}
                onChange={(e) => {
                  const plan = plans.find(p => p.id === e.target.value);
                  if (plan) onSelectPlan(plan);
                }}
                className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-900 border border-purple-500/40 text-white font-heading font-bold text-xs sm:text-base focus:outline-none focus:border-[#00F2FE] focus:ring-2 focus:ring-[#00F2FE]/40 transition-all appearance-none cursor-pointer shadow-[0_0_20px_rgba(125,42,232,0.15)] truncate"
              >
                {plans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                    className="bg-[#0D0F1A] text-slate-100 py-2.5 font-sans font-medium text-xs sm:text-sm"
                  >
                    {plan.name} ({plan.duration}) — ₹{plan.price} {plan.badge ? `[${plan.badge}]` : ''}
                  </option>
                ))}
              </select>

              <div className="absolute inset-y-0 right-0 pr-3.5 sm:pr-4 flex items-center pointer-events-none text-purple-400">
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Selected Plan Benefits Pill */}
            {selectedPlan && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-purple-950/35 border border-purple-500/25 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5 truncate text-xs sm:text-[13px]">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Includes: {selectedPlan.name}</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold text-[10px] sm:text-xs bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    Save {Math.round((1 - selectedPlan.price / (selectedPlan.originalPrice || selectedPlan.price * 5)) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-normal">
                  {Array.isArray(selectedPlan.features) ? selectedPlan.features.slice(0, 3).join(' • ') : selectedPlan.features}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          {paymentError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{paymentError}</span>
            </div>
          )}

          {/* Glowing CTA Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl btn-futuristic font-heading font-black text-sm sm:text-base md:text-lg text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_40px_rgba(125,42,232,0.8)] group mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Opening Secure Gateway...</span>
              </>
            ) : (
              <>
                <span>Activate Canva Pro Now (₹{currentPrice})</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 shrink-0" />
              </>
            )}
          </button>

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-slate-400 pt-2.5 border-t border-white/5">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Refund
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold shrink-0">
              <Zap className="w-3.5 h-3.5" /> Instant Invite
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-purple-400 font-semibold shrink-0">
              <Lock className="w-3.5 h-3.5" /> 256-Bit SSL
            </span>
          </div>

        </form>

      </div>

    </div>
  );
}
