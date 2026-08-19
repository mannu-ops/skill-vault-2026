import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090b14] px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0c0e17] p-8 text-center shadow-2xl shadow-violet-950/30">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
          <AlertCircle className="size-7" />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          404 - Page Not Found
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
          The asset or page you are looking for does not exist or has been moved.
        </p>

        <button
          type="button"
          onClick={() => setLocation('/')}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-300 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft size={15} /> Return to Marketplace
        </button>
      </div>
    </div>
  );
}
