/**
 * DocQ Review Queue - State Management Hook
 *
 * Manages the review queue state using Angular Signals.
 * Provides reactive state for the review queue feature.
 */

import { signal, computed, inject, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import type {
  ReviewQueueVM,
  ReviewItemVM,
  ReviewStatus,
  DecisionType,
  ItemDecisionDraft,
  ReviewQueueRouteParams,
} from '@app/features/review-queue/models';
import { mockReviewQueue } from '@app/features/review-queue/models';

/**
 * Review Queue State Service
 *
 * Injectable service that manages the review queue state using Angular Signals.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewQueueState {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Overall review status */
  readonly status = signal<ReviewStatus>('loading');

  /** The complete review queue data */
  readonly queue = signal<ReviewQueueVM | null>(null);

  /** Currently selected item index (1-based for display, 0-based for array access) */
  readonly currentIndex = signal(1);

  /** Decision draft for the current item */
  readonly draftDecision = signal<ItemDecisionDraft | null>(null);

  /** Error message from API calls */
  readonly errorMessage = signal<string | null>(null);

  // Computed: Current item being reviewed
  readonly currentItem = computed<ReviewItemVM | undefined>(() => {
    const q = this.queue();
    const idx = this.currentIndex();
    if (!q || idx < 1) return undefined;
    return q.items[idx - 1];
  });

  // Computed: Progress percentage (0-100)
  readonly progressPercent = computed<number>(() => {
    const q = this.queue();
    const idx = this.currentIndex();
    if (!q) return 0;
    return Math.round((idx / q.totalItems) * 100);
  });

  // Computed: Pass rate (accepted / reviewed * 100)
  readonly passRate = computed<number | null>(() => {
    const q = this.queue();
    if (!q || q.reviewedItems === 0) return null;
    return Math.round((q.acceptedItems / q.reviewedItems) * 100);
  });

  // Computed: Check if current item has been reviewed
  readonly isCurrentItemReviewed = computed<boolean>(() => {
    const item = this.currentItem();
    return !!item?.decision;
  });

  // Computed: Boundary checks
  readonly isFirstItem = computed(() => this.currentIndex() === 1);
  readonly isLastItem = computed(() => {
    const q = this.queue();
    if (!q) return false;
    return this.currentIndex() === q.totalItems;
  });

  // Computed: Can submit current decision
  readonly canSubmit = computed(() => {
    const draft = this.draftDecision();
    if (!draft) return false;

    // Reject and Hold require a reason
    if ((draft.decision === 'reject' || draft.decision === 'hold') && !draft.reason.trim()) {
      return false;
    }

    return true;
  });

  // Computed: Items array getter
  readonly items = computed<ReviewItemVM[]>(() => {
    return this.queue()?.items ?? [];
  });

  // Computed: Total items count getter
  readonly totalItems = computed<number>(() => {
    return this.queue()?.totalItems ?? 0;
  });

  // Computed: Reviewed items count getter
  readonly reviewedItems = computed<number>(() => {
    return this.queue()?.reviewedItems ?? 0;
  });

  // Computed: Accepted items count getter
  readonly acceptedItems = computed<number>(() => {
    return this.queue()?.acceptedItems ?? 0;
  });

  // Computed: Can go to previous item
  readonly canGoPrevious = computed<boolean>(() => {
    return !this.isFirstItem();
  });

  // Computed: Can go to next item
  readonly canGoNext = computed<boolean>(() => {
    return !this.isLastItem();
  });

  /**
   * Load review queue for a given cycle ID
   */
  async loadQueue(cycleId: string): Promise<void> {
    this.status.set('loading');
    this.errorMessage.set(null);

    try {
      // TODO: Replace with actual API call
      // const data = await this.apiService.getQueue(cycleId);

      // For now, use mock data with the cycleId
      const data = { ...mockReviewQueue, cycleId };

      this.queue.set(data);
      this.currentIndex.set(1);
      this.draftDecision.set(null);
      this.status.set('ready');
    } catch (error) {
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Failed to load queue');
    }
  }

  /**
   * Navigate to a specific item index
   */
  goToItem(index: number): void {
    const q = this.queue();
    if (!q) return;
    if (index < 1 || index > q.totalItems) return;

    this.currentIndex.set(index);
    this.draftDecision.set(null);
  }

  /**
   * Move to next item
   */
  nextItem(): void {
    if (this.isLastItem()) return;
    this.currentIndex.set(this.currentIndex() + 1);
    this.draftDecision.set(null);
  }

  /**
   * Move to previous item
   */
  prevItem(): void {
    if (this.isFirstItem()) return;
    this.currentIndex.set(this.currentIndex() - 1);
    this.draftDecision.set(null);
  }

  /**
   * Alias for prevItem - go to previous item
   */
  goToPrevious(): void {
    this.prevItem();
  }

  /**
   * Alias for nextItem - go to next item
   */
  goToNext(): void {
    this.nextItem();
  }

  /**
   * Skip current item (mark as skipped)
   */
  skipItem(): void {
    const item = this.currentItem();
    if (!item) return;

    const q = this.queue();
    if (!q) return;

    // Update item decision
    const updatedItems = [...q.items];
    updatedItems[this.currentIndex() - 1] = {
      ...item,
      decision: 'skipped' as DecisionType,
    };

    this.queue.set({
      ...q,
      items: updatedItems,
      reviewedItems: q.reviewedItems + 1,
    });

    // Move to next item if not last
    if (!this.isLastItem()) {
      this.nextItem();
    } else {
      this.status.set('completed');
    }
  }

  /**
   * Set draft decision for current item
   */
  setDraftDecision(decision: ItemDecisionDraft): void {
    this.draftDecision.set(decision);
  }

  /**
   * Submit current item decision
   */
  async submitCurrentDecision(): Promise<void> {
    const draft = this.draftDecision();
    if (!draft || !this.canSubmit()) return;

    const item = this.currentItem();
    const q = this.queue();
    if (!item || !q) return;

    this.status.set('submitting');

    try {
      // TODO: Replace with actual API call
      // await this.apiService.submitItemDecision(item.itemId, draft);

      // Update local state
      const updatedItems = [...q.items];
      updatedItems[this.currentIndex() - 1] = {
        ...item,
        decision: draft.decision as DecisionType,
        reason: draft.reason,
      };

      const acceptedCount = draft.decision === 'accept'
        ? q.acceptedItems + 1
        : q.acceptedItems;

      this.queue.set({
        ...q,
        items: updatedItems,
        reviewedItems: q.reviewedItems + 1,
        acceptedItems: acceptedCount,
      });

      // Move to next item or complete
      if (!this.isLastItem()) {
        this.nextItem();
        this.status.set('ready');
      } else {
        this.status.set('completed');
      }
    } catch (error) {
      this.status.set('ready');
      this.errorMessage.set(error instanceof Error ? error.message : 'Failed to submit decision');
    }
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    this.status.set('loading');
    this.queue.set(null);
    this.errorMessage.set(null);
    this.currentIndex.set(1);
    this.draftDecision.set(null);
  }
}

/**
 * Convenience hook to inject the review queue state service
 * Usage: const state = useReviewQueueState();
 */
export function useReviewQueueState() {
  return inject(ReviewQueueState);
}

/**
 * Alias for useReviewQueueState for simpler naming
 * Usage: const state = useReviewQueue();
 */
export function useReviewQueue() {
  return useReviewQueueState();
}

/**
 * Hook to extract and validate route parameters for review queue page
 * Usage: const params = useReviewQueueParams();
 */
export function useReviewQueueParams(): ReviewQueueRouteParams {
  const route = inject(ActivatedRoute);
  const params = route.snapshot.params;

  // Validate required params
  const cycleId = params['cycleId'] as string;
  const experimentId = params['experimentId'] as string;
  const assetId = params['assetId'] as string;

  if (!cycleId || !experimentId || !assetId) {
    throw new Error('Missing required route parameters: cycleId, experimentId, or assetId');
  }

  return { cycleId, experimentId, assetId };
}
