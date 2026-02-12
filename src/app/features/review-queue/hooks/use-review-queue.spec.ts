/**
 * Review Queue State Service Unit Tests
 *
 * Test coverage for ReviewQueueState service and hooks.
 * Tests signal operations, computed properties, and actions.
 */

import { TestBed } from '@angular/core/testing';
import { InjectionToken } from '@angular/core';
import { first } from 'rxjs';

import { REVIEW_QUEUE_STATE, ReviewQueueState, createReviewQueueState } from './use-review-queue';
import { ReviewApiService } from '@app/features/review-queue/services/review-api.service';
import { ReviewQueueVM, ReviewStatus, DecisionType } from '@app/features/review-queue/models';

/**
 * Mock API service for testing
 */
class MockReviewApiService {
  getUpgradeCycle = jasmine.createSpy('getUpgradeCycle').and.callThrough();
  getExperimentScores = jasmine.createSpy('getExperimentScores').and.callThrough();
  submitItemDecision = jasmine.createSpy('submitItemDecision').and.callThrough();
  submitCycleDecision = jasmine.createSpy('submitCycleDecision').and.callThrough();
}

describe('ReviewQueueState', () => {
  let service: ReviewQueueState;
  let mockApi: MockReviewApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: REVIEW_QUEUE_STATE,
          useFactory: () => {
            const api = new MockReviewApiService();
            return new createReviewQueueState();
          },
        },
        ReviewApiService,
      ],
    });

    service = TestBed.inject(REVIEW_QUEUE_STATE);
    mockApi = TestBed.inject(ReviewApiService) as unknown as MockReviewApiService;
  });

  afterEach(() => {
    // Reset all spies after each test
    if (mockApi.getUpgradeCycle) {
      (mockApi.getUpgradeCycle as jasmine.Spy).calls.reset();
    }
    if (mockApi.getExperimentScores) {
      (mockApi.getExperimentScores as jasmine.Spy).calls.reset();
    }
    if (mockApi.submitItemDecision) {
      (mockApi.submitItemDecision as jasmine.Spy).calls.reset();
    }
  });

  describe('Initial state', () => {
    it('should have loading status initially', () => {
      expect(service.status()()).toBe('loading');
    });

    it('should have null queue initially', () => {
      expect(service.queue()()).toBeNull();
    });

    it('should have currentIndex at 1 initially', () => {
      expect(service.currentIndex()()).toBe(1);
    });

    it('should have null draftDecision initially', () => {
      expect(service.draftDecision()()).toBeNull();
    });
  });

  describe('Computed properties', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: REVIEW_QUEUE_STATE,
            useFactory: () => {
              const api = new MockReviewApiService();
              // Setup mock data
              (api.getUpgradeCycle as jasmine.Spy).and.returnValue({
                id: 'cycle-001',
                name: 'Test Cycle',
                status: 'active',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              });
              (api.getExperimentScores as jasmine.Spy).and.returnValue([
                { id: 'score-1', itemId: 'item-1', checkItemName: 'Test', score: 95, passed: true, message: 'Good' },
                { id: 'score-2', itemId: 'item-2', checkItemName: 'Test', score: 80, passed: true, message: 'OK' },
              ]);
              return new createReviewQueueState();
            },
          },
          ],
        ],
      });

      service = TestBed.inject(REVIEW_QUEUE_STATE);
    });

    it('should return current item correctly', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 3,
        currentIndex: 1,
        reviewedItems: 1,
        acceptedItems: 0,
        progressPercent: 33,
        passRate: null,
        items: [
          {
            itemId: 'item-1',
            userQuery: 'Query 1',
            modelResponse: 'Response 1',
            outputs: [],
            decision: 'accept' as DecisionType,
            reason: 'Good result',
          },
          {
            itemId: 'item-2',
            userQuery: 'Query 2',
            modelResponse: 'Response 2',
            outputs: [],
          },
          {
            itemId: 'item-3',
            userQuery: 'Query 3',
            modelResponse: 'Response 3',
            outputs: [],
          },
        ],
      };

      // Setup the service with mock queue data
      (service as any).internalQueue.set(mockQueue);

      expect(service.currentItem()()?.itemId).toBe('item-1');
    });

    it('should calculate progressPercent correctly', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 0,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);

      expect(service.progressPercent()()).toBe(10); // 1/10 = 10%
    });

    it('should return passRate as null when no items reviewed', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 0,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);

      expect(service.passRate()()).toBeNull();
    });

    it('should return isFirstItem correctly', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 0,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);

      expect(service.isFirstItem()()).toBeTrue();
    });

    it('should return isLastItem correctly', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 10,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 100,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);

      expect(service.isLastItem()()).toBeTrue();
    });

    it('should return canSubmit as false when no draft', () => {
      expect(service.canSubmit()()).toBeFalse();
    });

    it('should return canSubmit as true for accept decision without reason', () => {
      (service as any).draftDecision.set({ decision: 'accept' as DecisionType, reason: '' });

      expect(service.canSubmit()()).toBeTrue();
    });

    it('should return canSubmit as false for reject decision without reason', () => {
      (service as any).draftDecision.set({ decision: 'reject' as DecisionType, reason: '' });

      expect(service.canSubmit()()).toBeFalse();
    });

    it('should return canSubmit as true for reject decision with reason', () => {
      (service as any).draftDecision.set({ decision: 'reject' as DecisionType, reason: 'Test reason' });

      expect(service.canSubmit()()).toBeTrue();
    });

    it('should return canSubmit as true for hold decision with reason', () => {
      (service as any).draftDecision.set({ decision: 'hold' as DecisionType, reason: 'Test reason' }));

      expect(service.canSubmit()()).toBeTrue();
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: REVIEW_QUEUE_STATE,
            useFactory: () => {
              const api = new MockReviewApiService();
              return new createReviewQueueState();
            },
          },
          ],
        ],
      });

      service = TestBed.inject(REVIEW_QUEUE_STATE);
      mockApi = TestBed.inject(ReviewApiService) as unknown as MockReviewApiService;
    });

    it('should load queue from API', async () => {
      const mockCycleData = {
        id: 'cycle-001',
        name: 'Test Cycle',
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      const mockScores = [
        { id: 'score-1', itemId: 'item-1', checkItemName: 'Test', score: 95, passed: true, message: 'Good' },
      ];

      (mockApi.getUpgradeCycle as jasmine.Spy).and.returnValue(Promise.resolve(mockCycleData));
      (mockApi.getExperimentScores as jasmine.Spy).and.returnValue(Promise.resolve(mockScores));

      await service.loadQueue({
        cycleId: 'cycle-001',
        experimentId: 'exp-001',
        assetId: 'asset-001',
      });

      expect(service.status()()).toBe('ready');
      expect(mockApi.getUpgradeCycle).toHaveBeenCalledWith('cycle-001');
      expect(mockApi.getExperimentScores).toHaveBeenCalledWith('exp-001');
    });

    it('should navigate to next item', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 10,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);
      service.goToNext();

      expect(service.currentIndex()()).toBe(2);
    });

    it('should navigate to previous item', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 2,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 20,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);
      service.goToPrevious();

      expect(service.currentIndex()()).toBe(1);
    });

    it('should navigate to specific item', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 10,
        passRate: null,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);
      service.goToItem(5);

      expect(service.currentIndex()()).toBe(5);
    });

    it('should set draft decision', () => {
      service.setDraftDecision({
        decision: 'accept' as DecisionType,
        reason: 'Test reason',
      });

      expect(service.draftDecision()()).toEqual({
        decision: 'accept' as DecisionType,
        reason: 'Test reason',
      });
    });

    it('should submit decision via API', async () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 1,
        reviewedItems: 0,
        acceptedItems: 0,
        progressPercent: 10,
        passRate: null,
        items: [
          {
            itemId: 'item-1',
            userQuery: 'Query 1',
            modelResponse: 'Response 1',
            outputs: [],
          },
        ],
      };

      (service as any).internalQueue.set(mockQueue);
      (mockApi.submitItemDecision as jasmine.Spy).and.returnValue(
        Promise.resolve({ success: true, decisionId: 'decision-123' })
      );

      (service as any).draftDecision.set({
        decision: 'reject' as DecisionType,
        reason: 'Test reason',
      });

      await service.submitCurrentDecision();

      expect(mockApi.submitItemDecision).toHaveBeenCalledWith(
        'cycle-001',
        'item-1',
        'reject',
        'Test reason'
      );

      expect(service.status()()).toBe('ready'); // Should return to ready after submit
    });

    it('should handle API error during loadQueue', async () => {
      (mockApi.getUpgradeCycle as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      await service.loadQueue({
        cycleId: 'cycle-001',
        experimentId: 'exp-001',
        assetId: 'asset-001',
      });

      expect(service.status()()).toBe('error');
      expect(service.errorMessage()()).toBe('Network error');
    });

    it('should reset state', () => {
      const mockQueue: ReviewQueueVM = {
        cycleId: 'cycle-001',
        totalItems: 10,
        currentIndex: 5,
        reviewedItems: 5,
        acceptedItems: 3,
        progressPercent: 50,
        passRate: 60,
        items: [],
      };

      (service as any).internalQueue.set(mockQueue);

      service.reset();

      expect(service.status()()).toBe('loading');
      expect(service.queue()()).toBeNull();
      expect(service.currentIndex()()).toBe(1);
      expect(service.draftDecision()()).toBeNull();
    });
  });
});
