/**
 * Chat Input Component - Tailwind CSS Utilities
 * Mineral & Time Theme - shadcn-inspired
 */

/**
 * Base container styles
 */
export const inputContainer = [
  'relative w-full max-w-[768px] mx-auto mb-4',
].join(' ');

/**
 * Input wrapper styles
 */
export const inputWrapper = [
  'relative',
].join(' ');

/**
 * Input area padding
 */
export const inputArea = [
  'px-4 py-3 pb-2',
].join(' ');

/**
 * Textarea field styles
 */
export const inputField = [
  'w-full min-h-6 max-h-[120px] bg-transparent border-none',
  'font-sans text-sm font-normal leading-snug',
  'outline-none resize-none overflow-y-auto',
  'p-0',
].join(' ');

/**
 * Toolbar container
 */
export const toolbar = [
  'flex justify-between items-center',
  'px-3 py-1.5 pb-2.5',
  'gap-2',
].join(' ');

/**
 * Left tool buttons container
 */
export const toolButtonsLeft = [
  'flex gap-0.5 items-center',
].join(' ');

/**
 * Right action buttons container
 */
export const actionButtonsRight = [
  'flex gap-1 items-center',
].join(' ');

/**
 * Icon button base styles
 */
export const iconButton = [
  'w-[30px] h-[30px] rounded-lg bg-transparent border-0',
  'cursor-pointer flex items-center justify-center',
  'transition-all duration-150 ease-in-out',
  'p-0',
].join(' ');

/**
 * Icon button default color
 */
export const iconButtonDefault = [
  'text-[oklch(0.50_0.02_185)]',
  'hover:bg-[oklch(0.48_0.07_195_/8%)]',
  'hover:text-[oklch(0.48_0.07_195)]',
  'focus-visible:outline-2 focus-visible:outline-[oklch(0.48_0.07_195_/50%)] focus-visible:outline-offset-1',
].join(' ');

/**
 * Voice button special hover style
 */
export const voiceButtonHover = [
  'hover:bg-[oklch(0.70_0.12_75_/10%)]',
  'hover:text-[oklch(0.70_0.12_75)]',
].join(' ');

/**
 * Send button base styles
 */
export const sendButton = [
  'w-[30px] h-[30px] rounded-full',
  'bg-[oklch(0.85_0.015_85)]',
  'border border-[oklch(0.48_0.07_195_/15%)]',
  'cursor-not-allowed',
  'flex items-center justify-center',
  'transition-all duration-200 ease-in-out',
  'text-[oklch(0.50_0.02_185)]',
  'p-0 opacity-50',
].join(' ');

/**
 * Send button active state
 */
export const sendButtonActive = [
  'cursor-pointer',
  'bg-[oklch(0.48_0.07_195)]',
  'border-[oklch(0.48_0.07_195)]',
  'text-[oklch(0.98_0.01_85)]',
  'opacity-100',
  'hover:bg-[oklch(0.42_0.08_195)]',
  'hover:scale-[1.06]',
  'active:scale-[0.96]',
].join(' ');

/**
 * Send button focus style
 */
export const sendButtonFocus = [
  'focus-visible:outline-2 focus-visible:outline-[oklch(0.48_0.07_195_/50%)] focus-visible:outline-offset-2',
].join(' ');

/**
 * SVG icon for toolbar buttons
 */
export const toolbarIcon = [
  'w-4 h-4 stroke-[1.75]',
].join(' ');

/**
 * Send button SVG
 */
export const sendIcon = [
  'w-[14px] h-[14px] stroke-2',
  'transition-transform duration-200 ease-in-out',
  'group-hover/send:translate-x-px group-hover/send:translate-y-px',
].join(' ');

/**
 * Focus state wrapper
 */
export const focusWithin = [
  'focus-within:scale-[1.01]',
].join(' ');

/**
 * Responsive styles for mobile
 */
export const mobileInputArea = [
  'sm:px-4 sm:pb-2',
].join(' ');

export const mobileToolbar = [
  'sm:px-3 sm:pb-2.5',
].join(' ');

/**
 * Dark mode overrides
 */
export const darkInputField = [
  'dark:text-[oklch(0.94_0.015_85)]',
].join(' ');

export const darkPlaceholder = [
  'dark:placeholder:text-[oklch(0.65_0.035_195)]',
].join(' ');

export const darkIconButton = [
  'dark:text-[oklch(0.65_0.035_195)]',
  'dark:hover:bg-[oklch(0.62_0.08_195_/12%)]',
  'dark:hover:text-[oklch(0.62_0.08_195)]',
].join(' ');

export const darkSendButton = [
  'dark:bg-[oklch(0.30_0.04_230)]',
  'dark:border-[oklch(0.48_0.07_195_/12%)]',
  'dark:text-[oklch(0.65_0.035_195)]',
].join(' ');

export const darkSendButtonActive = [
  'dark:bg-[oklch(0.62_0.08_195)]',
  'dark:border-[oklch(0.62_0.08_195)]',
  'dark:text-[oklch(0.20_0.04_230)]',
  'dark:hover:bg-[oklch(0.68_0.07_195)]',
].join(' ');
