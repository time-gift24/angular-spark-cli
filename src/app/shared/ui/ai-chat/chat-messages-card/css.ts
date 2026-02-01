/**
 * Chat Messages Card Component - Tailwind CSS Utilities
 * Mineral & Time Theme - shadcn-inspired
 */

/**
 * Card container styles (no positioning - parent controls position)
 */
export const cardContainer = [
  'w-[380px] max-h-[60vh]',
  'overflow-visible',
  'transition-opacity duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
].join(' ');

/**
 * Fixed positioning variant (for when parent wants fixed positioning)
 */
export const cardFixed = ['fixed right-6 top-[90px]', 'z-[999]'].join(' ');

/**
 * Relative positioning variant (for when parent wants relative positioning)
 */
export const cardRelative = ['relative'].join(' ');

/**
 * Collapsed state
 */
export const cardCollapsed = [
  'max-h-0 opacity-0 p-0 m-0 overflow-hidden pointer-events-none translate-x-5',
].join(' ');

/**
 * Collapse toggle button
 */
export const collapseToggle = [
  'absolute top-2 right-2 w-8 h-8 rounded-lg',
  'bg-[oklch(0.48_0.07_195_/90%)]',
  'border-2 border-[oklch(0.48_0.07_195_/40%)]',
  'shadow-[0_2px_8px_oklch(0.28_0.03_185_/20%),0_0_0_1px_oklch(1_0_0_/10%)]',
  'cursor-pointer',
  'flex items-center justify-center',
  'transition-all duration-150 ease-in-out',
  'z-10',
  'p-0 text-white',
  'hover:bg-[oklch(0.48_0.07_195)]',
  'hover:scale-[1.1]',
  'hover:shadow-[0_4px_12px_oklch(0.28_0.03_185_/25%),0_0_0_2px_oklch(0.48_0.07_195_/50%)]',
  'active:scale-[0.95]',
  'focus-visible:outline-2 focus-visible:outline-[oklch(0.48_0.07_195)] focus-visible:outline-offset-2',
].join(' ');

/**
 * Collapse toggle SVG
 */
export const collapseToggleIcon = [
  'w-5 h-5 stroke-[2.5]',
  'transition-transform duration-150 ease-in-out',
  'hover:scale-[1.1]',
].join(' ');

/**
 * Messages container
 */
export const messagesContainer = [
  'max-h-full px-4 py-3 pb-4',
  'overflow-y-auto',
  'flex flex-col gap-3',
].join(' ');

/**
 * Message wrapper
 */
export const messageWrapper = ['flex w-full'].join(' ');

/**
 * User message alignment
 */
export const messageUser = ['justify-end'].join(' ');

/**
 * Assistant message alignment
 */
export const messageAssistant = ['justify-start'].join(' ');

/**
 * Message bubble base
 */
export const messageBubble = [
  'max-w-[85%]',
  'px-3.5 py-2.5',
  'rounded-xl',
  'text-xs leading-snug',
  'font-sans',
].join(' ');

/**
 * User message bubble
 */
export const messageBubbleUser = ['bg-[oklch(0.42_0.04_195)]', 'text-white'].join(' ');

/**
 * Assistant message bubble
 */
export const messageBubbleAssistant = [
  'bg-[oklch(0.88_0.015_85_/80%)]',
  'border border-[oklch(0.48_0.07_195_/20%)]',
  'text-[oklch(0.28_0.03_185)]',
].join(' ');

/**
 * AI bubble content
 */
export const aiBubbleContent = ['flex flex-col gap-2'].join(' ');

/**
 * AI bubble paragraph
 */
export const aiBubbleParagraph = ['m-0'].join(' ');

/**
 * Action buttons container
 */
export const actionButtonsContainer = ['flex gap-2 flex-wrap'].join(' ');

/**
 * Action button
 */
export const actionButton = [
  'px-3 py-1.5',
  'rounded-md',
  'bg-[oklch(0.48_0.07_195_/10%)]',
  'border border-[oklch(0.48_0.07_195_/30%)]',
  'text-[oklch(0.48_0.07_195)]',
  'text-xs font-medium',
  'font-sans',
  'cursor-pointer',
  'transition-all duration-150 ease-in-out',
  'inline-flex items-center gap-1',
  'hover:bg-[oklch(0.48_0.07_195_/20%)]',
  'hover:border-[oklch(0.48_0.07_195_/50%)]',
  'focus-visible:outline-2 focus-visible:outline-[oklch(0.48_0.07_195)] focus-visible:outline-offset-2',
].join(' ');

/**
 * Action icon
 */
export const actionIcon = ['text-xs'].join(' ');
