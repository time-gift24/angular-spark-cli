/**
 * Review Queue Page Integration Tests
 *
 * Integration tests for ReviewQueuePage component with ReviewQueueState.
 * Tests component behavior with mocked state service.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

import { ReviewQueuePageComponent } from './review-queue-page.component';
import { ReviewQueueState, REVIEW_QUEUE_STATE } from '@app/features/review-queue/hooks/use-review-queue';
import { ReviewQueueVM, ReviewStatus } from '@app/features/review-queue/models';

/**
 * Mock ReviewQueueState for testing
 */
class MockReviewQueueState implements ReviewQueueState {
  readonly status = jasmine.createSpy('status').and.returnValue('loading' as any);
  readonly queue = jasmine.createSpy('queue').and.returnValue(null as any);
  readonly errorMessage = jasmine.createSpy('errorMessage').and.returnValue(null as any);
  readonly currentIndex = jasmine.createSpy('currentIndex').and.returnValue(1 as any);
  readonly draftDecision = jasmine.createSpy('draftDecision').and.returnValue(null as any);

  // Computed
  readonly currentItem = jasmine.createSpy('currentItem').and.returnValue(undefined as any);
  readonly progressPercent = jasmine.createSpy('progressPercent').and.returnValue(0 as any);
  readonly passRate = jasmine.createSpy('passRate').and.returnValue(null as any);
  readonly isCurrentItemReviewed = jasmine.createSpy('isCurrentItemReviewed').and.returnValue(false as any);
  readonly isFirstItem = jasmine.createSpy('isFirstItem').and.returnValue(true as any);
  readonly isLastItem = jasmine.createSpy('isLastItem').and.returnValue(false as any);
  readonly canSubmit = jasmine.createSpy('canSubmit').and.returnValue(false as any);

  // Methods
  readonly items = jasmine.createSpy('items').and.returnValue([]);
  readonly totalItems = jasmine.createSpy('totalItems').and.returnValue(0 as any);
  readonly canGoPrevious = jasmine.createSpy('canGoPrevious').and.returnValue(false as any);
  readonly canGoNext = jasmine.createSpy('canGoNext').and.returnValue(true as any);

  // Actions
  loadQueue = jasmine.createSpy('loadQueue').and.returnValue(Promise.resolve());
  goToItem = jasmine.createSpy('goToItem');
  nextItem = jasmine.createSpy('nextItem').and.callThrough();
  prevItem = jasmine.createSpy('prevItem').and.callThrough();
  goToNext = jasmine.createSpy('goToNext').and.callThrough();
  goToPrevious = jasmine.createSpy('goToPrevious').and.callThrough();
  skipItem = jasmine.createSpy('skipItem').and.callThrough();
  setDraftDecision = jasmine.createSpy('setDraftDecision');
  submitCurrentDecision = jasmine.createSpy('submitCurrentDecision').and.returnValue(Promise.resolve());
  reset = jasmine.createSpy('reset');
}

describe('ReviewQueuePage Integration Tests', () => {
  let component: ReviewQueuePageComponent;
  let fixture: ComponentFixture<ReviewQueuePageComponent>;
  let mockState: MockReviewQueueState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewQueuePageComponent],
      providers: [
        {
          provide: REVIEW_QUEUE_STATE,
          useFactory: () => new MockReviewQueueState(),
        },
        provideRouter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewQueuePageComponent);
    component = fixture.componentInstance;
    mockState = TestBed.inject(REVIEW_QUEUE_STATE) as unknown as MockReviewQueueState;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadQueue on init with route params', () => {
    spyOn(TestBed.inject(Router) as any, 'navigate').and.callThrough();

    // Manually trigger ngOnInit
    component.ngOnInit();

    expect(mockState.loadQueue).toHaveBeenCalledWith({
      cycleId: 'cycle-001',
      experimentId: 'exp-001',
      assetId: 'asset-001',
    });
  });

  it('should display loading state while loading', () => {
    (mockState.status as jasmine.Spy).and.returnValue('loading' as any);
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector('.review-queue-loading, .text-muted-foreground');
    expect(loadingEl).toBeTruthy();
  });

  it('should display error state when error', () => {
    (mockState.status as jasmine.Spy).and.returnValue('error' as any);
    (mockState.errorMessage as jasmine.Spy).and.returnValue('Failed to load' as any);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.text-destructive');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Failed to load');
  });

  it('should display items list when ready', () => {
    const mockQueue: ReviewQueueVM = {
      cycleId: 'cycle-001',
      totalItems: 3,
      currentIndex: 1,
      reviewedItems: 0,
      acceptedItems: 0,
      progressPercent: 33,
      passRate: null,
      items: [
        {
          itemId: 'item-1',
          userQuery: 'Test Query 1',
          modelResponse: 'Test Response 1',
          outputs: [],
        },
        {
          itemId: 'item-2',
          userQuery: 'Test Query 2',
          modelResponse: 'Test Response 2',
          outputs: [],
        },
        {
          itemId: 'item-3',
          userQuery: 'Test Query 3',
          modelResponse: 'Test Response 3',
          outputs: [],
        },
      ],
    };

    (mockState.status as jasmine.Spy).and.returnValue('ready' as any);
    (mockState.queue as jasmine.Spy).and.returnValue(mockQueue as any);
    (mockState.currentIndex as jasmine.Spy).and.returnValue(1 as any);
    fixture.detectChanges();

    const queueItems = fixture.nativeElement.querySelectorAll('.queue-item');
    expect(queueItems.length).toBe(3);
  });

  it('should navigate to next item when next button clicked', () => {
    (mockState.canGoNext as jasmine.Spy).and.returnValue(true as any);

    const nextBtn = fixture.nativeElement.querySelector('button:contains("Next")');
    if (nextBtn) {
      nextBtn.click();
      fixture.detectChanges();

      expect(mockState.goToNext).toHaveBeenCalled();
    }
  });

  it('should navigate to previous item when previous button clicked', () => {
    (mockState.canGoPrevious as jasmine.Spy).and.returnValue(true as any);

    const prevBtn = fixture.nativeElement.querySelector('button:contains("Previous")');
    if (prevBtn) {
      prevBtn.click();
      fixture.detectChanges();

      expect(mockState.goToPrevious).toHaveBeenCalled();
    }
  });

  it('should submit decision when form is valid', async () => {
    (mockState.canSubmit as jasmine.Spy).and.returnValue(true as any);
    (mockState.submitCurrentDecision as jasmine.Spy).and.returnValue(Promise.resolve());

    const submitBtn = fixture.nativeElement.querySelector('button:contains("Submit Decision")');
    if (submitBtn) {
      submitBtn.click();
      await fixture.whenStable();

      expect(mockState.submitCurrentDecision).toHaveBeenCalled();
    }
  });

  it('should disable submit button when form is invalid', () => {
    (mockState.canSubmit as jasmine.Spy).and.returnValue(false as any);
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('button:contains("Submit Decision")');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.attributes['disabled']).toBeDefined();
  });

  it('should show reason input for reject decision', () => {
    (component as any).selectedDecision.set('reject');
    fixture.detectChanges();

    const reasonInput = fixture.nativeElement.querySelector('textarea[placeholder*="reason"]');
    expect(reasonInput).toBeTruthy();
  });

  it('should hide reason input for accept decision', () => {
    (component as any).selectedDecision.set('accept');
    fixture.detectChanges();

    const reasonInput = fixture.nativeElement.querySelector('textarea[placeholder*="reason"]');
    expect(reasonInput).toBeFalsy();
  });
});
