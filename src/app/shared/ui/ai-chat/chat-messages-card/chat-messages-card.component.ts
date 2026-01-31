/**
 * Chat Messages Card Component
 * Draggable and resizable message container
 * Mineral & Time Theme - Angular 20+
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ViewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { DragHandleDirective } from '../directives/drag-handle.directive';
import { ResizeHandleDirective } from '../directives/resize-handle.directive';
import { LiquidGlassDirective } from '../../liquid-glass';
import { ChatMessage, PanelPosition, PanelSize } from '../types/chat.types';

/**
 * Chat messages card component
 * Displays chat history with drag/resize capabilities
 */
@Component({
  selector: 'ai-chat-messages-card',
  standalone: true,
  imports: [DragHandleDirective, ResizeHandleDirective, LiquidGlassDirective],
  template: `
    <div
      #card
      liquidGlass
      lgTheme="mineral-light"
      lgCornerRadius="12px"
      [lgBlurAmount]="0.5"
      [lgDisplacementScale]="0"
      lgTint="oklch(0 0 0 / 2%)"
      lgHotspot="oklch(1 0 0 / 3%)"
      lgAriaLabel="Chat messages card"
      class="chat-messages-card"
      [class.collapsed]="isCollapsed()"
      [style.position]="'fixed'"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      [style.width.px]="size().width"
      [style.height.px]="size().height"
    >
      <!-- Drag Handle (Top) -->
      <div
        class="drag-handle"
        dragHandle
        [dragTarget]="cardRef"
        (dragStart)="onDragStart($event)"
        (dragMove)="onDragMove($event)"
        (dragEnd)="onDragEnd($event)"
        [attr.aria-label]="'Drag to move'"
      >
        <div class="drag-lines">
          <div class="drag-line"></div>
          <div class="drag-line"></div>
          <div class="drag-line"></div>
        </div>
      </div>

      <!-- Resize Handle (Bottom-right) -->
      <div
        class="resize-handle"
        resizeHandle
        [resizeTarget]="cardRef"
        [minSize]="minSize()"
        (resizeStart)="onResizeStart($event)"
        (resizeMove)="onResizeMove($event)"
        (resizeEnd)="onResizeEnd($event)"
        [attr.aria-label]="'Drag to resize'"
      >
        <div class="resize-indicator"></div>
      </div>

      <!-- Messages Container -->
      <div class="chat-messages" #messagesContainer>
        @for (message of messages(); track message.id) {
          <div [class]="'message message-' + message.role">
            <div class="message-bubble">
              @if (message.role === 'assistant') {
                <div class="ai-bubble-content">
                  <p>{{ message.content }}</p>
                  @if (message.actions && message.actions.length > 0) {
                    <div class="action-buttons">
                      @for (action of message.actions; track action.id) {
                        <button
                          type="button"
                          class="action-button"
                          (click)="action.action()"
                          [attr.aria-label]="action.label"
                        >
                          @if (action.icon) {
                            <span class="action-icon">{{ action.icon }}</span>
                          }
                          <span>{{ action.label }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              } @else {
                {{ message.content }}
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .chat-messages-card {
        position: relative;
        overflow: visible;
        transition: all var(--duration-slow) cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideUp 0.4s ease-out;
      }

      .chat-messages-card.collapsed {
        max-height: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
        overflow: hidden;
        pointer-events: none;
      }

      /* Drag Handle */
      .drag-handle {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px 16px;
        cursor: grab;
        transition: all var(--duration-fast) ease;
        z-index: 1000;
        pointer-events: auto;
        user-select: none;
        opacity: 0.4;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .drag-handle:hover {
        opacity: 0.7;
      }

      .drag-lines {
        display: flex;
        flex-direction: column;
        gap: 3px;
        pointer-events: none;
      }

      .drag-line {
        width: 20px;
        height: 2px;
        background: oklch(0.48 0.07 195);
        border-radius: 1px;
      }

      /* Resize Handle */
      .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        opacity: 0;
        transition: opacity var(--duration-fast) ease;
        z-index: 10;
      }

      .chat-messages-card:hover .resize-handle {
        opacity: 0.4;
      }

      .resize-handle:hover {
        opacity: 0.6 !important;
      }

      .resize-indicator {
        position: absolute;
        bottom: 3px;
        right: 3px;
        width: 10px;
        height: 10px;
        pointer-events: none;
      }

      .resize-indicator::before,
      .resize-indicator::after {
        content: '';
        position: absolute;
        background: oklch(0.48 0.07 195);
        border-radius: 1px;
      }

      .resize-indicator::before {
        width: 10px;
        height: 2px;
        bottom: 2px;
        transform: rotate(45deg);
        transform-origin: left center;
      }

      .resize-indicator::after {
        width: 6px;
        height: 2px;
        bottom: 0;
        right: 0;
        transform: rotate(45deg);
        transform-origin: left center;
      }

      /* Messages Container */
      .chat-messages {
        max-height: 100%;
        padding: 12px 16px 16px 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Message */
      .message {
        display: flex;
        width: 100%;
        animation: messageSlideIn 0.3s ease-out;
      }

      .message.user {
        justify-content: flex-end;
      }

      .message.assistant {
        justify-content: flex-start;
      }

      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Message Bubble */
      .message-bubble {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
        font-family: var(--font-sans);
      }

      .message.user .message-bubble {
        background: oklch(0.42 0.04 195);
        color: oklch(1 0 0);
      }

      .message.assistant .message-bubble {
        background: oklch(0.88 0.015 85 / 80%);
        border: 1px solid oklch(0.48 0.07 195 / 20%);
        color: oklch(0.28 0.03 185);
      }

      .ai-bubble-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ai-bubble-content p {
        margin: 0;
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-button {
        padding: 6px 12px;
        border-radius: 6px;
        background: oklch(0.48 0.07 195 / 10%);
        border: 1px solid oklch(0.48 0.07 195 / 30%);
        color: oklch(0.48 0.07 195);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: all var(--duration-fast) ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .action-button:hover {
        background: oklch(0.48 0.07 195 / 20%);
        border-color: oklch(0.48 0.07 195 / 50%);
      }

      .action-button:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195);
        outline-offset: 2px;
      }

      .action-icon {
        font-size: 12px;
      }

      /* Scrollbar */
      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: oklch(1 0 0 / 50%);
        border-radius: 3px;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: oklch(0.85 0.015 85);
        border-radius: 3px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: oklch(0.80 0.015 85);
      }

      /* Animations */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .drag-handle {
          top: -20px;
        }
      }
    `,
  ],
})
export class ChatMessagesCardComponent {
  @ViewChild('card')
  cardRef!: ElementRef<HTMLDivElement>;

  @ViewChild('messagesContainer')
  messagesContainerRef!: ElementRef<HTMLDivElement>;

  /**
   * Messages to display
   */
  readonly messages = input<ChatMessage[]>([]);

  /**
   * Position signal
   */
  readonly position = input.required<PanelPosition>();

  /**
   * Size signal
   */
  readonly size = input.required<PanelSize>();

  /**
   * Collapsed state
   */
  readonly isCollapsed = input(false);

  /**
   * Minimum size
   */
  readonly minSize = input<PanelSize>({ width: 300, height: 200 });

  /**
   * Emit position changes
   */
  readonly positionChange = output<PanelPosition>();

  /**
   * Emit size changes
   */
  readonly sizeChange = output<PanelSize>();

  /**
   * Emit when drag starts
   */
  readonly dragStart = output<PanelPosition>();

  /**
   * Emit when resize starts
   */
  readonly resizeStart = output<PanelSize>();

  /**
   * Emit when collapse is toggled
   */
  readonly collapseToggle = output<void>();

  /**
   * Is currently dragging
   */
  readonly isDragging = signal(false);

  /**
   * Is currently resizing
   */
  readonly isResizing = signal(false);

  constructor() {
    afterNextRender(() => {
      this.scrollToBottom();
    });
  }

  /**
   * Handle drag start
   */
  onDragStart(position: PanelPosition): void {
    this.isDragging.set(true);
    this.dragStart.emit(position);
  }

  /**
   * Handle drag move
   */
  onDragMove(position: PanelPosition): void {
    this.positionChange.emit(position);
  }

  /**
   * Handle drag end
   */
  onDragEnd(position: PanelPosition): void {
    this.isDragging.set(false);
    this.positionChange.emit(position);
  }

  /**
   * Handle resize start
   */
  onResizeStart(size: PanelSize): void {
    this.isResizing.set(true);
    this.resizeStart.emit(size);
  }

  /**
   * Handle resize move
   */
  onResizeMove(size: PanelSize): void {
    this.sizeChange.emit(size);
  }

  /**
   * Handle resize end
   */
  onResizeEnd(size: PanelSize): void {
    this.isResizing.set(false);
    this.sizeChange.emit(size);
  }

  /**
   * Scroll messages to bottom
   */
  scrollToBottom(): void {
    if (this.messagesContainerRef) {
      const container = this.messagesContainerRef.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
