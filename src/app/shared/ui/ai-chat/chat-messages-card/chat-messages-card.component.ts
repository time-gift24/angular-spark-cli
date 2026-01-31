/**
 * Chat Messages Card Component
 * Fixed position message container on the right side
 * Mineral & Time Theme - Angular 20+
 */

import {
  Component,
  input,
  output,
  ViewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { LiquidGlassDirective } from '../../liquid-glass';
import { ChatMessage } from '../types/chat.types';

/**
 * Chat messages card component
 * Displays chat history in fixed position on right side
 */
@Component({
  selector: 'ai-chat-messages-card',
  standalone: true,
  imports: [LiquidGlassDirective],
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
    >
      <!-- Collapse/Expand Button -->
      <button
        type="button"
        class="collapse-toggle"
        [attr.aria-label]="isCollapsed() ? 'Expand chat' : 'Collapse chat'"
        [attr.aria-expanded]="!isCollapsed()"
        (click)="toggleCollapse()"
      >
        @if (isCollapsed()) {
          <!-- Expand icon (down arrow) -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        } @else {
          <!-- Collapse icon (up arrow) -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        }
      </button>

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
        position: fixed;
        right: 24px;
        top: 90px;
        width: 380px;
        max-height: 60vh;
        overflow: visible;
        transition: all var(--duration-slow) cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideInRight 0.4s ease-out;
        z-index: 999;
      }

      /* Collapse/Expand Toggle Button */
      .collapse-toggle {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: oklch(0.48 0.07 195 / 90%);
        border: 2px solid oklch(0.48 0.07 195 / 40%);
        box-shadow:
          0 2px 8px oklch(0.28 0.03 185 / 20%),
          0 0 0 1px oklch(1 0 0 / 10%);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--duration-fast) ease;
        z-index: 10;
        padding: 0;
        color: oklch(1 0 0);
      }

      .collapse-toggle:hover {
        background: oklch(0.48 0.07 195);
        transform: scale(1.1);
        box-shadow:
          0 4px 12px oklch(0.28 0.03 185 / 25%),
          0 0 0 2px oklch(0.48 0.07 195 / 50%);
      }

      .collapse-toggle:active {
        transform: scale(0.95);
      }

      .collapse-toggle:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195);
        outline-offset: 2px;
      }

      .collapse-toggle svg {
        width: 20px;
        height: 20px;
        stroke-width: 2.5;
        transition: transform var(--duration-fast) ease;
      }

      .collapse-toggle:hover svg {
        transform: scale(1.1);
      }

      .chat-messages-card.collapsed {
        max-height: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
        overflow: hidden;
        pointer-events: none;
        transform: translateX(20px);
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
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .chat-messages-card {
          right: 16px;
          top: 75px;
          width: calc(100vw - 32px);
          max-height: 50vh;
        }
      }
    `,
  ],
})
export class ChatMessagesCardComponent {
  @ViewChild('messagesContainer')
  messagesContainerRef!: ElementRef<HTMLDivElement>;

  /**
   * Messages to display
   */
  readonly messages = input<ChatMessage[]>([]);

  /**
   * Collapsed state
   */
  readonly isCollapsed = input(false);

  /**
   * Emit when collapse toggle is clicked
   */
  readonly collapseToggle = output<void>();

  constructor() {
    afterNextRender(() => {
      this.scrollToBottom();
    });
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

  /**
   * Toggle collapse state
   */
  toggleCollapse(): void {
    this.collapseToggle.emit();
  }
}
