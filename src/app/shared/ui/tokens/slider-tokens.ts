/**
 * Slider Component Tokens
 *
 * Maps to CSS variables in styles.css:
 * --slider-height: 0.375rem (6px) - track height
 * --slider-thumb-size: 1rem (16px) - thumb size
 * --slider-thumb-scale: 1.25 - hover/focus scale
 */

/**
 * Slider size variants
 */
export type SliderSize = 'sm' | 'md' | 'lg';

/**
 * Slider orientation (horizontal or vertical)
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * Slider value (array for range slider)
 */
export type SliderValue = number | number[];
