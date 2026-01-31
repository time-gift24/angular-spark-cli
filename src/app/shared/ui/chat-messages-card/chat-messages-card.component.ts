import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal, viewChild, ElementRef } from '@angular/core';
import { DragHandleDirective } from '../../directives/drag-handle.directive';
import { ResizeHandleDirective } from '../../directives/resize-handle.directive';
import { ChatMessage, PanelPosition, PanelSize } from '../../models';

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
 * - Scroll-to-bottom functionality (basic implementation)
 * - Visibility toggle support
 *
 * Phase 6 Task 6.1: Component Definition
 * - Basic component structure
 * - Drag/resize directive integration
 * - Message rendering with @for loop
 * - Basic scrollToBottom implementation
 *
 * Future enhancements (P6-T6.2):
 * - Auto-scroll on new message
 * - Preserve scroll position on session switch
 * - Smooth scroll behavior
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
  @Input({ required: true }) messages!: Signal<ChatMessage[]>;

  /**
   * Signal controlling the visibility of the messages card.
   * When false, the card is hidden (collapsed state).
   * When true, the card is visible and interactive.
   */
  @Input({ required: true }) isVisible!: Signal<boolean>;

  /**
   * Signal containing the current position of the panel.
   * Used by DragHandleDirective to track and update position.
   */
  @Input({ required: true }) position!: Signal<PanelPosition>;

  /**
   * Signal containing the current size of the panel.
   * Used by ResizeHandleDirective to track and update size.
   */
  @Input({ required: true }) size!: Signal<PanelSize>;

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
   * Reference to the message list container element.
   * Used for scroll-to-bottom functionality.
   *
   * This viewChild reference enables:
   * - scrollToBottom() method (P6-T6.1)
   * - Auto-scroll on new message (P6-T6.2)
   * - Scroll position preservation (P6-T6.2)
   */
  readonly messageListRef = viewChild.required<ElementRef<HTMLDivElement>>('messageList');

  /**
   * Scrolls the message list to the bottom.
   *
   * This is a basic implementation that immediately scrolls to the bottom.
   * Used to show the most recent messages in the conversation.
   *
   * Phase 6 Task 6.1: Basic implementation with instant scroll
   * Phase 6 Task 6.2: Will enhance with smooth scroll and scroll preservation
   *
   * @example
   * ```typescript
   * // Scroll to bottom when new message arrives
   * messages.set([...messages(), newMessage]);
   * messagesCard.scrollToBottom();
   * ```
   */
  scrollToBottom(): void {
    const messageListEl = this.messageListRef().nativeElement;
    if (messageListEl) {
      this.smoothScrollToBottom(messageListEl);
    }
  }

  /**
   * Performs the actual scroll operation to the bottom of the message list.
   *
   * This private method contains the scrolling logic, separated from
   * scrollToBottom() for better testability and future enhancement.
   *
   * Currently uses instant scroll (scrollTop = scrollHeight).
   * In P6-T6.2, this will be enhanced with smooth scrolling options.
   *
   * @param element - The message list container element to scroll
   */
  private smoothScrollToBottom(element: HTMLDivElement): void {
    element.scrollTop = element.scrollHeight;
  }
}
