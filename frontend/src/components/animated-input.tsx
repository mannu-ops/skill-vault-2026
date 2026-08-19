/**
 * Animated Input Component
 * Smooth focus and change animations for form inputs
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  animated?: boolean;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, label, error, animated = true, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    if (!animated) {
      return (
        <div className="space-y-2">
          {label && <label className="text-sm font-medium">{label}</label>}
          <input
            ref={ref}
            className={cn(
              'w-full px-3 py-2 border rounded-md transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            {...props}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            className="text-sm font-medium block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.label>
        )}
        <motion.input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-md transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          whileFocus={{
            scale: 1.02,
            boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
          }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        {error && (
          <motion.p
            className="text-xs text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
