import {
  Terminal,
  Server,
  Sparkles,
  Layers3,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type IconName = 'Server' | 'Sparkles' | 'Layers3' | 'GitBranch' | 'ShieldCheck' | 'Terminal';

const ICON_MAP: Record<IconName, LucideIcon> = {
  Server,
  Sparkles,
  Layers3,
  GitBranch,
  ShieldCheck,
  Terminal,
};

export function getCourseIcon(iconName: string): LucideIcon {
  return ICON_MAP[(iconName as IconName) || 'Terminal'] || Terminal;
}

// Memoized cache for icon lookup
const ICON_CACHE = new Map<string, LucideIcon>();

export function getCachedCourseIcon(iconName: string): LucideIcon {
  if (!ICON_CACHE.has(iconName)) {
    ICON_CACHE.set(iconName, getCourseIcon(iconName));
  }
  return ICON_CACHE.get(iconName)!;
}
