/**
 * Popover Components - Complete Component Family
 *
 * Lightweight popover/popover API for displaying rich content.
 *
 * Usage:
 * <div spark-popover-root [(open)]="isOpen">
 *   <button spark-popover-trigger>Toggle</button>
 *   <div spark-popover-content [side]="'bottom'" [align]="'center'">
 *     <div spark-popover-header>
 *       <h3 spark-popover-title>Title</h3>
 *     </div>
 *     <div class="p-4">Content</div>
 *   </div>
 * </div>
 */

export * from './popover.component';
export * from './popover-trigger.component';
export * from './popover-content.component';
export * from './popover-anchor.component';
export * from './popover-close.component';
export * from './popover-arrow.component';
export * from './popover-header.component';
export * from './popover-title.component';
export * from './popover-footer.component';

// Re-export types
export type {
  PopoverRootToken,
} from './popover.component';

export type {
  PopoverContentAlign,
  PopoverContentSide,
} from './popover-content.component';

export type {
  PopoverArrowSide,
} from './popover-arrow.component';
