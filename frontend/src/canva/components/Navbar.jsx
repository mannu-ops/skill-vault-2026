import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  LogIn,
  UserPlus,
  ShoppingBag,
  User,
  LogOut,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  cartCount = 0,
  onOpenCart,
  user,
  onOpenAuthModal,
  onLogout,
  onOpenMyPurchases
}) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

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

  const close = () => {
    setMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  const navTo = (targetId, category) => {
    close();
    if (category) {
      sessionStorage.setItem('sv_selected_category', category);
    }
    setLocation('/');
    setTimeout(() => {
      const el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/60 bg-[#090a10]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex h-[68px] items-center justify-between">
        
        {/* SKILLVAULT Brand Logo */}
        <button
          type="button"
          onClick={() => { close(); setLocation('/'); }}
          className="group flex items-center gap-2 text-left cursor-pointer shrink-0 transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm md:text-base shadow-md shadow-violet-600/20">
            SV
          </div>
          <span className="font-heading font-black tracking-tight text-sm sm:text-base md:text-lg lg:text-xl text-white">
            SKILL<span className="text-violet-400">VAULT</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-3.5 md:gap-5 lg:gap-6 md:flex">
          <button
            type="button"
            onClick={() => navTo('#catalog', 'All Products')}
            className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            All Products
          </button>

          <button
            type="button"
            onClick={() => navTo('#catalog', 'Course')}
            className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            Courses
          </button>

          <button
            type="button"
            onClick={() => navTo('#catalog', 'Software')}
            className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            Software
          </button>

          {/* MORE DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setMoreDropdownOpen(true)}
            onMouseLeave={() => setMoreDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors py-2"
            >
              More <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180 text-violet-300' : ''}`} />
            </button>

            {moreDropdownOpen && (
              <div className="absolute left-0 top-full pt-1.5 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="rounded-xl border border-slate-800 bg-[#0c0e17]/95 p-1.5 shadow-2xl shadow-violet-950/60 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'All Products')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>🔥</span> All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Architecture & Design')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>📐</span> Architecture & Design
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Notes')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>📚</span> Notes / PDFs
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Hacks')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>⚡</span> Hacks & Tools
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Game')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>🎮</span> Games
                  </button>
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Blog')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-violet-200 transition-colors text-left"
                  >
                    <span>📝</span> Blogs
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE GLOWING CANVA PRO LINK */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-cyan-400/80 cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all"
            title="Active Canva Pro Section"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="text-xs font-extrabold tracking-wide uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
              Canva Pro
            </span>
            <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
              LIVE
            </span>
          </button>

          <button
            type="button"
            onClick={() => navTo('#why-us')}
            className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            Why Us
          </button>

          <button
            type="button"
            onClick={() => navTo('#faq')}
            className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Right Section: Offer Timer, Cart & Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Limited Time Offer Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-purple-950/40 shadow-sm">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300 text-[10px] font-bold">Ends:</span>
            <span className="font-mono text-amber-400 font-bold text-xs">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Shopping Cart Button */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-xl transition-colors cursor-pointer"
              title="View Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-violet-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg border border-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('login') : setLocation('/#login')}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('signup') : setLocation('/#signup')}
                  className="text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-md shadow-violet-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMyPurchases ? onOpenMyPurchases() : setLocation('/purchases')}
                  className="text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-violet-500/50 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-400" /> My Purchases
                </button>
                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                  <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" /> {user.name || user.email?.split('@')[0]}
                  </span>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      title="Logout"
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 md:hidden cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-[#0b0d14] px-5 py-4 md:hidden">
          <div className="max-w-7xl mx-auto flex flex-col gap-1">
            <button
              type="button"
              onClick={() => { close(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="my-2 py-3 px-3.5 rounded-xl border border-cyan-400/70 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-cyan-950/90 text-left text-xs sm:text-sm font-bold text-white cursor-pointer flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🎨</span>
                <span className="font-black uppercase tracking-wide text-cyan-300">Canva Pro Instant Access</span>
              </div>
              <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-sm">
                ₹99 OFFER
              </span>
            </button>

            <button type="button" onClick={() => navTo('#catalog', 'All Products')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>🔥 All Products</span>
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Course')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>🎓 Courses</span>
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Software')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>💻 Software</span>
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Architecture & Design')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>📐 Architecture & Design</span>
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Notes')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>📚 Notes / PDFs</span>
            </button>
            <button type="button" onClick={() => navTo('#why-us')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>⭐ Why Us</span>
            </button>
            <button type="button" onClick={() => navTo('#faq')} className="border-b border-slate-800/70 py-3 text-left text-xs sm:text-sm font-medium text-slate-200 cursor-pointer flex items-center justify-between hover:text-violet-300">
              <span>❓ FAQ</span>
            </button>

            {!user ? (
              <div className="flex gap-2 pt-3 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal ? onOpenAuthModal('login') : setLocation('/#login'); }}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Log In
                </button>
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal ? onOpenAuthModal('signup') : setLocation('/#signup'); }}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-800 mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { close(); onOpenMyPurchases ? onOpenMyPurchases() : setLocation('/purchases'); }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-violet-400" /> My Purchases
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { close(); onLogout(); }}
                    className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 cursor-pointer text-center"
                  >
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
