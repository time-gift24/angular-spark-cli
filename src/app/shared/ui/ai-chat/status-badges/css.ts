/**
 * Status Badges Component - Tailwind CSS Utilities
 * Mineral & Time Theme - shadcn-inspired
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
 * Badge - Thinking (primary green)
 */
export const badgeThinking = [
  'bg-[oklch(0.48_0.07_195_/15%)]',
  'border border-[oklch(0.48_0.07_195_/40%)]',
  'text-[oklch(0.48_0.07_195)]',
].join(' ');

/**
 * Badge - Typing (cyan/azurite)
 */
export const badgeTyping = [
  'bg-[oklch(0.60_0.08_210_/15%)]',
  'border border-[oklch(0.60_0.08_210_/40%)]',
  'text-[oklch(0.60_0.08_210)]',
].join(' ');

/**
 * Badge - Done (light green)
 */
export const badgeDone = [
  'bg-[oklch(0.55_0.06_195_/15%)]',
  'border border-[oklch(0.55_0.06_195_/40%)]',
  'text-[oklch(0.55_0.06_195)]',
].join(' ');

/**
 * Badge - Error (red/cinnabar)
 */
export const badgeError = [
  'bg-[oklch(0.50_0.20_25_/15%)]',
  'border border-[oklch(0.50_0.20_25_/40%)]',
  'text-[oklch(0.50_0.20_25)]',
].join(' ');

/**
 * Pulsing dot (Thinking)
 */
export const pulsingDot = [
  'w-2 h-2 rounded-full',
  'bg-[oklch(0.48_0.07_195)]',
  'shadow-[0_0_6px_oklch(0.48_0.07_195_/60%)]',
].join(' ');

/**
 * Typing indicator container
 */
export const typingIndicator = ['flex gap-0.5 items-center', 'w-4 h-2.5'].join(' ');

/**
 * Typing dot
 */
export const typingDot = ['w-[3px] h-[3px] rounded-full', 'bg-[oklch(0.60_0.08_210)]'].join(' ');

/**
 * Icon (Done/Error)
 */
export const badgeIcon = ['flex items-center justify-center', 'text-xs font-semibold'].join(' ');

/**
 * Badge text
 */
export const badgeText = ['text-xs'].join(' ');
