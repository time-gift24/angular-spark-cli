import type { ScrollAreaExample } from '../types/scroll-area-demo.types';

/**
 * Basic scroll area examples
 */
export const basicScrollAreas: ScrollAreaExample[] = [
  {
    label: 'Vertical Scroll',
    description:
      'A vertically scrollable area with custom scrollbar styling.',
    orientation: 'vertical',
    height: '12rem',
    longContent: true,
  },
  {
    label: 'Horizontal Scroll',
    description:
      'A horizontally scrollable area for wide content.',
    orientation: 'horizontal',
    height: '12rem',
    longContent: true,
  },
  {
    label: 'Both Directions',
    description:
      'Scrollable in both horizontal and vertical directions.',
    orientation: 'both',
    height: '12rem',
    longContent: true,
  },
];

/**
 * Scroll area with different heights
 */
export const sizedScrollAreas: ScrollAreaExample[] = [
  {
    label: 'Short Scroll Area',
    description:
      'A compact scroll area for small content sections.',
    orientation: 'vertical',
    height: '8rem',
    longContent: true,
  },
  {
    label: 'Medium Scroll Area',
    description:
      'Standard height scroll area for typical content.',
    orientation: 'vertical',
    height: '16rem',
    longContent: true,
  },
  {
    label: 'Tall Scroll Area',
    description:
      'A taller scroll area for maximum content visibility.',
    orientation: 'vertical',
    height: '24rem',
    longContent: true,
  },
];

/**
 * Scroll area with styled content
 */
export const styledScrollAreas: ScrollAreaExample[] = [
  {
    label: 'Card Content',
    description:
      'Scroll area containing card-like content items.',
    orientation: 'vertical',
    height: '16rem',
    longContent: true,
  },
  {
    label: 'List Content',
    description:
      'Scroll area with list items for navigation or data display.',
    orientation: 'vertical',
    height: '16rem',
    longContent: true,
  },
];

/**
 * Generate long content for scroll areas
 */
export function generateLongContent(): string[] {
  return Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
}

/**
 * Generate long horizontal content
 */
export function generateLongHorizontalContent(): string[] {
  return [
    'Item 1 with some wider content',
    'Item 2 with more text here',
    'Item 3 with even more content',
    'Item 4 with additional text',
    'Item 5 with more content still',
    'Item 6 with text to scroll',
    'Item 7 with horizontal overflow',
    'Item 8 with wide content',
    'Item 9 with scrolling example',
    'Item 10 with more items',
  ];
}
