/**
 * Select Components - Split Structure
 *
 * New API (recommended):
 * <div spark-select-root [(value)]="selectedValue">
 *   <button spark-select-trigger>
 *     <span spark-select-value placeholder="Select..." />
 *   </button>
 *   <div spark-select-content>
 *     <div spark-select-item value="option1">Option 1</div>
 *     <div spark-select-item value="option2">Option 2</div>
 *   </div>
 * </div>
 */

// New Split-Structure Select Components
export * from './select-root.component';
export * from './select-content.component';
export * from './select-item.component';
export * from './select-label.component';
export * from './select-separator.component';
export * from './select-group.component';
export * from './select-scroll-up-button.component';
export * from './select-scroll-down-button.component';

// Re-export types
export type { SelectRootToken, SelectItemDef } from './select-root.component';

