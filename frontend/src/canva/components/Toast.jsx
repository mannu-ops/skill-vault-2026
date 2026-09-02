import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
        isError 
          ? 'bg-red-950/90 border-red-500/30 text-red-200' 
          : 'bg-slate-900/90 border-cyan-500/30 text-slate-100'
      }`}>
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-semibold">{message}</span>
        <button onClick={onClose} className="p-1 hover:opacity-75 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
