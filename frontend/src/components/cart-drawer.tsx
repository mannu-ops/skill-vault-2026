import { motion } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { Course } from '../data/courses';
import { getImageThumbnail } from '../lib/imagekit';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Course[];
  onRemoveItem: (courseId: string) => void;
  onClearCart: () => void;
  onCheckout: (courseId: string) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartDrawerProps) {
  const totalAmount = items.reduce((sum, item) => {
    const numericPrice = Number(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    return sum + numericPrice;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-md bg-slate-950 border-l border-slate-800/80 shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your Cart</h2>
                <p className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-300 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-[220px]">
                  Explore our digital catalog and unlock top-tier developer assets today.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex gap-3 items-center hover:border-slate-700 transition-colors relative group"
                  >
                    {(() => {
                      const itemImg = item.imageUrl || (item as any).image_url || (item as any).image || (item as any).bannerUrl;
                      if (itemImg) {
                        return (
                          <img
                            src={getImageThumbnail(itemImg, 150)}
                            alt={item.title}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-950 shadow-md"
                            loading="lazy"
                          />
                        );
                      }
                      return (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-900/60 to-indigo-950/80 flex flex-col items-center justify-center text-violet-300 font-bold text-xs shrink-0 shadow-inner p-1 text-center">
                          <Sparkles className="w-4 h-4 mb-0.5 text-violet-400" />
                          <span className="text-[9px] uppercase tracking-wider font-mono truncate max-w-[50px]">{item.category}</span>
                        </div>
                      );
                    })()}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 truncate max-w-[120px]">
                          {item.category}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          ₹{item.price}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            onCheckout(item.id);
                          }}
                          className="text-[11px] font-semibold text-violet-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Checkout <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/95 space-y-3 sm:space-y-4 pb-8 sm:pb-6 relative z-10">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items ({items.length})</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Access Type</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Lifetime Access
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-emerald-400 font-mono text-base">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClearCart}
                  className="py-3 px-3 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onCheckout('');
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-violet-600/40 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" /> Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
