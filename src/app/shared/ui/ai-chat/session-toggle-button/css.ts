/**
 * Session Toggle Button Component - Tailwind CSS Utilities
 * Using CSS variables for theme support
 */

/**
 * Fixed positioning (default)
 */
export const fixedPosition = ['fixed top-6 right-6'].join(' ');

/**
 * Relative positioning (for wrapper component)
 */
export const relativePosition = ['relative'].join(' ');

/**
 * Session toggle button base - using theme CSS variables
 */
export const sessionToggleBase = [
  'w-14 h-14 rounded-7',
  'bg-primary/98',
  'backdrop-blur-[20px]',
  '-webkit-backdrop-blur-[20px]',
  'border-0',
  'shadow-[var(--shadow-control-hover)]',
  'ring-2 ring-primary/30',
  'cursor-pointer',
  'flex items-center justify-center',
  'transition-transform duration-[350ms] ease-[var(--ease-spring-snappy)]',
  'z-[1000]',
  'p-0 text-primary-foreground',
  'hover:bg-primary',
  'hover:scale-[1.08]',
  'hover:shadow-[var(--shadow-control-active)]',
  'hover:ring-primary/40',
  'active:scale-[0.95]',
  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
].join(' ');

/**
 * Has badge pulse animation
 */
export const hasBadgePulse = ['animate-pulse'].join(' ');

/**
 * Notification badge - using theme CSS variables
 */
export const notificationBadge = [
  'absolute top-0.5 right-0.5',
  'w-[14px] h-[14px] rounded-[7px]',
  'bg-destructive',
  'border-2 border-primary/98',
  'shadow-[var(--shadow-control-active)]',
].join(' ');

/**
 * SVG icon
 */
export const toggleIcon = [
  'w-7 h-7 stroke-[2.5]',
  'transition-transform duration-150 ease-in-out',
  'hover:scale-[1.1]',
].join(' ');

/**
 * Responsive mobile styles
 */
export const mobileToggle = ['top-4 right-4', 'w-13 h-13'].join(' ');

export const mobileIcon = ['w-6.5 h-6.5'].join(' ');
