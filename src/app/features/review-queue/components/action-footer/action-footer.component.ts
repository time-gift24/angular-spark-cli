/**
 * Action Footer Component
 *
 * Bottom action bar for Review Queue page.
 * Provides navigation buttons: Previous, Skip, Submit & Next.
 * Handles button states based on current item position.
 *
 * @selector spk-action-footer
 * @standalone true
 *
 * Usage:
 * ```html
 * <spk-action-footer
 *   [canGoPrevious]="canGoToPrevious()"
 *   [canGoNext]="canGoToNext()"
 *   [canSubmit]="canSubmitDecision()"
 *   [isSubmitting]="isSubmitting()"
 *   (previous)="onPrevious()"
 *   (skip)="onSkip()"
 *   (submit)="onSubmit()"
 *   (next)="onNext()"
 * ></spk-action-footer>
 * ```
 */

import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DecisionType } from '@app/features/review-queue/models';

/**
 * Event emitted when submit button is clicked
 */
export interface ActionFooterSubmitEvent {
  decision: DecisionType | null;
  reason: string;
}

/**
 * Action Footer Component
 *
 * Bottom action bar for the review queue page.
 * Handles navigation between items and decision submission.
 */
@Component({
  selector: 'spk-action-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <footer class="action-footer">
      <!-- Previous Button -->
      <button
        type="button"
        class="action-button action-button-previous"
        [disabled]="!canGoPrevious()"
        (click)="onPrevious()"
        [attr.aria-label]="'导航到上一项'"
      >
        <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="action-label">上一项</span>
      </button>

      <!-- Skip Button -->
      <button
        type="button"
        class="action-button action-button-skip"
        [disabled]="isSubmitting()"
        (click)="onSkip()"
        [attr.aria-label]="'跳过当前项'"
      >
        <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 5-7 5M5 5l7 5-7 5" />
        </svg>
        <span class="action-label">Skip</span>
      </button>

      <!-- Submit Button -->
      <button
        type="submit"
        class="action-button action-button-submit"
        [disabled]="!canSubmit() || isSubmitting()"
        (click)="onSubmit()"
        [attr.aria-label]="'提交当前决策'"
      >
        @if (isSubmitting()) {
          <span class="submit-spinner"></span>
        }
        <span class="action-label">{{ isSubmitting() ? '提交中...' : '提交决策' }}</span>
      </button>

      <!-- Next Button -->
      <button
        type="button"
        class="action-button action-button-next"
        [disabled]="!canGoNext() || isSubmitting()"
        (click)="onNext()"
        [attr.aria-label]="'导航到下一项'"
      >
        <span class="action-label">Next</span>
        <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 5-7 5" />
        </svg>
      </button>
    </footer>
  `,
  styles: `
    .action-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-xl);
      border-top: 1px solid var(--border);
      background-color: var(--card);
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background-color: var(--background);
      color: var(--foreground);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
      min-width: 100px;
    }

    .action-button:hover:not(:disabled) {
      background-color: var(--accent);
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-button-submit {
      background-color: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .action-button-submit:hover:not(:disabled) {
      background-color: rgb(var(--primary) / 0.9);
    }

    .action-button-previous,
    .action-button-next {
      background-color: var(--background);
    }

    .action-button-skip {
      background-color: var(--muted);
    }

    .action-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .action-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
    }

    .submit-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid var(--primary-foreground);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .action-button {
        min-width: 70px;
      }

      .action-label {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ActionFooterComponent {
  /** Can go to previous item */
  readonly canGoPrevious = input<boolean>(true);

  /** Can go to next item */
  readonly canGoNext = input<boolean>(true);

  /** Can submit current decision */
  readonly canSubmit = input<boolean>(true);

  /** Is currently submitting a decision */
  readonly isSubmitting = input<boolean>(false);

  /** Currently selected decision type */
  readonly selectedDecision = input<DecisionType | null>(null);

  /** Currently typed decision reason */
  readonly decisionReason = input<string>('');

  /** Event emitted when previous button is clicked */
  readonly previous = output<void>();

  /** Event emitted when skip button is clicked */
  readonly skip = output<void>();

  /** Event emitted when submit button is clicked */
  readonly submit = output<ActionFooterSubmitEvent>();

  /** Event emitted when next button is clicked */
  readonly next = output<void>();

  /**
   * Handle previous button click
   */
  onPrevious(): void {
    this.previous.emit();
  }

  /**
   * Handle skip button click
   */
  onSkip(): void {
    this.skip.emit();
  }

  /**
   * Handle submit button click
   */
  onSubmit(): void {
    if (!this.canSubmit() || this.isSubmitting()) {
      return;
    }

    // Emit submit event with current decision
    this.submit.emit({
      decision: this.selectedDecision(),
      reason: this.decisionReason(),
    });
  }

  /**
   * Handle next button click
   */
  onNext(): void {
    this.next.emit();
  }
}
