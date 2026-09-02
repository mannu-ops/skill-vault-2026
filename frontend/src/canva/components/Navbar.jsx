import React, { useState } from 'react';
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
  Sparkles,
  Layers,
  BookOpen,
  Code2,
  FileText,
  Zap,
  Gamepad2,
  PenTool
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
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  const close = () => {
    setMenuOpen(false);
    setProductsDropdownOpen(false);
  };

  const navTo = (targetId, category) => {
    close();
    if (category) {
      sessionStorage.setItem('sv_selected_category', category);
    }
    const isHome = location === '/' || location === '';
    if (isHome) {
      const el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setLocation('/');
      setTimeout(() => {
        const el = document.querySelector(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const isCanvaPage = location === '/canva' || location === '/canva-pro';

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-white/[0.08] bg-[#08090E]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => { close(); setLocation('/'); }}
          className="group flex items-center gap-2.5 text-left cursor-pointer shrink-0 transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-violet-600/20">
            SV
          </div>
          <span className="font-heading font-black tracking-tight text-base sm:text-lg text-white">
            SKILL<span className="text-violet-400">VAULT</span>
          </span>
        </button>

        {/* Center Desktop Navigation - Spacious & Organized */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          
          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180 text-violet-400' : ''}`} />
            </button>

            {productsDropdownOpen && (
              <div className="absolute left-0 top-full pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="rounded-2xl border border-slate-800 bg-[#0d0f19]/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-0.5">
                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'All Products')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Layers className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">All Products</div>
                      <div className="text-[10px] text-slate-500 font-normal">Browse entire vault</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Course')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Video Courses</div>
                      <div className="text-[10px] text-slate-500 font-normal">Bootcamps & tutorials</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Software')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Software & Tools</div>
                      <div className="text-[10px] text-slate-500 font-normal">Scripts & templates</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Notes')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Study Notes & PDFs</div>
                      <div className="text-[10px] text-slate-500 font-normal">Cheat-sheets & roadmaps</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo('#catalog', 'Hacks')}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div>
                      <div className="text-slate-200">Hacks & Cheats</div>
                      <div className="text-[10px] text-slate-500 font-normal">Productivity boosters</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canva Pro Pill - Sleek & Highlighted */}
          <button
            type="button"
            onClick={() => {
              close();
              if (isCanvaPage) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setLocation('/canva');
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isCanvaPage
                ? 'bg-gradient-to-r from-purple-600/25 via-cyan-500/25 to-purple-600/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Canva Pro</span>
            <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight">
              VIP
            </span>
          </button>

          {/* Why Us */}
          <button
            type="button"
            onClick={() => navTo('#why-us')}
            className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            Why Us
          </button>

          {/* FAQ */}
          <button
            type="button"
            onClick={() => navTo('#faq')}
            className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            FAQ
          </button>

        </nav>

        {/* Right Section: Clean Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Shopping Cart Button */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-violet-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#08090E]">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('login') : setLocation('/#login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('signup') : setLocation('/#signup')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMyPurchases ? onOpenMyPurchases() : setLocation('/purchases')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-400" /> My Purchases
                </button>
                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                  <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" /> {user.name || user.email?.split('@')[0]}
                  </span>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      title="Logout"
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-[#0c0e17]/98 px-5 py-4 md:hidden shadow-2xl backdrop-blur-2xl">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => { close(); if (!isCanvaPage) setLocation('/canva'); }}
              className="w-full py-2.5 px-3 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-purple-950/60 to-cyan-950/60 text-left text-xs font-bold text-white flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🎨</span>
                <span className="text-cyan-300 font-bold">Canva Pro Portal</span>
              </div>
              <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                ₹99
              </span>
            </button>

            <button type="button" onClick={() => navTo('#catalog', 'All Products')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Layers className="w-3.5 h-3.5 text-violet-400" /> All Products
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Course')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Video Courses
            </button>
            <button type="button" onClick={() => navTo('#catalog', 'Software')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Software & Tools
            </button>
            <button type="button" onClick={() => navTo('#why-us')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Why Us
            </button>
            <button type="button" onClick={() => navTo('#faq')} className="w-full py-2.5 text-left text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-slate-800/60">
              <span>❓</span> FAQ
            </button>

            {!user ? (
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal ? onOpenAuthModal('login') : setLocation('/#login'); }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg text-center"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { close(); onOpenAuthModal ? onOpenAuthModal('signup') : setLocation('/#signup'); }}
                  className="flex-1 py-2 text-xs font-bold bg-violet-600 text-white rounded-lg text-center"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => { close(); onOpenMyPurchases ? onOpenMyPurchases() : setLocation('/purchases'); }}
                  className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-violet-400" /> My Purchases
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { close(); onLogout(); }}
                    className="w-full py-1 text-xs text-rose-400 text-center"
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
