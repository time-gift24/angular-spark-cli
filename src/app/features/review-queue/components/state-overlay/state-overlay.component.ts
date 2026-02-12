/**
 * State Overlay Component
 *
 * Global full-screen overlay for handling review queue states.
 * Provides visual feedback for loading, submitting, error, and completed states.
 *
 * @selector spk-state-overlay
 * @standalone true
 *
 * Usage:
 * ```html
 * <spk-state-overlay
 *   [status]="stateService.status()"
 *   [errorMessage]="stateService.errorMessage()"
 *   [totalItems]="totalItems()"
 *   [passRate]="passRate()"
 *   (retry)="onRetry()"
 *   (newQueue)="onNewQueue()"
 * ></spk-state-overlay>
 * ```
 */

import { Component, input, computed, HostBinding, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type ReviewStatus } from '@app/features/review-queue/models';

/**
 * State Overlay Component
 *
 * Displays a full-screen overlay with different content based on review queue status.
 * Supports loading, submitting, error, and completed states.
 */
@Component({
  selector: 'spk-state-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div class="state-overlay" [class]="statusClass()">
        @switch (status()) {
          @case ('loading') {
            <div class="state-overlay-content">
              <div class="loading-spinner"></div>
              <p class="state-overlay-text">正在加载审核队列...</p>
            </div>
          }

          @case ('submitting') {
            <div class="state-overlay-content">
              <div class="loading-spinner"></div>
              <p class="state-overlay-text">正在提交决策...</p>
            </div>
          }

          @case ('error') {
            <div class="state-overlay-content">
              <div class="error-icon">!</div>
              <p class="state-overlay-text">{{ errorMessage() }}</p>
              @if (hasRetryAction()) {
                <button (click)="onRetry()" class="state-overlay-action">重试</button>
              }
            </div>
          }

          @case ('completed') {
            <div class="state-overlay-content state-completed">
              <svg class="completed-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h3 class="state-overlay-title">审核完成！</h3>
              <p class="state-overlay-text">全部 {{ totalItems() }} 个项目已审核完成。</p>
              @if (passRate() !== null) {
                <p class="state-overlay-metric">通过率：{{ passRate() }}%</p>
              }
              <button (click)="onNewQueue()" class="state-overlay-action">开始新队列</button>
            </div>
          }
        }
      </div>
    }
  `,
  styles: `
    .state-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    }

    .state-overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-2xl);
      background-color: var(--card);
      border-radius: var(--radius-xl);
      text-align: center;
      max-width: 400px;
    }

    /* Loading Spinner */
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--primary);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .state-overlay-text {
      font-size: var(--font-size-base);
      color: var(--foreground);
    }

    .state-completed {
      background: linear-gradient(135deg, var(--success) 0%, var(--success) 100%);
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .completed-icon {
      width: 80px;
      height: 80px;
      color: var(--success);
      margin-bottom: var(--spacing-lg);
    }

    .state-overlay-title {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: var(--spacing-md);
    }

    .state-overlay-metric {
      font-size: var(--font-size-sm);
      color: var(--muted-foreground);
      margin-top: var(--spacing-md);
    }

    .error-icon {
      font-size: 48px;
      color: var(--destructive);
      margin-bottom: var(--spacing-lg);
    }

    .state-overlay-action {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md) var(--spacing-xl);
      background-color: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      font-size: var(--font-size-base);
      transition: all 150ms var(--ease-spring-smooth);
    }

    .state-overlay-action:hover {
      background-color: var(--primary) / 0.9;
      transform: translateY(-1px);
    }

    /* Status-based styling */
    .state-overlay.loading {
      background-color: rgba(0, 0, 0, 0.3);
    }

    .state-overlay.submitting {
      background-color: rgba(0, 0, 0, 0.3);
    }

    .state-overlay.error {
      background-color: rgba(220, 38, 38, 0.9);
    }

    .state-overlay.completed {
      background-color: rgba(34, 197, 94, 0.95);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class StateOverlayComponent {
  /** Current review status from parent or service */
  readonly status = input<ReviewStatus>('loading');

  /** Error message for error state */
  readonly errorMessage = input<string>('');

  /** Total items count for completed state */
  readonly totalItems = input<number>(0);

  /** Pass rate for completed state */
  readonly passRate = input<number | null>(null);

  /** Action emitted when retry is clicked */
  readonly retry = output<void>();

  /** Action emitted when starting a new queue is clicked */
  readonly newQueue = output<void>();

  /** Computed: Check if overlay should be visible */
  readonly isVisible = computed(() => {
    return this.status() === 'loading' ||
           this.status() === 'submitting' ||
           this.status() === 'error' ||
           this.status() === 'completed';
  });

  /** Computed: Has retry action for error state */
  readonly hasRetryAction = computed(() => {
    return this.status() === 'error';
  });

  /** Computed: Get CSS class based on status */
  readonly statusClass = computed(() => {
    switch (this.status()) {
      case 'loading':
        return 'state-overlay loading';
      case 'submitting':
        return 'state-overlay submitting';
      case 'error':
        return 'state-overlay error';
      case 'completed':
        return 'state-overlay completed';
      default:
        return '';
    }
  });

  onRetry(): void {
    this.retry.emit();
  }

  onNewQueue(): void {
    this.newQueue.emit();
  }
}
