import type { Course } from '@/data/courses';

export type ThemeColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet';

export interface ThemeClasses {
  badge: string;
  accentText: string;
  borderHover: string;
  buttonBg: string;
  pill: string;
}

const THEME_MAP: Record<ThemeColor, ThemeClasses> = {
  cyan: {
    badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    accentText: 'text-cyan-300',
    borderHover: 'hover:border-cyan-400/40',
    buttonBg: 'bg-cyan-300 text-slate-950 hover:bg-cyan-200',
    pill: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  },
  emerald: {
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    accentText: 'text-emerald-300',
    borderHover: 'hover:border-emerald-400/40',
    buttonBg: 'bg-emerald-300 text-slate-950 hover:bg-emerald-200',
    pill: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  },
  amber: {
    badge: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    accentText: 'text-amber-300',
    borderHover: 'hover:border-amber-400/40',
    buttonBg: 'bg-amber-300 text-slate-950 hover:bg-amber-200',
    pill: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  },
  rose: {
    badge: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    accentText: 'text-rose-300',
    borderHover: 'hover:border-rose-400/40',
    buttonBg: 'bg-rose-300 text-slate-950 hover:bg-rose-200',
    pill: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  },
  indigo: {
    badge: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
    accentText: 'text-indigo-300',
    borderHover: 'hover:border-indigo-400/40',
    buttonBg: 'bg-indigo-300 text-slate-950 hover:bg-indigo-200',
    pill: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/20',
  },
  violet: {
    badge: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
    accentText: 'text-violet-300',
    borderHover: 'hover:border-violet-400/40',
    buttonBg: 'bg-violet-300 text-slate-950 hover:bg-violet-200',
    pill: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
  },
};

export function getThemeClasses(themeColor: Course['themeColor']): ThemeClasses {
  return THEME_MAP[themeColor] || THEME_MAP.violet;
}

export const THEME_CACHE = new Map<string, ThemeClasses>();

export function getCachedThemeClasses(themeColor: Course['themeColor']): ThemeClasses {
  if (!THEME_CACHE.has(themeColor)) {
    THEME_CACHE.set(themeColor, getThemeClasses(themeColor));
  }
  return THEME_CACHE.get(themeColor)!;
}
