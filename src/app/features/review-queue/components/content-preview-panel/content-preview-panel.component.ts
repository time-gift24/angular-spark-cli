/**
 * Content Preview Panel Component
 *
 * Center panel displaying current review item's content.
 * Shows SOP document, current segment, and check results.
 *
 * @selector spk-content-preview-panel
 * @standalone true
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ReviewItemVM } from '@app/features/review-queue/models';

/**
 * Content Preview Panel Component
 *
 * Displays SOP document structure:
 * - Original Document Title
 * - Current Segment (AI 分段)
 * - Check Results (检测结果)
 */
@Component({
  selector: 'spk-content-preview-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="content-preview-panel">
      @if (currentItem(); as item) {
        <!-- Document Title Section -->
        <div class="preview-section doc-title-section">
          <div class="preview-header">
            <span class="preview-badge">SOP 文档</span>
            <span class="preview-meta text-xs text-muted-foreground">
              {{ item.itemId }}
            </span>
          </div>
          <h2 class="doc-title">{{ item.originalDoc.title }}</h2>
        </div>

        <!-- Current Segment Section -->
        @if (item.currentSegment; as segment) {
          <div class="preview-section segment-section">
            <div class="preview-header">
              <h3 class="preview-title">当前段落 ({{ segment.segmentIndex }})</h3>
              <span class="preview-badge segment-badge">AI 分段</span>
            </div>
            <div class="preview-card segment-content">
              <p class="preview-content text-sm whitespace-pre-wrap">{{ segment.content }}</p>
            </div>
          </div>
        }

        <!-- Check Results Section -->
        @if (item.outputs && item.outputs.length > 0) {
          <div class="preview-section results-section">
            <div class="preview-header">
              <h3 class="preview-title">检测结果 ({{ item.outputs.length }})</h3>
            </div>
            <div class="outputs-grid">
              @for (output of item.outputs; track output.outputId) {
                <div class="output-card" [class]="getOutputCardClass(output)">
                  <div class="output-header">
                    <span class="output-name text-xs font-medium">{{ output.checkItemName }}</span>
                    <span class="output-score" [class]="getScoreClass(output.score)">
                      {{ output.score }}%
                    </span>
                  </div>
                  <p class="output-message text-xs">{{ output.message }}</p>
                </div>
              }
            </div>
          </div>
        }
      }
    </section>

    <!-- Empty State -->
    @if (!currentItem()) {
      <div class="preview-empty">
        <div class="preview-empty-icon">?</div>
        <p class="text-muted-foreground text-sm">请从队列中选择一项以预览其内容</p>
      </div>
    }
  `,
  styles: `
    .content-preview-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background-color: var(--background);
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      border-bottom: 1px solid var(--border);
    }

    .doc-title-section {
      background: linear-gradient(135deg, var(--muted) 0%, var(--accent) 100%);
      border-bottom: 2px solid var(--primary);
    }

    .doc-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .preview-section:last-child {
      border-bottom: none;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
    }

    .preview-badge {
      font-size: var(--font-size-xs);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      background-color: var(--primary);
      color: var(--primary-foreground);
      font-weight: 500;
    }

    .segment-badge {
      background-color: oklch(0.7 0.15 180);
      color: oklch(0.2 0.1 180);
    }

    .preview-meta {
      font-size: var(--font-size-xs);
      color: var(--muted-foreground);
    }

    .preview-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--foreground);
    }

    .segment-content {
      background-color: var(--card);
      border-left: 4px solid oklch(0.7 0.15 180);
    }

    .preview-card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      min-height: 8rem;
    }

    .preview-content {
      font-size: var(--font-size-sm);
      color: var(--foreground);
      line-height: 1.8;
    }

    .preview-content.whitespace-pre-wrap {
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Outputs Grid */
    .outputs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }

    .output-card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      transition: all 150ms var(--ease-spring-smooth);
    }

    .output-card:hover {
      border-color: var(--accent);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .output-card.passed {
      border-left: 3px solid oklch(0.7 0.15 145);
    }

    .output-card.failed {
      border-left: 3px solid oklch(0.55 0.2 10);
    }

    .output-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-sm);
    }

    .output-name {
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--foreground);
    }

    .output-score {
      font-size: var(--font-size-xs);
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 999px;
    }

    .output-score.high {
      background-color: oklch(0.9 0.05 145);
      color: oklch(0.2 0.1 145);
    }

    .output-score.medium {
      background-color: oklch(0.75 0.15 60);
      color: oklch(0.2 0.1 30);
    }

    .output-score.low {
      background-color: oklch(0.55 0.2 10);
      color: oklch(0.15 0.05 10);
    }

    .output-message {
      font-size: var(--font-size-xs);
      color: var(--foreground);
      line-height: 1.5;
      margin-bottom: var(--spacing-sm);
    }

    /* Empty State */
    .preview-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--spacing-xl);
    }

    .preview-empty-icon {
      font-size: 3rem;
      color: var(--muted-foreground);
      opacity: 0.3;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .outputs-grid {
        grid-template-columns: 1fr;
      }

      .doc-title {
        font-size: var(--font-size-base);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ContentPreviewPanelComponent {
  /** Current item to display */
  readonly currentItem = input<ReviewItemVM | null>(null);

  /**
   * Get CSS class for output card based on pass status
   */
  protected getOutputCardClass(output: { passed: boolean }): string {
    return output.passed ? 'output-card passed' : 'output-card failed';
  }

  /**
   * Get CSS class for output score badge based on score value
   */
  protected getScoreClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}
