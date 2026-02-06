/**
 * Markdown Block Router Component
 *
 * Dynamically routes markdown blocks to their registered renderer components
 * using NgComponentOutlet and the plugin-based BlockComponentRegistry.
 *
 * Lookup order:
 * 1. Custom matchers from plugins (in registration order)
 * 2. Direct type → component map lookup
 * 3. Fallback to UNKNOWN or PARAGRAPH component
 */

import { Component, Input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { MarkdownBlock, BlockType } from '../../core/models';
import { BLOCK_COMPONENT_REGISTRY, BlockComponentRegistry } from '../../core/plugin';

@Component({
  selector: 'app-markdown-block-router',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="markdown-block-router" [attr.data-block-type]="block.type">
      @if (resolvedComponent()) {
        <ng-container
          *ngComponentOutlet="resolvedComponent(); inputs: resolvedInputs()" />
      }
    </div>
  `
})
export class MarkdownBlockRouterComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  private registry = inject(BLOCK_COMPONENT_REGISTRY);

  resolvedComponent = computed(() => this.lookupComponent(this.block));

  resolvedInputs = computed(() => ({
    block: this.block,
    isComplete: this.isComplete
  }));

  private lookupComponent(block: MarkdownBlock): any {
    if (!block) return null;

    // 1. Check custom matchers first
    for (const entry of this.registry.matchers) {
      if (entry.matcher(block)) {
        // Return the first component from the matching plugin
        const keys = Object.keys(entry.components);
        if (keys.length > 0) {
          return entry.components[keys[0]];
        }
      }
    }

    // 2. Direct type lookup
    const component = this.registry.componentMap.get(block.type);
    if (component) {
      return component;
    }

    // 3. Fallback chain: UNKNOWN → PARAGRAPH → null
    const fallback =
      this.registry.componentMap.get(BlockType.UNKNOWN) ||
      this.registry.componentMap.get(BlockType.PARAGRAPH);

    if (fallback) {
      return fallback;
    }

    console.warn(`[MarkdownBlockRouter] No component found for block type: ${block.type}`);
    return null;
  }
}
