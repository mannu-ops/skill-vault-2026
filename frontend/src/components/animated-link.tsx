/**
 * Animated Link Component
 * Adds smooth color and underline animations to links
 */

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TRANSITION_DURATIONS, EASING } from '@/lib/animations';

interface AnimatedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  variant?: 'default' | 'underline' | 'glow';
  animated?: boolean;
}

export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  ({ children, className, variant = 'default', animated = true, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    const variants = {
      default: {
        whileHover: { color: 'hsl(269 100% 72%)' },
        whileTap: { scale: 0.98 },
      },
      underline: {
        whileHover: { color: 'hsl(269 100% 72%)' },
      },
      glow: {
        whileHover: {
          color: 'hsl(269 100% 72%)',
          textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
        },
      },
    };

    if (!animated) {
      return (
        <a
          ref={ref}
          className={cn('transition-colors duration-300', className)}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <motion.a
        ref={ref}
        className={cn('transition-all duration-300', className)}
        {...variants[variant]}
        transition={{
          duration: TRANSITION_DURATIONS.fast,
          ease: EASING.easeOut,
        }}
        {...props}
      >
        {children}
        {variant === 'underline' && (
          <motion.div
            className="h-0.5 bg-primary mt-1"
            initial={{ width: '0%' }}
            whileHover={{ width: '100%' }}
            transition={{ duration: TRANSITION_DURATIONS.fast }}
          />
        )}
      </motion.a>
    );
  }
);

AnimatedLink.displayName = 'AnimatedLink';
