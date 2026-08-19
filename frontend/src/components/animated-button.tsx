/**
 * Animated Button Component
 * Wraps button elements with smooth animations
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonClick, EASING } from '@/lib/animations';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'scale' | 'fade' | 'pulse';
  animationDuration?: number;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, variant = 'scale', animationDuration, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    const variants = {
      scale: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.98 },
      },
      fade: {
        whileHover: { opacity: 0.9 },
        whileTap: { opacity: 0.8 },
      },
      pulse: {
        whileHover: {
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
        },
      },
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'transition-all duration-300 ease-out',
          className
        )}
        {...variants[variant]}
        whileFocus={{ outline: 'none' }}
        transition={{
          duration: animationDuration || 0.3,
          ease: EASING.easeOut,
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
