import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const RECENT_ACTIVATIONS = [
  { name: 'Rahul M.', city: 'Delhi', plan: '1 Year Pro', time: '20 seconds ago' },
  { name: 'Ananya S.', city: 'Bengaluru', plan: 'Lifetime VIP', time: '45 seconds ago' },
  { name: 'Vikram K.', city: 'Mumbai', plan: '1 Year Pro', time: '1 minute ago' },
  { name: 'Priya R.', city: 'Hyderabad', plan: '6 Months Pro', time: '2 minutes ago' },
  { name: 'Siddharth P.', city: 'Pune', plan: '1 Year Pro', time: '3 minutes ago' },
  { name: 'Neha V.', city: 'Jaipur', plan: '1 Month Starter', time: '4 minutes ago' },
];

export default function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % RECENT_ACTIVATIONS.length);
        setVisible(true);
      }, 500);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const current = RECENT_ACTIVATIONS[index];

  return (
    <div
      className={`fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-30 max-w-[calc(100vw-24px)] sm:max-w-xs transition-all duration-500 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="glass-card px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-purple-500/30 flex items-center gap-2.5 sm:gap-3 shadow-[0_0_25px_rgba(125,42,232,0.25)] backdrop-blur-md">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-[#090A0F]" />
        </div>

        <div className="text-xs min-w-0 pr-1">
          <p className="font-bold text-white leading-tight truncate">
            {current.name} <span className="text-slate-400 font-normal text-[11px]">({current.city})</span>
          </p>
          <p className="text-[11px] text-cyan-300 font-medium truncate">
            Activated <strong className="text-purple-300">{current.plan}</strong>
          </p>
          <span className="text-[10px] text-slate-500 font-mono">{current.time}</span>
        </div>
      </div>
    </div>
  );
}
