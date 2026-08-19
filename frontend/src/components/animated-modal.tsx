/**
 * Animated Modal Overlay
 * Provides smooth animations for modals and dialogs
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  modalAnimation,
  backdropAnimation,
  TRANSITION_DURATIONS,
  EASING,
} from '@/lib/animations';

interface AnimatedModalOverlayProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export const AnimatedModalOverlay = forwardRef<HTMLDivElement, AnimatedModalOverlayProps>(
  ({ isOpen, onClose, children, className, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <motion.div
        ref={ref}
        className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
        {...backdropAnimation}
        onClick={onClose}
        {...props}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          {...backdropAnimation}
        />
        {/* Modal content */}
        <motion.div
          className="relative z-10"
          {...modalAnimation}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }
);

AnimatedModalOverlay.displayName = 'AnimatedModalOverlay';

interface AnimatedDrawerProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
}

export const AnimatedDrawer = forwardRef<HTMLDivElement, AnimatedDrawerProps>(
  ({ isOpen, onClose, children, className, side = 'left', onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
    if (!isOpen) return null;

    const slideDirection = side === 'left' ? '-100%' : '100%';

    return (
      <motion.div
        ref={ref}
        className={cn('fixed inset-0 z-50', className)}
        {...backdropAnimation}
        onClick={onClose}
        {...props}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          {...backdropAnimation}
        />
        {/* Drawer content */}
        <motion.div
          className="absolute inset-y-0 z-10 max-w-sm"
          style={{
            [side]: 0,
          }}
          initial={{ x: slideDirection, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDirection, opacity: 0 }}
          transition={{
            duration: TRANSITION_DURATIONS.normal,
            ease: EASING.easeOut,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }
);

AnimatedDrawer.displayName = 'AnimatedDrawer';
