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
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  cardContainer,
  cardFixed,
  cardRelative,
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
  imports: [LiquidGlassDirective, DragDropModule],
  styleUrls: ['./chat-messages-card.component.css'],
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
      cdkDrag
      [cdkDragBoundary]="cdkDragBoundary() || '.cdk-drop-list'"
      [cdkDragStartDelay]="0"
    >
      <!-- Drag Handle -->
      <div class="drag-handle" cdkDragHandle>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </div>

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
   * Position mode: 'fixed' or 'relative' (default: 'relative')
   * When 'fixed', the card uses fixed positioning
   * When 'relative', the parent component controls positioning
   */
  readonly position = input<'fixed' | 'relative'>('relative');

  /**
   * Drag boundary selector for constraining drag area
   * Default: undefined (no boundary constraint)
   */
  readonly cdkDragBoundary = input<string | HTMLElement | ElementRef<HTMLElement> | undefined>(undefined);

  // Base styles
  readonly cardContainerBase = cardContainer;
  readonly cardFixedStyles = cardFixed;
  readonly cardRelativeStyles = cardRelative;
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
      this.position() === 'fixed' ? this.cardFixedStyles : this.cardRelativeStyles,
      this.position() === 'fixed' ? 'fixed' : ''
    )
  );

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
}
