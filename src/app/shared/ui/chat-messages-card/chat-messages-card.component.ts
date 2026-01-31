import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal, viewChild, ElementRef, computed, effect, inject, DestroyRef, signal } from '@angular/core';
import { DragHandleDirective } from '../../directives/drag-handle.directive';
import { ResizeHandleDirective } from '../../directives/resize-handle.directive';
import { ChatMessage, PanelPosition, PanelSize } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Chat messages card component.
 *
 * Displays chat messages in a draggable, resizable panel. This component
 * provides the main conversation view in the AI chat panel, showing messages
 * from the user, assistant, and system.
 *
 * Key features:
 * - Displays messages with role-based styling
 * - Draggable via DragHandleDirective
 * - Resizable via ResizeHandleDirective
 * - Scrollable message list
 * - Auto-scroll to bottom on new message (smart detection)
 * - Smooth scroll animation
 * - Scroll position preservation during updates
 * - Visibility toggle support
 *
 * Phase 6 Task 6.1: Component Definition
 * - Basic component structure
 * - Drag/resize directive integration
 * - Message rendering with @for loop
 * - Basic scrollToBottom implementation
 *
 * Phase 6 Task 6.2: Enhanced Scroll Behavior
 * - Auto-scroll on new message with smart detection
 * - Smooth scroll animation support
 * - Scroll position preservation
 * - isUserNearBottom computed signal
 * - effect() to watch messages Signal
 *
 * Future enhancements (P6-T6.3):
 * - Full mineral & time theme styling
 *
 * @example
 * ```html
 * <app-chat-messages-card
 *   [messages]="messagesSignal"
 *   [isVisible]="isVisibleSignal"
 *   [position]="positionSignal"
 *   [size]="sizeSignal"
 *   (positionChange)="onPositionChange($event)"
 *   (sizeChange)="onSizeChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-chat-messages-card',
  standalone: true,
  imports: [CommonModule, DragHandleDirective, ResizeHandleDirective, DatePipe],
  templateUrl: './chat-messages-card.component.html',
  styleUrls: ['./chat-messages-card.component.css'],
})
export class ChatMessagesCardComponent {
  /**
   * Signal containing the array of chat messages to display.
   * Messages are rendered in chronological order using @for loop.
   */
  @Input()
  messages: Signal<ChatMessage[]>;

  /**
   * Signal controlling the visibility of the messages card.
   * When false, the card is hidden (collapsed state).
   * When true, the card is visible and interactive.
   */
  @Input()
  isVisible: Signal<boolean>;

  /**
   * Signal containing the current position of the panel.
   * Used by DragHandleDirective to track and update position.
   */
  @Input()
  position: Signal<PanelPosition>;

  /**
   * Signal containing the current size of the panel.
   * Used by ResizeHandleDirective to track and update size.
   */
  @Input()
  size: Signal<PanelSize>;

  /**
   * Emits when the panel position changes during drag operations.
   * Parent components should update their position state when this fires.
   */
  @Output() positionChange = new EventEmitter<PanelPosition>();

  /**
   * Emits when the panel size changes during resize operations.
   * Parent components should update their size state when this fires.
   */
  @Output() sizeChange = new EventEmitter<PanelSize>();

  /**
   * Safe getter for position that handles undefined during component initialization.
   * Returns default position if position signal is not yet available.
   */
  get safePosition(): PanelPosition {
    return this.position?.() ?? { x: 0, y: 0 };
  }

  /**
   * Safe getter for size that handles undefined during component initialization.
   * Returns default size if size signal is not yet available.
   */
  get safeSize(): PanelSize {
    return this.size?.() ?? { width: 400, height: 600 };
  }

  /**
   * Safe getter for visibility that handles undefined during component initialization.
   * Returns false if isVisible signal is not yet available.
   */
  get safeIsVisible(): boolean {
    return this.isVisible?.() ?? false;
  }

  /**
   * Safe getter for messages that handles undefined during component initialization.
   * Returns empty array if messages signal is not yet available.
   */
  get safeMessages(): ChatMessage[] {
    return this.messages?.() ?? [];
  }

  /**
   * Reference to the message list container element.
   * Used for scroll-to-bottom functionality and scroll position tracking.
   *
   * This viewChild reference enables:
   * - scrollToBottom() method (P6-T6.1)
   * - Auto-scroll on new message (P6-T6.2)
   * - Scroll position preservation (P6-T6.2)
   * - isUserNearBottom detection (P6-T6.2)
   */
  readonly messageListRef = viewChild.required<ElementRef<HTMLDivElement>>('messageList');

  /**
   * Threshold in pixels for considering user "near bottom" of message list.
   * If user is within this distance from bottom, auto-scroll will trigger.
   *
   * @default 50 (pixels)
   */
  private readonly NEAR_BOTTOM_THRESHOLD = 50;

  /**
   * Computed signal that detects if user is currently near bottom of message list.
   *
   * This is used to determine whether to auto-scroll when new messages arrive.
   * If user is near bottom, we auto-scroll (they're following conversation).
   * If user is reading above, we don't scroll (don't interrupt their reading).
   *
   * Returns true if:
   * - Element doesn't exist yet (default to true for initial render)
   * - Distance from bottom is less than NEAR_BOTTOM_THRESHOLD
   *
   * @returns boolean - true if user is near bottom or element not ready
   */
  readonly isUserNearBottom = computed(() => {
    const element = this.messageListRef()?.nativeElement;
    if (!element) return true; // Default to true during initialization

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    return distanceFromBottom < this.NEAR_BOTTOM_THRESHOLD;
  });

  /**
   * Private signal to track previous message count for detecting new messages.
   * Used in effect() to determine when messages are added vs updated.
   */
  private previousMessageCount = signal(0);

  /**
   * DestroyRef for cleanup in effect.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Effect that automatically scrolls to bottom when new messages arrive,
   * but only if user is already near bottom (following the conversation).
   *
   * This prevents jarring scroll jumps when user is reading older messages
   * while new messages arrive.
   *
   * Logic:
   * 1. Watch messages() signal
   * 2. Detect if new messages were added (count increased)
   * 3. Check if user is near bottom
   * 4. If both true, scroll to bottom smoothly
   * 5. Use setTimeout to ensure DOM has updated
   */
  private readonly autoScrollEffect = effect(() => {
    const messages = this.messages();
    const currentCount = messages.length;
    const previousCount = this.previousMessageCount();

    // Only scroll if new messages were added
    if (currentCount > previousCount && currentCount > 0) {
      const isNearBottom = this.isUserNearBottom();

      if (isNearBottom) {
        // Wait for DOM to update, then scroll smoothly
        setTimeout(() => {
          this.scrollToBottom('smooth');
        }, 0);
      }
    }

    // Update previous count for next effect run
    this.previousMessageCount.set(currentCount);
  });

  /**
   * Scrolls the message list to the bottom with optional smooth behavior.
   *
   * This method scrolls the message list to show the most recent messages.
   * Supports both smooth animation and instant scrolling.
   *
   * Phase 6 Task 6.1: Basic implementation with instant scroll
   * Phase 6 Task 6.2: Enhanced with smooth scroll and scroll preservation
   *
   * @param behavior - Scroll behavior: 'smooth' for animation, 'auto' for instant
   *
   * @example
   * ```typescript
   * // Smooth scroll to bottom (default)
   * messagesCard.scrollToBottom();
   *
   * // Instant scroll to bottom
   * messagesCard.scrollToBottom('auto');
   *
   * // Scroll when new message arrives
   * messages.set([...messages(), newMessage]);
   * messagesCard.scrollToBottom('smooth');
   * ```
   */
  scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    const messageListEl = this.messageListRef()?.nativeElement;
    if (!messageListEl) {
      console.warn('[ChatMessagesCard] Cannot scroll: message list not initialized');
      return;
    }
    this.performScroll(messageListEl, behavior);
  }

  /**
   * Performs the actual scroll operation to the bottom of the message list.
   *
   * This private method contains the scrolling logic, separated from
   * scrollToBottom() for better testability and future enhancement.
   *
   * Supports smooth and instant scrolling via the ScrollBehavior API.
   *
   * @param element - The message list container element to scroll
   * @param behavior - Scroll behavior: 'smooth' or 'auto'
   */
  private performScroll(element: HTMLDivElement, behavior: ScrollBehavior): void {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: behavior,
    });
  }
}
