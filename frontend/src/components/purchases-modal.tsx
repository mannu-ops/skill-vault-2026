import { motion } from 'framer-motion';
import { X, ExternalLink, PackageCheck, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';

interface Purchase {
  id: string;
  courseId?: string;
  course_id?: string;
  amountPaidInr?: number;
  amount_paid_inr?: number;
  paymentId?: string | null;
  payment_id?: string | null;
  status: string;
  accessDelivered?: boolean;
  createdAt?: string;
  created_at?: string;
  driveUrl?: string;
  drive_url?: string;
}

interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
}

interface PurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  purchases: Purchase[];
  loading?: boolean;
}

export function PurchasesModal({ isOpen, onClose, user, purchases, loading }: PurchasesModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Content Dialog */}
      <motion.div
        className="relative bg-[#0b0d19] border border-slate-800/90 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col z-10"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c0e1c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                My Learning & Assets
              </h2>
              <p className="text-slate-400 text-xs">{user?.email || 'Logged in Customer'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {loading && purchases.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">Fetching your purchased assets...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No purchases found yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you purchase any course or asset, your access links and invoice receipts will automatically show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((item) => {
                const courseId = item.courseId || item.course_id || 'Digital Asset';
                const amount = item.amountPaidInr !== undefined ? item.amountPaidInr : (item.amount_paid_inr || 0);
                const paymentId = item.paymentId || item.payment_id || 'Completed';
                const dateStr = item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at || '').toLocaleDateString() : 'Recently';
                const driveUrl = item.driveUrl || item.drive_url || 'https://drive.google.com';

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-300 uppercase tracking-wide">
                          {courseId}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Lifetime Access
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-semibold text-emerald-400">₹{amount.toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-500">{paymentId}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Purchased on {dateStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-violet-600/20 transition-all text-center shrink-0 cursor-pointer active:scale-95"
                      >
                        Open Drive Folder <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 text-center text-xs text-slate-400 shrink-0">
          Need help with your access? Email support at <a href="mailto:temp83725@gmail.com" className="text-violet-400 hover:underline font-semibold">temp83725@gmail.com</a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PurchasesModal;
