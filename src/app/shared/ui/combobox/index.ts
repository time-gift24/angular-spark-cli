/**
 * Combobox Components
 *
 * A searchable, filterable dropdown component.
 *
 * Usage:
 * <div spark-combobox-root [(value)]="selectedValue">
 *   <input spark-combobox-input placeholder="Search..." />
 *   <div spark-combobox-content>
 *     <div spark-combobox-list>
 *       <div spark-combobox-item value="option1">Option 1</div>
 *       <div spark-combobox-empty>No results found</div>
 *     </div>
 *   </div>
 * </div>
 */

// Core components
export * from './combobox-root.component';
export * from './combobox-input.component';
export * from './combobox-content.component';
export * from './combobox-list.component';
export * from './combobox-item.component';
export * from './combobox-empty.component';

// Group components
export * from './combobox-group.component';
export * from './combobox-label.component';
export * from './combobox-separator.component';

// Re-export types
export type { ComboboxRootToken, ComboboxItemDef } from './combobox-root.component';
