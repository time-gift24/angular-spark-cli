/**
 * Chat Messages Card Component
 * Fixed position message container on the right side
 * Mineral & Time Theme - Angular 20+
 */

import {
  Component,
  input,
  ViewChild,
  ElementRef,
  afterNextRender,
  computed,
  signal,
  HostListener,
  effect,
} from '@angular/core';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ResizeEdge, ResizeState, ResizeConstraints, CalculatedGeometry } from '@app/shared/ui/ai-chat/types';
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
      lgCornerRadius="var(--radius-xl)"
      [lgBlurAmount]="0.5"
      [lgDisplacementScale]="0"
      lgTint="color-mix(in oklch, var(--color-foreground) 2%, transparent)"
      lgHotspot="color-mix(in oklch, var(--color-background) 3%, transparent)"
      lgAriaLabel="Chat messages card"
      [class]="cardClasses()"
      cdkDrag
      [cdkDragBoundary]="dragBoundary()"
      [cdkDragStartDelay]="0"
      [cdkDragDisabled]="isResizing()"
    >
      <!-- Drag Handle — iOS-style pill grabber -->
      <div class="drag-handle" cdkDragHandle>
        <div class="drag-pill"></div>
      </div>

      <!-- Resize Handle (Top-Right corner) -->
      <div class="resize-handle resize-handle-ne" (mousedown)="startResize('corner-ne', $event)">
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

      <!-- Top Edge Resize Handle -->
      <div
        class="resize-handle resize-handle-top"
        (mousedown)="startResize('top', $event)"
      ></div>

      <!-- Bottom Edge Resize Handle -->
      <div
        class="resize-handle resize-handle-bottom"
        (mousedown)="startResize('bottom', $event)"
      ></div>

      <!-- Left Edge Resize Handle -->
      <div
        class="resize-handle resize-handle-left"
        (mousedown)="startResize('left', $event)"
      ></div>

      <!-- Right Edge Resize Handle -->
      <div
        class="resize-handle resize-handle-right"
        (mousedown)="startResize('right', $event)"
      ></div>

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
   * Default: '.cdk-drop-list' (fallback boundary for safety)
   * Set to empty string '' for no boundary constraint
   */
  readonly cdkDragBoundary = input<string | HTMLElement | ElementRef<HTMLElement> | undefined>(
    undefined,
  );

  /**
   * Computed drag boundary with proper fallback
   * Returns undefined when no boundary should be applied
   */
  protected readonly dragBoundary = computed(() => {
    const boundary = this.cdkDragBoundary();
    // If explicitly set to empty string, return undefined for no boundary
    if (boundary === '') return undefined as any;
    // Otherwise use the provided value or fallback to '.cdk-drop-list'
    return boundary || '.cdk-drop-list';
  });

  // Resize state
  readonly isResizing = signal(false);

  // NEW: Resize state signals (Phase 2: State Machine)
  readonly currentResizeEdge = signal<ResizeEdge | null>(null);
  private resizeState = signal<ResizeState | null>(null);

  // NEW: Constraints as static readonly (Phase 2: State Machine)
  private static readonly MIN_WIDTH = 280;
  private static readonly MIN_HEIGHT = 200;
  private static readonly VIEWPORT_PADDING = 8;

  // Legacy state variables (will be removed in Phase 6)
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
    // Reactive auto-scroll: scroll to bottom when new messages arrive
    // Only scroll if user is already near bottom (within 100px threshold)
    effect(() => {
      const messages = this.messages();
      if (messages.length === 0) return;

      // Wait for DOM to update
      setTimeout(() => {
        if (this.messagesContainerRef) {
          const container = this.messagesContainerRef.nativeElement;
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

          // Only auto-scroll if user is already near bottom
          if (isNearBottom) {
            this.scrollToBottom();
          }
        }
      }, 0);
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
   * Start resizing the card (from any edge or corner)
   * @param edge The edge being dragged
   * @param event Mouse event
   */
  startResize(edge: ResizeEdge, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const card = this.cardRef.nativeElement;
    const rect = card.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(card);

    // Calculate initial positions
    const topValue = computedStyle.top;
    const bottomValue = computedStyle.bottom;
    const leftValue = computedStyle.left;
    const rightValue = computedStyle.right;

    const top = topValue && topValue !== 'auto' ? parseFloat(topValue) : rect.top;
    const bottom = bottomValue && bottomValue !== 'auto' ? parseFloat(bottomValue) : window.innerHeight - rect.bottom;
    const left = leftValue && leftValue !== 'auto' ? parseFloat(leftValue) : rect.left;
    const right = rightValue && rightValue !== 'auto' ? parseFloat(rightValue) : window.innerWidth - rect.right;

    // Populate resizeState signal
    this.resizeState.set({
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startTop: top,
      startBottom: bottom,
      startLeft: left,
      startRight: right,
      startWidth: rect.width,
      startHeight: rect.height,
      activeEdge: edge,
    });

    this.currentResizeEdge.set(edge);
    this.isResizing.set(true);

    // Set cursor based on edge
    this.setBodyCursor(edge);
  }

  /**
   * Set body cursor based on active edge
   */
  private setBodyCursor(edge: ResizeEdge): void {
    const cursorMap: Record<ResizeEdge, string> = {
      top: 'ns-resize',
      bottom: 'ns-resize',
      left: 'ew-resize',
      right: 'ew-resize',
      'corner-ne': 'nesw-resize',
    };
    document.body.style.cursor = cursorMap[edge];
  }

  /**
   * Handle resize during mouse move
   * Routes to appropriate edge calculation based on active edge
   * (Phase 6: Event Integration)
   */
  @HostListener('window:mousemove', ['$event'])
  onResize(event: MouseEvent): void {
    const edge = this.currentResizeEdge();
    const state = this.resizeState();

    if (!edge || !state || !this.cardRef) return;

    const card = this.cardRef.nativeElement;
    const deltaX = event.clientX - state.startMouseX;
    const deltaY = event.clientY - state.startMouseY;
    const constraints = this.getConstraints();

    // Route to appropriate calculation method
    const geometry = this.calculateResizeForEdge(
      edge,
      state,
      deltaX,
      deltaY,
      constraints
    );

    // Apply calculated geometry to card
    // Clear conflicting positioning properties first
    if (geometry.left !== undefined) {
      card.style.right = 'auto';  // Clear right when setting left
      card.style.left = `${geometry.left}px`;
    } else if (geometry.right !== undefined) {
      card.style.left = 'auto';   // Clear left when setting right
      card.style.right = `${geometry.right}px`;
    }

    if (geometry.top !== undefined) {
      card.style.bottom = 'auto'; // Clear bottom when setting top
      card.style.top = `${geometry.top}px`;
    } else if (geometry.bottom !== undefined) {
      card.style.top = 'auto';    // Clear top when setting bottom
      card.style.bottom = `${geometry.bottom}px`;
    }

    if (geometry.width !== undefined) {
      card.style.width = `${geometry.width}px`;
    }
    if (geometry.height !== undefined) {
      card.style.height = `${geometry.height}px`;
    }
  }

  /**
   * Stop resizing when mouse is released
   */
  @HostListener('window:mouseup')
  stopResize(): void {
    if (!this.isResizing()) return;

    this.isResizing.set(false);
    this.currentResizeEdge.set(null);
    this.resizeState.set(null);
    document.body.style.cursor = '';
  }

  /**
   * Handle window blur to stop resize if mouse released outside window
   */
  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.isResizing()) {
      this.stopResize();
    }
  }

  /**
   * Calculate top edge resize geometry
   * (Phase 5: Edge Calculation Engine - Task 5.1)
   */
  private calculateTopResize(
    state: ResizeState,
    deltaY: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    const { startTop, startHeight } = state;
    const { minHeight, viewportPadding } = constraints;

    const newHeight = Math.max(minHeight, startHeight - deltaY);
    const newTop = Math.max(
      viewportPadding,
      startTop + (startHeight - newHeight)
    );

    return {
      top: newTop,
      height: newHeight,
    };
  }

  /**
   * Calculate bottom edge resize geometry
   * (Phase 5: Edge Calculation Engine - Task 5.2)
   */
  private calculateBottomResize(
    state: ResizeState,
    deltaY: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    const { startHeight, startTop } = state;
    const { minHeight, windowHeight, viewportPadding } = constraints;

    const newHeight = Math.max(
      minHeight,
      Math.min(windowHeight - startTop - viewportPadding, startHeight + deltaY)
    );

    return {
      height: newHeight,
    };
  }

  /**
   * Calculate left edge resize geometry
   * (Phase 5: Edge Calculation Engine - Task 5.3)
   */
  private calculateLeftResize(
    state: ResizeState,
    deltaX: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    const { startLeft, startWidth } = state;
    const { minWidth, viewportPadding } = constraints;

    const newWidth = Math.max(minWidth, startWidth - deltaX);
    const newLeft = Math.max(
      viewportPadding,
      startLeft + (startWidth - newWidth)
    );

    return {
      left: newLeft,
      width: newWidth,
    };
  }

  /**
   * Calculate right edge resize geometry
   * (Phase 5: Edge Calculation Engine - Task 5.4)
   */
  private calculateRightResize(
    state: ResizeState,
    deltaX: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    const { startWidth, startLeft } = state;
    const { minWidth, windowWidth, viewportPadding } = constraints;

    const newWidth = Math.max(
      minWidth,
      Math.min(windowWidth - startLeft - viewportPadding, startWidth + deltaX)
    );

    return {
      width: newWidth,
    };
  }

  /**
   * Calculate corner-NE (top-right) resize geometry
   * Extracted from existing onResize logic
   * (Phase 5: Edge Calculation Engine - Task 5.5)
   */
  private calculateCornerNEResize(
    state: ResizeState,
    deltaX: number,
    deltaY: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    const { startWidth, startHeight, startTop, startBottom } = state;
    const { minWidth, minHeight, windowHeight, viewportPadding } = constraints;

    const newWidth = Math.max(minWidth, startWidth + deltaX);
    const newHeight = Math.max(
      minHeight,
      Math.min(windowHeight - viewportPadding, startHeight - deltaY)
    );
    const newTop = startTop + (startHeight - newHeight);

    return {
      width: newWidth,
      height: newHeight,
      top: newTop,
      bottom: startBottom,
    };
  }

  /**
   * Edge calculation router
   * Dispatches to appropriate edge calculation method
   * (Phase 5: Edge Calculation Engine - Task 5.6)
   */
  private calculateResizeForEdge(
    edge: ResizeEdge,
    state: ResizeState,
    deltaX: number,
    deltaY: number,
    constraints: ResizeConstraints
  ): CalculatedGeometry {
    switch (edge) {
      case 'top':
        return this.calculateTopResize(state, deltaY, constraints);
      case 'bottom':
        return this.calculateBottomResize(state, deltaY, constraints);
      case 'left':
        return this.calculateLeftResize(state, deltaX, constraints);
      case 'right':
        return this.calculateRightResize(state, deltaX, constraints);
      case 'corner-ne':
        return this.calculateCornerNEResize(state, deltaX, deltaY, constraints);
      default:
        return {};
    }
  }

  /**
   * Get current resize constraints
   * Returns constraint values based on current viewport size
   * (Phase 2: State Machine)
   */
  private getConstraints(): ResizeConstraints {
    return {
      minWidth: ChatMessagesCardComponent.MIN_WIDTH,
      minHeight: ChatMessagesCardComponent.MIN_HEIGHT,
      viewportPadding: ChatMessagesCardComponent.VIEWPORT_PADDING,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  }
}
