/**
 * Animation Presets for Framer Motion
 * Consistent animation patterns across the entire website
 */

// Timing configurations
export const TRANSITION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const EASING = {
  easeOut: [0.25, 0.46, 0.45, 0.94],
  easeInOut: [0.42, 0, 0.58, 1],
  spring: { type: 'spring', stiffness: 100, damping: 15 },
  bounce: { type: 'spring', stiffness: 120, damping: 12 },
} as const;

// Button & Click Animations
export const buttonClick = {
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.98 },
    transition: EASING.easeOut,
  },
  fade: {
    whileHover: { opacity: 0.9 },
    whileTap: { opacity: 0.8 },
    transition: { duration: TRANSITION_DURATIONS.fast },
  },
  pulse: {
    whileHover: {
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
    },
    transition: { duration: TRANSITION_DURATIONS.normal },
  },
} as const;

// Modal & Dialog Animations
export const modalAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

export const backdropAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: TRANSITION_DURATIONS.fast },
} as const;

// Card & Content Animations
export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
  },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

export const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

// Drawer & Sidebar Animations
export const drawerAnimation = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

export const drawerBackdropAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: TRANSITION_DURATIONS.fast },
} as const;

// Dropdown & Popover Animations
export const dropdownAnimation = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: TRANSITION_DURATIONS.fast,
    ease: EASING.easeOut,
  },
} as const;

// Fade Animations
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: TRANSITION_DURATIONS.normal },
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

// Slide Animations
export const slideIn = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 50, opacity: 0 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

// Spinner & Loading Animations
export const spinnerAnimation = {
  animate: { rotate: 360 },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
} as const;

// Pulse Animation
export const pulseAnimation = {
  animate: { opacity: [0.5, 1, 0.5] },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const;

// List item stagger animation
export const listItemAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

export const containerAnimation = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

// Bounce Animation
export const bounceAnimation = {
  animate: { y: [0, -10, 0] },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: EASING.easeInOut,
  },
} as const;

// Scale & Rotate Animations
export const scaleIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { duration: TRANSITION_DURATIONS.normal },
} as const;

export const rotateIn = {
  initial: { rotate: -10, opacity: 0 },
  animate: { rotate: 0, opacity: 1 },
  exit: { rotate: -10, opacity: 0 },
  transition: { duration: TRANSITION_DURATIONS.normal },
} as const;

// Toast & Notification Animations
export const toastAnimation = {
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 400, opacity: 0 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

// Page transition animations
export const pageAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: TRANSITION_DURATIONS.normal,
    ease: EASING.easeOut,
  },
} as const;

// Glow effect for hover states
export const glowEffect = {
  whileHover: {
    boxShadow: [
      '0 0 10px rgba(139, 92, 246, 0.3)',
      '0 0 20px rgba(139, 92, 246, 0.5)',
      '0 0 10px rgba(139, 92, 246, 0.3)',
    ],
  },
  transition: {
    duration: 0.6,
    repeat: Infinity,
  },
} as const;

// Underline animation for links
export const underlineAnimation = {
  initial: { width: '0%' },
  whileHover: { width: '100%' },
  transition: { duration: TRANSITION_DURATIONS.fast },
} as const;

// Tooltip animation
export const tooltipAnimation = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: TRANSITION_DURATIONS.fast },
} as const;
