/**
 * Markdown Block Router Component
 *
 * Routes markdown blocks to their respective rendering components
 * based on block type. Handles unknown types with graceful fallback.
 *
 * Phase 3 - Router Implementation
 */

import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, BlockType } from '../../core/models';
import { MarkdownParagraphComponent } from '../paragraph/paragraph.component';
import { MarkdownHeadingComponent } from '../heading/heading.component';
import { MarkdownCodeComponent } from '../code/code.component';
import { MarkdownListComponent } from '../list/list.component';
import { MarkdownBlockquoteComponent } from '../blockquote/blockquote.component';

@Component({
  selector: 'app-markdown-block-router',
  standalone: true,
  imports: [
    CommonModule,
    MarkdownParagraphComponent,
    MarkdownHeadingComponent,
    MarkdownCodeComponent,
    MarkdownListComponent,
    MarkdownBlockquoteComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="markdown-block-router" [attr.data-block-type]="block.type">
      @switch (block.type) {
        @case ('paragraph') {
          <app-markdown-paragraph
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @case ('heading') {
          <app-markdown-heading
            [level]="block.level || 1"
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @case ('code') {
          <app-markdown-code
            [code]="block.rawContent || block.content"
            [language]="block.language || 'text'"
            [streaming]="!isComplete" />
        }
        @case ('list') {
          <app-markdown-list
            [items]="block.items || []"
            [ordered]="block.subtype === 'ordered'"
            [depth]="0" />
        }
        @case ('blockquote') {
          <app-markdown-blockquote
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @default {
          <app-markdown-paragraph [content]="block.content" />
        }
      }
    </div>
  `
})
export class MarkdownBlockRouterComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['block'] && changes['block'].currentValue) {
      const block = changes['block'].currentValue as MarkdownBlock;

      // Log warning for unknown block types
      const knownTypes = [
        BlockType.PARAGRAPH,
        BlockType.HEADING,
        BlockType.CODE_BLOCK,
        BlockType.LIST,
        BlockType.BLOCKQUOTE
      ];

      if (!knownTypes.includes(block.type)) {
        console.warn(`[MarkdownBlockRouter] Unknown block type: ${block.type}, rendering as paragraph`);
      }
    }
  }
}
