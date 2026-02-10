/**
 * Status Badges Component - Tailwind CSS Utilities
 * Using CSS variables for theme support
 */

/**
 * Status badges container
 */
export const statusBadgesContainer = [
  'flex gap-2 flex-wrap justify-start py-1',
  'transition-all duration-300 ease-in-out',
].join(' ');

/**
 * Badge base styles
 */
export const badgeBase = [
  'flex items-center gap-1.5',
  'px-2.5 py-1',
  'rounded-xl',
  'text-xs font-medium',
  'whitespace-nowrap',
  'transition-all duration-150 ease-in-out',
  'user-select-none',
].join(' ');

/**
 * Badge - Thinking (using primary color)
 */
export const badgeThinking = [
  'bg-primary/15',
  'border border-primary/40',
  'text-primary',
].join(' ');

/**
 * Badge - Typing (using accent color)
 */
export const badgeTyping = [
  'bg-accent/15',
  'border border-accent/40',
  'text-accent',
].join(' ');

/**
 * Badge - Done (using secondary color)
 */
export const badgeDone = [
  'bg-secondary/30',
  'border border-secondary/50',
  'text-foreground',
].join(' ');

/**
 * Badge - Error (using destructive color)
 */
export const badgeError = [
  'bg-destructive/15',
  'border border-destructive/40',
  'text-destructive',
].join(' ');

/**
 * Pulsing dot (Thinking)
 */
export const pulsingDot = [
  'w-2 h-2 rounded-full',
  'bg-primary',
  'shadow-[0_0_6px_var(--primary)/60]',
].join(' ');

/**
 * Typing indicator container
 */
export const typingIndicator = ['flex gap-0.5 items-center', 'w-4 h-2.5'].join(' ');

/**
 * Typing dot
 */
export const typingDot = ['w-[3px] h-[3px] rounded-full', 'bg-accent'].join(' ');

/**
 * Icon (Done/Error)
 */
export const badgeIcon = ['flex items-center justify-center', 'text-xs font-semibold'].join(' ');

/**
 * Badge text
 */
export const badgeText = ['text-xs'].join(' ');
