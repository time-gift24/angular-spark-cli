/**
 * Scroll Area display configuration for demo
 */
export interface ScrollAreaExample {
  label: string;
  description: string;
  height?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  longContent?: boolean;
}

/**
 * Scroll Area orientation type
 */
export type ScrollAreaOrientation = 'horizontal' | 'vertical' | 'both';
