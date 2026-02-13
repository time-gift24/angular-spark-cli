import { Injectable, Type } from '@angular/core';
import { BlockType } from './models';

/**
 * BlockRouterRegistry - Block Type to Component Mapping Service
 *
 * This registry manages the mapping between markdown block types and their
 * corresponding Angular component types. It serves as the central registration
 * point for the block router state machine to dynamically render components.
 *
 * @example
 * ```typescript
 * // Register a single component
 * registry.register(BlockType.CODE_BLOCK, CodeBlockComponent);
 *
 * // Register multiple components
 * registry.registerAll({
 *   [BlockType.PARAGRAPH]: ParagraphComponent,
 *   [BlockType.HEADING]: HeadingComponent,
 *   [BlockType.CODE_BLOCK]: CodeBlockComponent,
 * });
 *
 * // Get component for a block type
 * const component = registry.get(BlockType.CODE_BLOCK);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BlockRouterRegistry {
  private componentMap = new Map<BlockType, Type<any>>();

  /**
   * Register a block type to component mapping.
   *
   * @param blockType - The BlockType enum value
   * @param component - The Angular component type to render for this block
   */
  register(blockType: BlockType, component: Type<any>): void {
    this.componentMap.set(blockType, component);
  }

  /**
   * Register multiple block type mappings at once.
   *
   * @param mappings - Record of BlockType to component mappings
   */
  registerAll(mappings: Record<BlockType, Type<any>>): void {
    Object.entries(mappings).forEach(([type, component]) => {
      this.componentMap.set(type as BlockType, component);
    });
  }

  /**
   * Get the component for a given block type.
   *
   * @param blockType - The BlockType to look up
   * @returns The component type or undefined if not registered
   */
  get(blockType: BlockType): Type<any> | undefined {
    return this.componentMap.get(blockType);
  }

  /**
   * Check if a block type has a registered component.
   *
   * @param blockType - The BlockType to check
   * @returns True if the block type is registered
   */
  has(blockType: BlockType): boolean {
    return this.componentMap.has(blockType);
  }

  /**
   * Get all registered block types.
   *
   * @returns Array of all BlockType values that have registered components
   */
  getRegisteredTypes(): BlockType[] {
    return Array.from(this.componentMap.keys());
  }
}
