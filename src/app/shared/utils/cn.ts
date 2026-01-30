/**
 * Utility function to merge class names
 * This is a simple implementation of clsx/classnames
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
