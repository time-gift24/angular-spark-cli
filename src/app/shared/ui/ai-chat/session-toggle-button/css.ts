/**
 * Session Toggle Button Component - Tailwind CSS Utilities
 * Mineral & Time Theme - shadcn-inspired
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
 * Session toggle button base
 */
export const sessionToggleBase = [
  'w-14 h-14 rounded-7',
  'bg-[oklch(0.48_0.07_195_/98%)]',
  'backdrop-blur-[20px]',
  '-webkit-backdrop-blur-[20px]',
  'border-0',
  'shadow-[0_6px_20px_oklch(0.28_0.03_185_/25%),0_0_0_3px_oklch(0.48_0.07_195_/30%)]',
  'cursor-pointer',
  'flex items-center justify-center',
  'transition-all duration-300 ease-in-out',
  'z-[1000]',
  'p-0 text-white',
  'hover:bg-[oklch(0.48_0.07_195)]',
  'hover:scale-[1.08]',
  'hover:shadow-[0_8px_24px_oklch(0.28_0.03_185_/30%),0_0_0_4px_oklch(0.48_0.07_195_/40%)]',
  'active:scale-[0.95]',
  'focus-visible:outline-2 focus-visible:outline-[oklch(0.48_0.07_195)] focus-visible:outline-offset-2',
].join(' ');

/**
 * Has badge pulse animation
 */
export const hasBadgePulse = ['animate-pulse'].join(' ');

/**
 * Notification badge
 */
export const notificationBadge = [
  'absolute top-0.5 right-0.5',
  'w-[14px] h-[14px] rounded-[7px]',
  'bg-[oklch(0.50_0.20_25)]',
  'border-2 border-[oklch(0.48_0.07_195_/98%)]',
  'shadow-[0_2px_6px_oklch(0.28_0.03_185_/40%)]',
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
