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
  signal,
  HostListener,
} from '@angular/core';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
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
import { cn } from '@app/shared/utils';

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
      [cdkDragDisabled]="isResizing()"
    >
      <!-- Drag Handle -->
      <div class="drag-handle" cdkDragHandle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </div>

      <!-- Resize Handle (Top-Right only) -->
      <div class="resize-handle resize-handle-ne" (mousedown)="startResize($event)">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 3L21 9" />
          <path d="M8 3L21 16" />
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
  @ViewChild('card')
  cardRef!: ElementRef<HTMLDivElement>;

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
  readonly cdkDragBoundary = input<string | HTMLElement | ElementRef<HTMLElement> | undefined>(
    undefined,
  );

  // Resize state
  readonly isResizing = signal(false);
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startBottom = 0;

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
      this.position() === 'fixed' ? 'fixed' : '',
    ),
  );

  protected messagesContainerClasses = computed(() =>
    cn(this.messagesContainerBase, 'chat-messages'),
  );

  protected messageWrapperClasses = (role: string) =>
    cn(this.messageWrapperBase, 'message', role === 'user' ? messageUser : messageAssistant);

  protected messageBubbleClasses = (role: string) =>
    cn(
      this.messageBubbleBase,
      'message-bubble',
      role === 'user' ? messageBubbleUser : messageBubbleAssistant,
    );

  protected aiBubbleContentClasses = computed(() => this.aiBubbleContentBase);

  protected actionButtonsContainerClasses = computed(() => this.actionButtonsContainerBase);

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
   * Start resizing the card (from top-right corner, keeping bottom-left fixed)
   */
  startResize(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const card = this.cardRef.nativeElement;
    const rect = card.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(card);

    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = rect.width;
    this.startHeight = rect.height;

    // Store the bottom position to keep it fixed during resize
    const bottomValue = computedStyle.bottom;
    if (bottomValue && bottomValue !== 'auto') {
      this.startBottom = parseFloat(bottomValue);
    } else {
      // If bottom is not set, calculate it from top and height
      const topValue = computedStyle.top;
      const top = topValue && topValue !== 'auto' ? parseFloat(topValue) : 0;
      const windowHeight = window.innerHeight;
      this.startBottom = windowHeight - (top + rect.height);
    }
  }

  /**
   * Handle resize during mouse move (top-right corner, bottom-left fixed)
   */
  @HostListener('window:mousemove', ['$event'])
  onResize(event: MouseEvent): void {
    if (!this.isResizing() || !this.cardRef) return;

    const card = this.cardRef.nativeElement;
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // Minimum and maximum dimensions
    const minWidth = 280;
    const minHeight = 200;
    const maxHeight = window.innerHeight;

    // Calculate new dimensions with constraints
    const newWidth = Math.max(minWidth, this.startWidth + deltaX);
    const newHeight = Math.max(minHeight, Math.min(maxHeight, this.startHeight - deltaY));

    // Apply new size
    card.style.width = `${newWidth}px`;
    card.style.height = `${newHeight}px`;

    // Keep bottom position fixed to maintain bottom-left corner
    card.style.bottom = `${this.startBottom}px`;
    // Clear top to let bottom control the vertical position
    card.style.top = 'auto';
  }

  /**
   * Stop resizing when mouse is released
   */
  @HostListener('window:mouseup')
  stopResize(): void {
    if (this.isResizing()) {
      this.isResizing.set(false);
    }
  }
}
