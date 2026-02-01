/**
 * Streaming Markdown - Block Renderer Component
 *
 * This component renders individual markdown blocks with support for
 * streaming indicators. It uses Angular Signals for reactivity and
 * integrates with the MarkdownFormatterService for HTML generation.
 *
 * Phase 6 Implementation:
 * - Task 6.1: Define BlockRendererComponent Interface
 * - Task 6.2: Define StyleMapping Interface
 * - Task 6.3: Define ComponentState Interface
 */

import { Component, Input, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { MarkdownBlock, BlockType } from '../core/models';
import { MarkdownFormatterServiceExtended } from './markdown-formatter.service';
import { CodeBlockWrapperComponent } from './code-block-wrapper.component';

/**
 * Style class mapping for different block types.
 * Defines container, content, and streaming indicator CSS classes.
 *
 * Uses design system CSS variables for consistent styling:
 * - --spacing-* for spacing
 * - --radius-* for border radius
 * - --muted, --muted-foreground for subtle colors
 */
interface BlockStyleClasses {
  /** Container wrapper classes */
  container: string;

  /** Content wrapper classes */
  content: string;

  /** Streaming indicator classes (optional) */
  streaming?: string;
}

/**
 * Maps each BlockType to its corresponding style classes.
 * Provides type-safe lookup of CSS classes based on block type.
 */
type BlockTypeToClasses = Record<BlockType, BlockStyleClasses>;

/**
 * Internal component state representation.
 * Encapsulates the complete state for a block renderer instance.
 *
 * This interface is defined for future phases where state management
 * will be more complex. Currently, the component uses computed signals
 * for reactive updates.
 */
interface ComponentState {
  /** The markdown block being rendered */
  block: MarkdownBlock;

  /** Completion status of the block */
  isComplete: boolean;

  /** Formatted HTML output */
  formattedHtml: string;
}

/**
 * Component that renders a single markdown block with streaming support.
 *
 * Features:
 * - Renders markdown content as sanitized HTML
 * - Shows streaming indicator for incomplete blocks
 * - Applies block-specific styling using CSS variables
 * - OnPush change detection for optimal performance
 * - Angular Signals for reactive updates
 *
 * @example
 * ```html
 * <app-block-renderer
 *   [block]="markdownBlock"
 *   [isComplete]="true">
 * </app-block-renderer>
 * ```
 */
@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [CommonModule, CodeBlockWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()" [attr.data-block-type]="block.type">
      @if (block.type === BlockType.CODE_BLOCK) {
        <!-- Render code block with IDE features -->
        <app-code-block-wrapper
          [highlightedHtml]="highlightedHtml()"
          [language]="block.language || 'text'"
          [code]="block.content"
          [showLineNumbers]="true"
          [showCopyButton]="true"
          [showLanguageTag]="true" />
      } @else {
        <!-- Render other blocks as HTML -->
        <div [innerHTML]="formattedContent()"></div>
      }
    </div>
  `
})
export class BlockRendererComponent {
  /** Block type enum for template access */
  protected readonly BlockType = BlockType;

  /** Markdown block to render (required) */
  @Input() block!: MarkdownBlock;

  /** Completion status - true if block is fully received */
  @Input() isComplete: boolean = true;

  /** Injected formatter service (extended with code highlighting) */
  private formatter = inject(MarkdownFormatterServiceExtended);

  /** Signal for formatted HTML content (non-code blocks) */
  protected formattedContent = signal<string>('');

  /** Signal for highlighted HTML (code blocks) */
  protected highlightedHtml = signal<string>('');

  /** Initialize content formatting when inputs change */
  private initializeContent = effect(() => {
    const block = this.block;
    const isComplete = this.isComplete;

    if (!block) {
      this.formattedContent.set('');
      this.highlightedHtml.set('');
      return;
    }

    // Handle code blocks with async highlighting
    if (block.type === BlockType.CODE_BLOCK) {
      console.log('[BlockRenderer] Processing code block:', {
        type: block.type,
        language: block.language,
        contentLength: block.content.length
      });

      this.formatter.formatCodeBlock(block).then(html => {
        console.log('[BlockRenderer] Got highlighted HTML:', {
          length: html.length,
          hasStyle: html.includes('style='),
          preview: html.substring(0, 300)
        });

        // Set highlighted HTML for CodeBlockWrapperComponent
        this.highlightedHtml.set(html);
        // Clear formatted content for non-code path
        this.formattedContent.set('');
      }).catch(error => {
        console.error('[BlockRenderer] Code highlighting failed:', error);
        // Fallback to escaped HTML
        const escaped = this.escapeHtml(block.content);
        this.highlightedHtml.set(escaped);
      });
      return;
    }

    // Handle regular blocks synchronously
    const html = this.formatter.format(block);

    if (!isComplete) {
      this.formattedContent.set(`<div class="streaming-indicator">${html}</div>`);
    } else {
      this.formattedContent.set(html);
    }

    // Clear highlighted HTML for non-code path
    this.highlightedHtml.set('');
  });

  /** Escape HTML for fallback rendering */
  private escapeHtml(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Computed signal for container CSS classes */
  protected containerClasses = computed(() => {
    const baseClasses = 'markdown-block block-' + this.block.type;

    if (!this.isComplete) {
      return baseClasses + ' streaming';
    }

    return baseClasses;
  });
}
