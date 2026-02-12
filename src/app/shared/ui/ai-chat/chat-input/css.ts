/**
 * Chat Input Component - Tailwind CSS Utilities
 * Mineral & Time Theme - shadcn integration
 *
 * Note: Button styles now use shadcn ButtonComponent
 * Custom button styles are in chat-input.component.css
 */

/**
 * Base container styles
 * Note: max-width should be controlled by parent container
 */
export const inputContainer = ['relative w-full'].join(' ');

/**
 * Input wrapper styles
 */
export const inputWrapper = [
  'relative overflow-hidden rounded-xl border border-border/70 bg-background',
  'shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
  'transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
].join(' ');

/**
 * Input area padding
 */
export const inputArea = ['px-3 pt-2.5 pb-1'].join(' ');

/**
 * Textarea field styles (layout only, colors in CSS)
 */
export const inputField = [
  'w-full min-h-6 max-h-[120px] bg-transparent border-none',
  'font-sans text-[13px] font-normal leading-5',
  'outline-none resize-none overflow-y-auto',
  'p-0',
].join(' ');

/**
 * Toolbar container
 */
export const toolbar = ['flex justify-between items-center', 'px-2.5 py-1 pb-2', 'gap-1.5'].join(
  ' ',
);

/**
 * Left tool buttons container
 */
export const toolButtonsLeft = ['flex gap-0.5 items-center'].join(' ');

/**
 * Right action buttons container
 */
export const actionButtonsRight = ['flex gap-0.5 items-center'].join(' ');

/**
 * SVG icon for toolbar buttons
 */
export const toolbarIcon = ['w-4 h-4 stroke-[1.75]'].join(' ');

/**
 * Send button SVG
 */
export const sendIcon = [
  'w-[14px] h-[14px] stroke-2',
  'transition-transform duration-200 ease-in-out',
  'group-hover/send:translate-x-px group-hover/send:translate-y-px',
].join(' ');
