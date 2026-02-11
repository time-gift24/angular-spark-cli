/**
 * Markdown Block Router Component
 *
 * Dynamically routes markdown blocks to registered renderer components.
 */

import { Component, Input, ChangeDetectionStrategy, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { MarkdownBlock, BlockType, isCodeBlock, isBlockquoteBlock, isListBlock } from '../../core/models';
import { BLOCK_COMPONENT_REGISTRY } from '../../core/plugin';
import { DepthGuard } from '../../core/depth-guard';

@Component({
  selector: 'app-markdown-block-router',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="markdown-block-router" [attr.data-block-type]="block.type">
      @if (resolvedComponent; as component) {
        <ng-container *ngComponentOutlet="component; inputs: resolvedInputs" />
      }
    </div>
  `
})
export class MarkdownBlockRouterComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete = true;
  @Input() blockIndex = -1;
  @Input() enableLazyHighlight = false;
  @Input() allowHighlight = true;
  @Input() depth = 0;

  private registry = inject(BLOCK_COMPONENT_REGISTRY);

  resolvedComponent: any = null;
  resolvedInputs: Record<string, unknown> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['block'] && !changes['isComplete'] && !changes['blockIndex'] && !changes['enableLazyHighlight'] && !changes['allowHighlight'] && !changes['depth']) {
      return;
    }

    this.resolvedComponent = this.lookupComponent(this.block);
    this.resolvedInputs = this.buildResolvedInputs();
  }

  private buildResolvedInputs(): Record<string, unknown> {
    if (isCodeBlock(this.block)) {
      return {
        block: this.block,
        isComplete: this.isComplete,
        blockIndex: this.blockIndex,
        enableLazyHighlight: this.enableLazyHighlight,
        allowHighlight: this.allowHighlight
      };
    }

    if (isBlockquoteBlock(this.block)) {
      return {
        block: this.block,
        isComplete: this.isComplete,
        blockIndex: this.blockIndex,
        enableLazyHighlight: this.enableLazyHighlight,
        allowHighlight: this.allowHighlight,
        depth: this.depth,
        canNest: DepthGuard.canNest(this.block, this.depth)
      };
    }

    if (isListBlock(this.block)) {
      return {
        block: this.block,
        isComplete: this.isComplete,
        blockIndex: this.blockIndex,
        enableLazyHighlight: this.enableLazyHighlight,
        allowHighlight: this.allowHighlight,
        depth: this.depth,
        canNest: DepthGuard.canNest(this.block, this.depth)
      };
    }

    return {
      block: this.block,
      isComplete: this.isComplete
    };
  }

  private lookupComponent(block: MarkdownBlock): any {
    for (const entry of this.registry.matchers) {
      if (entry.matcher(block)) {
        const keys = Object.keys(entry.components);
        if (keys.length > 0) {
          return entry.components[keys[0]];
        }
      }
    }

    return (
      this.registry.componentMap.get(block.type) ||
      this.registry.componentMap.get(BlockType.UNKNOWN) ||
      this.registry.componentMap.get(BlockType.PARAGRAPH) ||
      null
    );
  }
}
