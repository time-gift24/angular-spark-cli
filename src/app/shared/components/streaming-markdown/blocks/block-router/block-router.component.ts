/**
 * Markdown Block Router Component
 *
 * Dynamically routes markdown blocks to registered renderer components.
 */

import { Component, Type, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { MarkdownBlock, BlockType, isCodeBlock, isBlockquoteBlock, isListBlock } from '../../core/models';
import { BLOCK_COMPONENT_REGISTRY, RenderHookContext, STREAMDOWN_PLUGIN_RUNTIME } from '../../core/plugin';
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
  private readonly pluginRuntime = inject(STREAMDOWN_PLUGIN_RUNTIME, { optional: true });

  private readonly resolvedHookContext = computed<RenderHookContext>(() => {
    const block = this.block();
    const hookContext: RenderHookContext = {
      block,
      isComplete: this.isComplete(),
      blockIndex: this.blockIndex(),
      depth: this.depth(),
      component: this.lookupComponent(block),
      inputs: this.buildResolvedInputs(),
    };

    if (this.pluginRuntime?.hasBeforeRenderHooks) {
      this.pluginRuntime.runBeforeRender(hookContext);
    }
    if (this.pluginRuntime?.hasAfterRenderHooks) {
      this.pluginRuntime.runAfterRender(hookContext);
    }

    return hookContext;
  });

  protected readonly resolvedComponent = computed<Type<unknown> | null>(
    () => this.resolvedHookContext().component as Type<unknown> | null,
  );
  protected readonly resolvedInputs = computed<Record<string, unknown>>(
    () => this.resolvedHookContext().inputs,
  );

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
        if (entry.resolveType) {
          const resolvedType = entry.resolveType(block);
          if (resolvedType) {
            const resolvedComponent = this.registry.componentMap.get(resolvedType) || entry.components[resolvedType];
            if (resolvedComponent) {
              return resolvedComponent;
            }
          }
        }

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
