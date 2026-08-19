# 🎬 Animation & Transitions Guide

## Overview

Your Skill Vault frontend now has a comprehensive animation system integrated with Framer Motion. This guide explains how to use animations throughout your application.

## Quick Start

### 1. Animation Presets (`src/lib/animations.ts`)

Pre-built animation configurations for common UI patterns:

```typescript
import {
  buttonClick,        // Button hover/tap animations
  modalAnimation,     // Modal appear/disappear
  cardHover,         // Card lift on hover
  fadeInUp,          // Fade and slide up
  slideIn,           // Slide animation
  drawerAnimation,   // Drawer slide
} from '@/lib/animations';
```

### 2. Animated Components

#### AnimatedButton
Wraps buttons with smooth scale/fade/pulse animations on click:

```tsx
import { AnimatedButton } from '@/components/animated-button';

<AnimatedButton variant="scale">
  Click Me!
</AnimatedButton>
```

Variants:
- `scale` - Scale up on hover, scale down on click (default)
- `fade` - Fade opacity on hover
- `pulse` - Glow effect on hover

#### AnimatedCard
Adds lift and shadow animations to cards:

```tsx
import { AnimatedCard } from '@/components/animated-card';

<AnimatedCard hover="lift" delay={0.1}>
  Card content here
</AnimatedCard>
```

Hover Effects:
- `lift` - Lifts card on hover with shadow (default)
- `glow` - Adds glow effect
- `scale` - Scales up
- `none` - No hover effect

#### AnimatedLink
Smooth color and underline animations for links:

```tsx
import { AnimatedLink } from '@/components/animated-link';

<AnimatedLink variant="underline">
  Click me
</AnimatedLink>
```

Variants:
- `default` - Color change and scale
- `underline` - Animated underline on hover
- `glow` - Glowing text effect

#### AnimatedInput
Form inputs with focus animations:

```tsx
import { AnimatedInput } from '@/components/animated-input';

<AnimatedInput
  label="Email"
  placeholder="Enter email"
  error={error}
/>
```

#### AnimatedModalOverlay & AnimatedDrawer
Modals and drawers with slide/fade animations:

```tsx
import { AnimatedModalOverlay, AnimatedDrawer } from '@/components/animated-modal';

<AnimatedModalOverlay isOpen={isOpen} onClose={onClose}>
  <div className="bg-card p-6 rounded-lg">
    Modal content
  </div>
</AnimatedModalOverlay>

<AnimatedDrawer isOpen={isOpen} onClose={onClose} side="left">
  <div className="bg-card h-full p-6">
    Drawer content
  </div>
</AnimatedDrawer>
```

### 3. Custom Animation Hooks (`src/hooks/use-animations.ts`)

Reusable hooks for common animation patterns:

#### useAnimationOnMount
Trigger animations when component mounts:

```tsx
import { useAnimationOnMount } from '@/hooks/use-animations';

export function MyComponent() {
  const { controls, hasMounted } = useAnimationOnMount(0.2); // 200ms delay

  return (
    <motion.div
      initial="initial"
      animate={controls}
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      }}
    >
      Content
    </motion.div>
  );
}
```

#### useScrollAnimation
Animate elements when they scroll into view:

```tsx
import { useScrollAnimation } from '@/hooks/use-animations';

export function MyComponent() {
  const { ref, controls } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={controls}
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
    >
      Content
    </motion.div>
  );
}
```

#### useHoverAnimation
Track hover state for animations:

```tsx
import { useHoverAnimation } from '@/hooks/use-animations';

export function MyComponent() {
  const { isHovered, onMouseEnter, onMouseLeave } = useHoverAnimation();

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {isHovered && <span>Hovered!</span>}
    </div>
  );
}
```

#### useClickAnimation
Create ripple effects on click:

```tsx
import { useClickAnimation } from '@/hooks/use-animations';

export function MyComponent() {
  const { clicks, handleClick } = useClickAnimation();

  return (
    <div onClick={handleClick} className="relative overflow-hidden">
      {clicks.map((click) => (
        <motion.div
          key={click.id}
          className="absolute w-10 h-10 bg-primary rounded-full pointer-events-none"
          style={{ left: click.x - 20, top: click.y - 20 }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </div>
  );
}
```

#### useSmoothScroll
Smooth scroll to elements:

```tsx
import { useSmoothScroll } from '@/hooks/use-animations';

export function MyComponent() {
  const { scrollTo } = useSmoothScroll();

  return (
    <>
      <button onClick={() => scrollTo('#target')}>
        Scroll to target
      </button>
      <div id="target">Target content</div>
    </>
  );
}
```

## Direct Framer Motion Usage

For more complex animations, use Framer Motion directly with the presets:

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, cardHover } from '@/lib/animations';

export function MyComponent() {
  return (
    <motion.div {...fadeInUp}>
      <motion.div {...cardHover}>
        Content
      </motion.div>
    </motion.div>
  );
}
```

## Global CSS Transitions

All interactive elements have smooth transitions globally:

- Buttons, links, and inputs automatically transition on all properties
- Focus states have smooth ring animations
- Scroll behavior is smooth (can be disabled for reduced motion)

## Timing Presets

All animations use consistent durations:

```typescript
TRANSITION_DURATIONS = {
  fast: 0.2,      // 200ms - quick feedback
  normal: 0.3,    // 300ms - standard interaction
  slow: 0.5,      // 500ms - emphasis
  verySlow: 0.8,  // 800ms - grand entrance
}
```

## Easing Functions

```typescript
EASING = {
  easeOut: [0.25, 0.46, 0.45, 0.94],      // Smooth exit
  easeInOut: [0.42, 0, 0.58, 1],          // Smooth both ways
  spring: { type: 'spring', ... },        // Bouncy
  bounce: { type: 'spring', ... },        // Extra bouncy
}
```

## Integration Examples

### Form with Animated Inputs

```tsx
import { AnimatedInput } from '@/components/animated-input';
import { AnimatedButton } from '@/components/animated-button';

export function LoginForm() {
  const [errors, setErrors] = useState({});

  return (
    <div className="space-y-4">
      <AnimatedInput
        label="Email"
        placeholder="Enter email"
        error={errors.email}
      />
      <AnimatedInput
        label="Password"
        type="password"
        placeholder="Enter password"
        error={errors.password}
      />
      <AnimatedButton variant="scale">
        Sign In
      </AnimatedButton>
    </div>
  );
}
```

### Course Card Grid with Animations

```tsx
import { AnimatedCard } from '@/components/animated-card';
import { containerAnimation, listItemAnimation } from '@/lib/animations';

export function CourseGrid() {
  return (
    <motion.div
      variants={containerAnimation}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {courses.map((course, i) => (
        <motion.div key={course.id} variants={listItemAnimation}>
          <AnimatedCard hover="lift" delay={i * 0.1}>
            {/* Card content */}
          </AnimatedCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## Best Practices

1. **Use preset animations** - Consistent timing and easing across the app
2. **Keep durations short** - fast (200ms) or normal (300ms) for most interactions
3. **Respect prefers-reduced-motion** - Animations disable for users with motion preferences
4. **Stagger animations** - Use delays for list items and sequential elements
5. **Use whileHover/whileTap** - Better UX than onHover/onClick handlers
6. **Combine animations** - Stack multiple animations for complex effects

## Performance Tips

- Use `shouldReduceMotion` hook for heavy animations
- Lazy load animated components
- Use GPU-accelerated properties (transform, opacity)
- Avoid animating layout shifts
- Use `initial={false}` to skip mount animations when not needed

## Troubleshooting

**Animations not playing?**
- Check if component is wrapped with `AnimatePresence` when using exit animations
- Ensure `initial`, `animate`, `exit` are all defined
- Check animation duration - may be too fast to see

**Performance issues?**
- Reduce number of animated elements
- Use `motion.div` instead of wrapping multiple elements
- Disable animations for mobile if needed
- Check browser DevTools performance tab

**Accessibility?**
- All animations respect `prefers-reduced-motion`
- Focus states remain visible
- Keyboard navigation unchanged
- ARIA labels preserved

## Next Steps

1. Replace existing buttons with `AnimatedButton`
2. Wrap course cards with `AnimatedCard`
3. Add animations to modals and drawers
4. Use hooks for scroll-triggered animations
5. Test on different browsers and devices
