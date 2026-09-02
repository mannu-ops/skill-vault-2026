import React, { useState, useEffect } from 'react';
import { Zap, UserCheck, Key, Clock } from 'lucide-react';

export default function Navbar({ 
  onGoHome, 
  currentView, 
  loggedInAdmin, 
  isAdminAuthenticated, 
  onChangePassword
}) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { minutes: 14, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greetingName = (currentView === 'admin' && isAdminAuthenticated && loggedInAdmin) 
    ? (loggedInAdmin.username || loggedInAdmin.name || 'ADMIN').toUpperCase() 
    : null;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => onGoHome && onGoHome()}>
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#7D2AE8] via-[#00F2FE] to-[#FF007A] p-[2px] shadow-[0_0_20px_rgba(125,42,232,0.5)] shrink-0">
            <div className="w-full h-full bg-[#0D0F1A] rounded-[10px] flex items-center justify-center">
              <span className="font-heading font-black text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#FF007A]">
                C
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading font-extrabold text-sm sm:text-lg lg:text-xl tracking-tight text-white whitespace-nowrap">
                Canva <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#7D2AE8]">Pro</span>
              </span>
              <span className="hidden md:inline-flex px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600/30 to-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-full items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> Instant
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">Official Team Portal</p>
          </div>
        </div>

        {/* Right Section: Offer Timer */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* OFFER ENDS COUNTDOWN BADGE IN NAVBAR */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full glass-card border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-purple-950/40">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 animate-spin-slow flex-shrink-0" />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="hidden sm:inline text-slate-200 text-xs sm:text-sm font-extrabold tracking-tight whitespace-nowrap">
                Offer ends:
              </span>
              <span className="inline sm:hidden text-amber-300 text-[10px] font-bold">
                Ends:
              </span>
              <span className="font-heading font-black text-amber-400 tracking-wider bg-amber-500/25 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-amber-500/40 text-xs sm:text-sm font-mono shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
