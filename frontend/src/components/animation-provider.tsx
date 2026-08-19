/**
 * Animation Provider
 * Configures Framer Motion globally and provides animation context
 */

import { type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';

interface AnimationProviderProps {
  children: ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  return <>{children}</>;
}

// Export preset animations for easy use
export * from '@/lib/animations';
