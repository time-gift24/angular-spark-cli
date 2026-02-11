/**
 * Markdown Block Router Component
 *
 * Dynamically routes markdown blocks to registered renderer components.
 */

import { Component, Type, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { MarkdownBlock, BlockType, isCodeBlock, isBlockquoteBlock, isListBlock } from '../../core/models';
import { BLOCK_COMPONENT_REGISTRY } from '../../core/plugin';
import { DepthGuard } from '../../core/depth-guard';

@Component({
  selector: 'app-markdown-block-router',
  imports: [CommonModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="markdown-block-router" [attr.data-block-type]="block().type">
      @if (resolvedComponent(); as component) {
        <ng-container *ngComponentOutlet="component; inputs: resolvedInputs()" />
      }
    </div>
  `
})
export class MarkdownBlockRouterComponent {
  readonly block = input.required<MarkdownBlock>();
  readonly isComplete = input(true);
  readonly blockIndex = input(-1);
  readonly enableLazyHighlight = input(false);
  readonly allowHighlight = input(true);
  readonly depth = input(0);

  private readonly registry = inject(BLOCK_COMPONENT_REGISTRY);

  protected readonly resolvedComponent = computed<Type<unknown> | null>(() =>
    this.lookupComponent(this.block()),
  );
  protected readonly resolvedInputs = computed<Record<string, unknown>>(() => this.buildResolvedInputs());

  private buildResolvedInputs(): Record<string, unknown> {
    const block = this.block();

    if (isCodeBlock(block)) {
      return {
        block,
        isComplete: this.isComplete(),
        blockIndex: this.blockIndex(),
        enableLazyHighlight: this.enableLazyHighlight(),
        allowHighlight: this.allowHighlight(),
      };
    }

    if (isBlockquoteBlock(block)) {
      const depth = this.depth();
      return {
        block,
        isComplete: this.isComplete(),
        blockIndex: this.blockIndex(),
        enableLazyHighlight: this.enableLazyHighlight(),
        allowHighlight: this.allowHighlight(),
        depth,
        canNest: DepthGuard.canNest(block, depth),
      };
    }

    if (isListBlock(block)) {
      const depth = this.depth();
      return {
        block,
        isComplete: this.isComplete(),
        blockIndex: this.blockIndex(),
        enableLazyHighlight: this.enableLazyHighlight(),
        allowHighlight: this.allowHighlight(),
        depth,
        canNest: DepthGuard.canNest(block, depth),
      };
    }

    return {
      block,
      isComplete: this.isComplete(),
    };
  }

  private lookupComponent(block: MarkdownBlock): Type<unknown> | null {
    for (const entry of this.registry.matchers) {
      if (entry.matcher(block)) {
        const keys = Object.keys(entry.components);
        if (keys.length > 0) {
          return entry.components[keys[0]] as Type<unknown>;
        }
      }
    }

    return (
      (this.registry.componentMap.get(block.type) as Type<unknown> | undefined) ||
      (this.registry.componentMap.get(BlockType.UNKNOWN) as Type<unknown> | undefined) ||
      (this.registry.componentMap.get(BlockType.PARAGRAPH) as Type<unknown> | undefined) ||
      null
    );
  }
}
