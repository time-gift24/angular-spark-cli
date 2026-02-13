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
  'chat-input-wrapper relative overflow-hidden rounded-lg bg-background/95',
  'transition-colors focus-within:ring-1 focus-within:ring-primary/20',
].join(' ');

/**
 * Input area padding
 */
export const inputArea = ['px-2.5 pt-2 pb-1'].join(' ');

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
export const toolbar = ['flex justify-between items-center', 'px-2 py-1.5', 'gap-2'].join(' ');

/**
 * Left tool buttons container
 */
export const toolButtonsLeft = ['flex gap-1 items-center'].join(' ');

/**
 * Right action buttons container
 */
export const actionButtonsRight = ['flex gap-1 items-center'].join(' ');

/**
 * SVG icon for toolbar buttons
 */
export const toolbarIcon = ['w-[15px] h-[15px] stroke-[1.75]'].join(' ');

/**
 * Send button SVG
 */
export const sendIcon = [
  'w-[14px] h-[14px] stroke-2',
  'transition-transform duration-200 ease-in-out',
].join(' ');
