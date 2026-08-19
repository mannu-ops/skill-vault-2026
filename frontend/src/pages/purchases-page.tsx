import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock,
  Search,
  PackageCheck,
  User,
  LogOut,
  Mail,
  Sparkles,
  LockKeyhole
} from 'lucide-react';
import { getApiUrl } from '@/config';

interface PurchaseItem {
  id: string;
  courseId?: string;
  course_id?: string;
  title?: string;
  amountPaidInr?: number;
  amount_paid_inr?: number;
  paymentId?: string | null;
  payment_id?: string | null;
  status?: string;
  accessDelivered?: boolean;
  createdAt?: string;
  created_at?: string;
  driveUrl?: string;
  drive_url?: string;
  imageUrl?: string;
  category?: string;
}

interface PurchasesPageProps {
  user: any;
  onLogout?: () => void;
  purchases?: PurchaseItem[];
  loading?: boolean;
}

export function PurchasesPage({ user, onLogout, purchases: initialPurchases = [], loading: initialLoading = false }: PurchasesPageProps) {
  const [, setLocation] = useLocation();

  const [purchases, setPurchases] = useState<PurchaseItem[]>(initialPurchases);
  const [loading, setLoading] = useState(initialLoading);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch purchases from backend if user is logged in
  useEffect(() => {
    const fetchPurchases = async () => {
      const token = localStorage.getItem('sv_user_token');
      const userRaw = localStorage.getItem('sv_user_data');
      let targetEmail = user?.email;

      if (!targetEmail && userRaw) {
        try {
          const parsed = JSON.parse(userRaw);
          targetEmail = parsed.email;
        } catch (e) {
          console.error(e);
        }
      }

      if (!token && !targetEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const emailQuery = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : '';
        const res = await fetch(getApiUrl(`/api/auth/me${emailQuery}`), { headers });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.purchases)) {
            setPurchases(data.purchases);
          }
        }
      } catch (err) {
        console.error('Error fetching purchases for page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user?.email]);

  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase().trim();
    return purchases.filter((item) => {
      const title = (item.title || item.courseId || item.course_id || '').toLowerCase();
      const payId = (item.paymentId || item.payment_id || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return title.includes(q) || payId.includes(q) || cat.includes(q);
    });
  }, [purchases, searchQuery]);

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute inset-0 grid-fade opacity-30 pointer-events-none" />
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* TOP STICKY HEADER */}
      <header className="border-b border-slate-800/80 bg-[#080911]/90 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="site-shell max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 text-violet-400" />
            <span>Back to Assets Store</span>
          </button>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <span>{user.name || user.email?.split('@')[0] || 'Customer'}</span>
                </span>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Logout"
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLocation('/')}
                className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full"
              >
                Guest View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PAGE BODY CONTENT */}
      <main className="site-shell max-w-5xl mx-auto px-4 py-10 sm:py-14 flex-1 w-full relative z-10">
        {/* HERO HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-1.5 text-xs font-bold text-violet-300 font-mono-custom mb-4">
            <ShoppingBag className="w-4 h-4" />
            MY DIGITAL LIBRARY & PURCHASES
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Your Purchased Assets
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            Access your courses, software tools, source code drives, and lifetime asset updates in one centralized dashboard.
          </p>
        </div>

        {/* ACCOUNT INFO & SUMMARY STRIP */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d0f1c]/90 p-5 sm:p-6 mb-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0d0f1c] flex items-center justify-center">
                <User className="w-6 h-6 text-violet-300" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {user?.name || 'Skill Vault Account'}
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono-custom px-2 py-0.5 rounded-full font-bold">
                  Verified Buyer
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono-custom mt-0.5">
                {user?.email || 'Logged in Customer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:border-l border-slate-800 sm:pl-6 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono-custom text-slate-500 block">Total Assets</span>
              <span className="text-lg font-bold text-violet-300 font-mono-custom">{purchases.length} Items</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono-custom text-slate-500 block">Access Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Lifetime Active
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        {purchases.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your purchased courses or payment ID..."
                className="w-full bg-[#0d0f1a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
        )}

        {/* PURCHASES LIST GRID */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading your purchased digital assets...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#0c0e18] p-12 text-center max-w-lg mx-auto shadow-2xl">
            <PackageCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-slate-200">
              {searchQuery ? 'No matching assets found' : 'No Purchases Found Yet'}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {searchQuery
                ? 'Try searching with another course title or payment reference ID.'
                : 'After you complete checkout for any course or digital toolkit, your lifetime Google Drive access links and receipts will automatically appear here.'}
            </p>
            <button
              type="button"
              onClick={() => setLocation('/')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition cursor-pointer"
            >
              Browse Digital Assets Catalog <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {filteredPurchases.map((item) => {
              const displayTitle = item.title || item.courseId || item.course_id || 'Digital Product Asset';
              const amount = item.amountPaidInr !== undefined ? item.amountPaidInr : (item.amount_paid_inr || 299);
              const paymentId = item.paymentId || item.payment_id || 'Completed';
              const dateStr = item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime Access';
              const driveUrl = item.driveUrl || item.drive_url || 'https://drive.google.com';

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-slate-800/90 bg-[#0d0f1b] p-5 flex flex-col justify-between gap-4 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/20 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2.5 py-0.5 rounded-md">
                        {item.category || 'Course / Asset'}
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors leading-snug">
                        {displayTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Paid: <strong className="text-emerald-400 font-mono-custom">₹{amount.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span className="font-mono-custom text-[11px] text-slate-500 truncate max-w-[140px]">{paymentId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 mt-auto">
                    <span className="text-[11px] text-slate-500 font-mono-custom flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {dateStr}
                    </span>

                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-violet-600/20 transition-all text-center cursor-pointer transform-gpu active:scale-95 shrink-0"
                    >
                      Open Drive Folder <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUPPORT HELP NOTICE */}
        <div className="mt-12 text-center text-xs text-slate-500 font-mono-custom border-t border-slate-800/80 pt-6">
          <p className="flex items-center justify-center gap-1 text-slate-400">
            <LockKeyhole className="w-3.5 h-3.5 text-violet-400" /> Need access assistance or email update?
          </p>
          <p className="mt-1">
            Contact support team at <a href="mailto:temp83725@gmail.com" className="text-violet-400 hover:underline font-bold">temp83725@gmail.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default PurchasesPage;
