/**
 * Animated Card Component
 * Adds hover lift and shadow animations to cards
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TRANSITION_DURATIONS, EASING } from '@/lib/animations';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: 'lift' | 'glow' | 'scale' | 'none';
  delay?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hover = 'lift', delay = 0, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    const hoverVariants = {
      lift: {
        y: -8,
        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
      },
      glow: {
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
      },
      scale: {
        scale: 1.02,
      },
      none: {},
    };

    return (
      <motion.div
        ref={ref}
        className={cn('transition-all duration-300', className)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={hover !== 'none' ? hoverVariants[hover] : undefined}
        transition={{
          duration: TRANSITION_DURATIONS.normal,
          ease: EASING.easeOut,
          delay,
        }}
        viewport={{ once: true, amount: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
