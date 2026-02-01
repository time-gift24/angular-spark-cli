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
  computed,
} from '@angular/core';
import { LiquidGlassDirective } from '../../liquid-glass';
import { ChatMessage } from '../types/chat.types';
import {
  cardContainer,
  cardCollapsed,
  collapseToggle,
  collapseToggleIcon,
  messagesContainer,
  messageWrapper,
  messageUser,
  messageAssistant,
  messageBubble,
  messageBubbleUser,
  messageBubbleAssistant,
  aiBubbleContent,
  aiBubbleParagraph,
  actionButtonsContainer,
  actionButton,
  actionIcon,
} from './css';
import { cn } from '../../../utils';

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
      [class]="cardClasses()"
    >
      <!-- Collapse/Expand Button -->
      <button
        type="button"
        [class]="collapseToggleClasses()"
        [attr.aria-label]="isCollapsed() ? 'Expand chat' : 'Collapse chat'"
        [attr.aria-expanded]="!isCollapsed()"
        (click)="toggleCollapse()"
      >
        @if (isCollapsed()) {
          <!-- Expand icon (down arrow) -->
          <svg
            [class]="iconClasses()"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        } @else {
          <!-- Collapse icon (up arrow) -->
          <svg
            [class]="iconClasses()"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        }
      </button>

      <!-- Messages Container -->
      <div [class]="messagesContainerClasses()" #messagesContainer>
        @for (message of messages(); track message.id) {
          <div [class]="messageWrapperClasses(message.role)">
            <div [class]="messageBubbleClasses(message.role)">
              @if (message.role === 'assistant') {
                <div [class]="aiBubbleContentClasses()">
                  <p class="m-0">{{ message.content }}</p>
                  @if (message.actions && message.actions.length > 0) {
                    <div [class]="actionButtonsContainerClasses()">
                      @for (action of message.actions; track action.id) {
                        <button
                          type="button"
                          [class]="actionButtonClasses()"
                          (click)="action.action()"
                          [attr.aria-label]="action.label"
                        >
                          @if (action.icon) {
                            <span [class]="actionIconClasses()">{{ action.icon }}</span>
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

  // Base styles
  readonly cardContainerBase = cardContainer;
  readonly collapseToggleBase = collapseToggle;
  readonly collapseToggleIconBase = collapseToggleIcon;
  readonly messagesContainerBase = messagesContainer;
  readonly messageWrapperBase = messageWrapper;
  readonly messageBubbleBase = messageBubble;
  readonly aiBubbleContentBase = aiBubbleContent;
  readonly aiBubbleParagraphBase = aiBubbleParagraph;
  readonly actionButtonsContainerBase = actionButtonsContainer;
  readonly actionButtonBase = actionButton;
  readonly actionIconBase = actionIcon;

  // Computed classes
  protected cardClasses = computed(() =>
    cn(
      this.cardContainerBase,
      'chat-messages-card',
      this.isCollapsed() ? cardCollapsed : ''
    )
  );

  protected collapseToggleClasses = computed(() => this.collapseToggleBase);

  protected iconClasses = computed(() => this.collapseToggleIconBase);

  protected messagesContainerClasses = computed(() =>
    cn(this.messagesContainerBase, 'chat-messages')
  );

  protected messageWrapperClasses = (role: string) =>
    cn(
      this.messageWrapperBase,
      'message',
      role === 'user' ? messageUser : messageAssistant
    );

  protected messageBubbleClasses = (role: string) =>
    cn(
      this.messageBubbleBase,
      'message-bubble',
      role === 'user' ? messageBubbleUser : messageBubbleAssistant
    );

  protected aiBubbleContentClasses = computed(() => this.aiBubbleContentBase);

  protected actionButtonsContainerClasses = computed(() =>
    this.actionButtonsContainerBase
  );

  protected actionButtonClasses = computed(() => this.actionButtonBase);

  protected actionIconClasses = computed(() => this.actionIconBase);

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
