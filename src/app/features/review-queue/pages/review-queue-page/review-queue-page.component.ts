/**
 * DocQ Review Queue - Main Page Component
 *
 * Three-column layout for reviewing Q&A pairs.
 */

import {
  Component,
  inject,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import type { ReviewItemVM, DecisionType, SystemConclusion } from '@app/features/review-queue/models';
import { ReviewQueueState } from '@app/features/review-queue/hooks';
import {
  ProgressHeaderComponent,
  QueueListComponent,
  ContentPreviewPanelComponent,
  ActionFooterComponent,
  StateOverlayComponent,
  type ActionFooterSubmitEvent,
} from '@app/features/review-queue/components';

@Component({
  selector: 'spk-review-queue-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProgressHeaderComponent,
    QueueListComponent,
    ContentPreviewPanelComponent,
    ActionFooterComponent,
    StateOverlayComponent,
  ],
  template: `
    <div class="review-queue-page">
      <spk-state-overlay
        [status]="overlayStatus()"
        [errorMessage]="errorMessage() ?? ''"
        [totalItems]="totalItems()"
        [passRate]="passRate()"
        (retry)="onRetry()"
        (newQueue)="onNewQueue()"
      />

      <spk-progress-header
        [cycleName]="cycleName()"
        [currentIndex]="currentIndex()"
        [totalItems]="totalItems()"
        [reviewedItems]="reviewedItems()"
        [acceptedItems]="acceptedItems()"
        [passRate]="passRate() ?? 0"
      />

      <main class="review-queue-main">
        <spk-queue-list
          [items]="items()"
          [selectedItemId]="currentItem()?.itemId ?? null"
          [currentIndex]="currentIndex()"
          [totalItems]="totalItems()"
          (itemSelected)="selectItem($event)"
        />

        <spk-content-preview-panel
          [currentItem]="currentItem() ?? null"
        />

        <aside class="decision-panel">
          @if (currentItem(); as item) {
            <div class="decision-content">
              <h2 class="decision-header">审核决策</h2>

              @if (item.decision) {
                <div class="decision-status">
                  <div class="decision-status-row">
                    <span class="decision-label">决策：</span>
                    <span class="decision-badge" [class]="getDecisionBadgeClass(item.decision)">
                      {{ getDecisionLabel(item.decision) }}
                    </span>
                  </div>
                  @if (item.reason) {
                    <p class="decision-reason">{{ item.reason }}</p>
                  }
                </div>
              }

              <form (submit.prevent)="submitDecision()" class="decision-form">
                <div class="form-label">决策</div>
                <div class="decision-buttons">
                  <button
                    type="button"
                    class="decision-button"
                    [class.active]="selectedDecision() === 'accept'"
                    (click)="selectDecision('accept')"
                  >接受</button>
                  <button
                    type="button"
                    class="decision-button"
                    [class.active]="selectedDecision() === 'reject'"
                    (click)="selectDecision('reject')"
                  >拒绝</button>
                  <button
                    type="button"
                    class="decision-button"
                    [class.active]="selectedDecision() === 'hold'"
                    (click)="selectDecision('hold')"
                  >暂存</button>
                </div>

                @if (selectedDecision() !== 'accept') {
                  <div class="form-group">
                    <label for="reason" class="form-label">原因</label>
                    <textarea
                      id="reason"
                      class="form-textarea"
                      rows="3"
                      [value]="reason()"
                      (input)="updateReason($event)"
                      placeholder="请提供此决策的原因..."
                    ></textarea>
                  </div>
                }
              </form>

              <div class="action-buttons">
                <button
                  type="submit"
                  class="primary-button"
                  [disabled]="!canSubmit() || status() === 'submitting'"
                  (click)="submitDecision()"
                >
                  @if (status() === 'submitting') {
                    <span class="spinner"></span>
                  }
                  {{ status() === 'submitting' ? '提交中...' : '提交决策' }}
                </button>
                <button
                  type="button"
                  class="secondary-button"
                  [disabled]="status() === 'submitting'"
                  (click)="skip()"
                >跳过</button>
              </div>

              <div class="nav-buttons">
                <button
                  type="button"
                  class="nav-button"
                  [disabled]="!canGoPrevious()"
                  (click)="goToPrevious()"
                >上一项</button>
                <button
                  type="button"
                  class="nav-button"
                  [disabled]="!canGoNext()"
                  (click)="goToNext()"
                >下一项</button>
              </div>
            </div>
          } @else {
            <div class="decision-empty">
              <p class="text-muted-foreground text-sm">未选择任何项</p>
            </div>
          }
        </aside>
      </main>

      <spk-action-footer
        [canGoPrevious]="canGoPrevious()"
        [canGoNext]="canGoNext()"
        [canSubmit]="canSubmit() && currentItem() !== undefined"
        [isSubmitting]="status() === 'submitting'"
        [selectedDecision]="selectedDecision()"
        [decisionReason]="reason()"
        (previous)="goToPrevious()"
        (skip)="skip()"
        (submit)="submitDecisionWithEvent($event)"
        (next)="goToNext()"
      />
    </div>
  `,
  styles: `
    .review-queue-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .review-queue-main {
      display: grid;
      grid-template-columns: 280px 1fr 320px;
      flex: 1;
      overflow: hidden;
    }

    .decision-panel {
      border-left: 1px solid var(--border);
      background-color: var(--card);
      overflow-y: auto;
    }

    .decision-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
      padding: var(--spacing-xl);
    }

    .decision-header {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--foreground);
    }

    .decision-status {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--muted);
      border-radius: var(--radius-md);
    }

    .decision-status-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .decision-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--foreground);
    }

    .decision-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--font-size-xs);
      font-weight: 500;
      text-transform: uppercase;
    }

    .decision-badge.accept {
      background-color: oklch(0.9 0.05 145);
      color: oklch(0.2 0.1 145);
    }

    .decision-badge.reject,
    .decision-badge.fail {
      background-color: oklch(0.55 0.2 10);
      color: oklch(0.15 0.05 10);
    }

    .decision-badge.hold,
    .decision-badge.risk {
      background-color: oklch(0.75 0.15 60);
      color: oklch(0.25 0.1 30);
    }

    .decision-reason {
      font-size: var(--font-size-sm);
      color: var(--foreground);
    }

    .decision-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .form-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--foreground);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .form-textarea {
      padding: var(--spacing-md);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background-color: var(--background);
      color: var(--foreground);
      font-size: var(--font-size-sm);
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
    }

    .form-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--ring);
    }

    .decision-buttons {
      display: flex;
      gap: var(--spacing-sm);
    }

    .decision-button {
      flex: 1;
      padding: var(--spacing-md);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background-color: var(--background);
      color: var(--foreground);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
    }

    .decision-button:hover {
      background-color: var(--muted);
    }

    .decision-button.active {
      background-color: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .primary-button {
      padding: var(--spacing-md) var(--spacing-lg);
      border: none;
      border-radius: var(--radius-md);
      background-color: var(--primary);
      color: var(--primary-foreground);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
    }

    .primary-button:hover:not(:disabled) {
      background-color: var(--primary) / 0.9;
    }

    .primary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .secondary-button {
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background-color: var(--background);
      color: var(--foreground);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
    }

    .secondary-button:hover:not(:disabled) {
      background-color: var(--muted);
    }

    .nav-buttons {
      display: flex;
      gap: var(--spacing-sm);
    }

    .nav-button {
      flex: 1;
      padding: var(--spacing-md);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background-color: var(--background);
      color: var(--foreground);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
    }

    .nav-button:hover:not(:disabled) {
      background-color: var(--muted);
    }

    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .decision-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--spacing-xl);
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--primary-foreground);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: var(--spacing-sm);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ReviewQueuePageComponent implements OnInit {
  private readonly state = inject(ReviewQueueState);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedDecision = signal<'accept' | 'reject' | 'hold'>('accept');
  readonly reason = signal('');

  readonly status = this.state.status;
  readonly currentIndex = this.state.currentIndex;
  readonly currentItem = this.state.currentItem;
  readonly items = this.state.items;
  readonly totalItems = this.state.totalItems;
  readonly reviewedItems = this.state.reviewedItems;
  readonly acceptedItems = this.state.acceptedItems;
  readonly progressPercent = this.state.progressPercent;
  readonly passRate = this.state.passRate;
  readonly errorMessage = computed(() => this.state.errorMessage());

  readonly overlayStatus = computed(() => {
    const status = this.state.status();
    if (status === 'loading' || status === 'submitting' || status === 'error' || status === 'completed') {
      return status;
    }
    return 'ready' as const;
  });

  readonly cycleName = computed(() => {
    const queue = this.state.queue();
    return queue?.cycleId ?? 'Review Queue';
  });

  readonly canGoPrevious = this.state.canGoPrevious;
  readonly canGoNext = this.state.canGoNext;

  readonly canSubmit = computed(() => {
    const decision = this.selectedDecision();
    if (decision === 'accept') return true;
    return this.reason().trim().length > 0;
  });

  ngOnInit(): void {
    const cycleId = this.route.snapshot.params['cycleId'] || 'cycle-001';
    this.state.loadQueue(cycleId);
  }

  selectItem(itemId: string): void {
    const index = this.items().findIndex((item) => item.itemId === itemId);
    if (index !== -1) {
      this.state.goToItem(index + 1);
      this.resetForm();
    }
  }

  selectDecision(decision: 'accept' | 'reject' | 'hold'): void {
    this.selectedDecision.set(decision);
  }

  updateReason(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.reason.set(target.value);
  }

  submitDecision(): void {
    if (!this.canSubmit()) return;

    this.state.setDraftDecision({
      decision: this.selectedDecision(),
      reason: this.reason(),
    });

    this.state.submitCurrentDecision().then(() => {
      this.resetForm();
    });
  }

  submitDecisionWithEvent(event: ActionFooterSubmitEvent): void {
    if (event.decision) {
      this.selectedDecision.set(event.decision as 'accept' | 'reject' | 'hold');
      this.reason.set(event.reason);
      this.submitDecision();
    }
  }

  skip(): void {
    this.state.skipItem();
    this.resetForm();
  }

  goToPrevious(): void {
    this.state.goToPrevious();
    this.resetForm();
  }

  goToNext(): void {
    this.state.goToNext();
    this.resetForm();
  }

  onRetry(): void {
    const cycleId = this.route.snapshot.params['cycleId'] || 'cycle-001';
    this.state.loadQueue(cycleId);
  }

  onNewQueue(): void {
    this.state.reset();
    this.router.navigate(['/']);
  }

  private resetForm(): void {
    this.selectedDecision.set('accept');
    this.reason.set('');
  }

  getDecisionBadgeClass(decision: DecisionType): string {
    switch (decision) {
      case 'accept': return 'accept';
      case 'reject': return 'reject';
      case 'hold': return 'hold';
      case 'skipped': return 'hold';
      default: return '';
    }
  }

  getDecisionLabel(decision: DecisionType): string {
    switch (decision) {
      case 'accept': return '接受';
      case 'reject': return '拒绝';
      case 'hold': return '暂存';
      case 'skipped': return '跳过';
      default: return '';
    }
  }
}
