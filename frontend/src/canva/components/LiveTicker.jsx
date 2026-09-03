import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const RECENT_ACTIVATIONS = [
  { email: 'pri***r@gmail.com', plan: '1 Year Canva Pro', time: '20 seconds ago' },
  { email: 'rah***9@gmail.com', plan: 'Lifetime Canva Pro', time: '45 seconds ago' },
  { email: 'vik***m@yahoo.com', plan: '1 Year Canva Pro', time: '1 minute ago' },
  { email: 'ana***s@gmail.com', plan: '6 Months Canva Pro', time: '2 minutes ago' },
  { email: 'sid***p@gmail.com', plan: '1 Year Canva Pro', time: '3 minutes ago' },
  { email: 'neh***v@outlook.com', plan: 'Lifetime Canva Pro', time: '4 minutes ago' },
  { email: 'roh***k@gmail.com', plan: '1 Year Canva Pro', time: '5 minutes ago' },
  { email: 'poo***a@gmail.com', plan: '6 Months Canva Pro', time: '7 minutes ago' },
];

// Helper to mask any raw email: e.g. "priyarathore@gmail.com" -> "pri***e@gmail.com"
export function maskEmail(email) {
  if (!email || !email.includes('@')) return 'use***@gmail.com';
  const [user, domain] = email.split('@');
  if (user.length <= 3) {
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return `${user.slice(0, 3)}***${user.slice(-1)}@${domain}`;
}

export default function LiveTicker({ activations }) {
  const [items, setItems] = useState(RECENT_ACTIVATIONS);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (activations && activations.length > 0) {
      const formatted = activations.map((a, i) => ({
        email: maskEmail(a.email),
        plan: a.planName || '1 Year Canva Pro',
        time: a.timestamp || `${(i + 1) * 2} minutes ago`
      }));
      setItems(formatted.concat(RECENT_ACTIVATIONS));
    }
  }, [activations]);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 500);
    }, 6000);

    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index] || items[0];
  if (!current) return null;

  return (
    <div
      className={`fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 max-w-[calc(100vw-24px)] sm:max-w-[280px] transition-all duration-500 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'
      }`}
    >
      <div className="glass-card px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-purple-500/30 flex items-center gap-2.5 shadow-[0_0_15px_rgba(125,42,232,0.2)] backdrop-blur-md">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full border-2 border-[#090A0F]" />
        </div>

        <div className="text-xs min-w-0 pr-1">
          <p className="font-bold text-white font-mono text-[12px] leading-tight truncate">
            {current.email}
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
