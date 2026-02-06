import {
  Component,
  input,
  output,
  ViewChild,
  ElementRef,
  computed,
  signal,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { DragDropModule, CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
import { CardState } from '@app/shared/ui/ai-chat/types/card-state.interface';
import { cn } from '@app/shared';

/**
 * Enhanced Chat Messages Card Component
 *
 * Draggable, resizable chat messages card with minimize/maximize functionality.
 * Each session persists its card state (position, size, minimized, maximized).
 *
 * Features:
 * - 8 resize handles (4 corners + 4 edges)
 * - Drag with boundary checking
 * - Minimize (collapse to title bar)
 * - Maximize (fill available space)
 * - Visual feedback during interactions
 */
@Component({
  selector: 'app-enhanced-chat-messages-card',
  standalone: true,
  imports: [LiquidGlassDirective, DragDropModule, CommonModule],
  templateUrl: './enhanced-chat-messages-card.component.html',
  styleUrl: './enhanced-chat-messages-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnhancedChatMessagesCardComponent {
  @ViewChild('card')
  cardRef!: ElementRef<HTMLDivElement>;

  @ViewChild('messagesContainer')
  messagesContainerRef!: ElementRef<HTMLDivElement>;

  // ===== Inputs =====

  readonly messages = input<ChatMessage[]>([]);

  readonly cardState = input.required<CardState>();

  readonly tabBarHeight = input<number>(60);

  // ===== Outputs =====

  readonly positionChange = output<{ x: number; y: number }>();

  readonly sizeChange = output<{ width: number; height: number }>();

  readonly stateChange = output<CardState>();

  // ===== Internal State =====

  readonly isDragging = signal(false);

  readonly isResizing = signal(false);

  readonly resizeDirection = signal<string>('');

  // Drag state
  private dragStartPos = { x: 0, y: 0 };
  private dragStartMouse = { x: 0, y: 0 };

  // Resize state
  private resizeStartSize = { width: 0, height: 0 };
  private resizeStartMouse = { x: 0, y: 0 };
  private resizeStartPos = { x: 0, y: 0 };

  // Constants
  private readonly MIN_WIDTH = 280;
  private readonly MIN_HEIGHT = 200;
  private readonly HEADER_HEIGHT = 40;

  // ===== Computed Styles =====

  protected readonly cardStyle = computed(() => {
    const state = this.cardState();
    const position = state.position;
    const size = state.size;

    return {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: state.minimized ? `${this.HEADER_HEIGHT}px` : `${size.height}px`,
      transform: this.isDragging() ? 'scale(1.02)' : 'scale(1)',
      opacity: this.isDragging() ? '0.8' : '1',
      transition: this.isDragging() || this.isResizing() ? 'none' : 'all 0.2s ease-out',
    };
  });

  protected readonly showContent = computed(() => {
    return !this.cardState().minimized;
  });

  // ===== Event Handlers =====

  protected onDragStart(event: CdkDragStart): void {
    this.isDragging.set(true);
    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.dragStartPos = { x: rect.left, y: rect.top };
  }

  protected onDragEnd(event: CdkDragEnd): void {
    this.isDragging.set(false);

    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    const newPosition = this.constrainPosition(
      { x: rect.left, y: rect.top },
      { width: rect.width, height: rect.height }
    );

    this.positionChange.emit(newPosition);
  }

  protected startResize(event: MouseEvent, direction: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.isResizing.set(true);
    this.resizeDirection.set(direction);

    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.resizeStartSize = { width: rect.width, height: rect.height };
    this.resizeStartMouse = { x: event.clientX, y: event.clientY };
    this.resizeStartPos = { x: rect.left, y: rect.top };
  }

  @HostListener('window:mousemove', ['$event'])
  onResizeMove(event: MouseEvent): void {
    if (!this.isResizing()) return;

    const deltaX = event.clientX - this.resizeStartMouse.x;
    const deltaY = event.clientY - this.resizeStartMouse.y;
    const direction = this.resizeDirection();

    let newSize = { ...this.resizeStartSize };
    let newPos = { ...this.resizeStartPos };

    // Calculate new size and position based on direction
    if (direction.includes('e')) {
      newSize.width = this.resizeStartSize.width + deltaX;
    }
    if (direction.includes('w')) {
      newSize.width = this.resizeStartSize.width - deltaX;
      newPos.x = this.resizeStartPos.x + deltaX;
    }
    if (direction.includes('s')) {
      newSize.height = this.resizeStartSize.height + deltaY;
    }
    if (direction.includes('n')) {
      newSize.height = this.resizeStartSize.height - deltaY;
      newPos.y = this.resizeStartPos.y + deltaY;
    }

    // Apply constraints
    newSize = this.constrainSize(newSize);
    newPos = this.constrainPosition(newPos, newSize);

    // Apply to element directly (for performance)
    const element = this.cardRef.nativeElement;
    element.style.width = `${newSize.width}px`;
    element.style.height = `${newSize.height}px`;
    element.style.left = `${newPos.x}px`;
    element.style.top = `${newPos.y}px`;
  }

  @HostListener('window:mouseup')
  onResizeEnd(): void {
    if (!this.isResizing()) return;

    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    const newSize = { width: rect.width, height: rect.height };
    const newPos = { x: rect.left, y: rect.top };

    this.isResizing.set(false);
    this.resizeDirection.set('');

    this.sizeChange.emit(newSize);
    this.positionChange.emit(newPos);
  }

  protected toggleMinimize(): void {
    const currentState = this.cardState();
    const newState: CardState = {
      ...currentState,
      minimized: !currentState.minimized,
      maximized: false,
    };

    this.stateChange.emit(newState);
  }

  protected toggleMaximize(): void {
    const currentState = this.cardState();

    if (currentState.maximized) {
      // Restore
      const newState: CardState = {
        ...currentState,
        maximized: false,
        position: currentState.previousState?.position || currentState.position,
        size: currentState.previousState?.size || currentState.size,
        minimized: currentState.previousState?.minimized || false,
      };
      delete newState.previousState;
      this.stateChange.emit(newState);
    } else {
      // Maximize
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tabBarH = this.tabBarHeight();

      const newState: CardState = {
        ...currentState,
        maximized: true,
        minimized: false,
        previousState: {
          position: currentState.position,
          size: currentState.size,
          minimized: currentState.minimized,
        },
        position: { x: 0, y: 0 },
        size: { width: viewportWidth, height: viewportHeight - tabBarH },
      };
      this.stateChange.emit(newState);
    }
  }

  protected resetPosition(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tabBarH = this.tabBarHeight();

    const currentState = this.cardState();
    const newState: CardState = {
      ...currentState,
      position: {
        x: viewportWidth - currentState.size.width - 24,
        y: 24,
      },
    };

    this.stateChange.emit(newState);
  }

  // ===== Private Helpers =====

  private constrainPosition(
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): { x: number; y: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tabBarH = this.tabBarHeight();

    return {
      x: Math.max(0, Math.min(position.x, viewportWidth - size.width)),
      y: Math.max(0, Math.min(position.y, viewportHeight - tabBarH - size.height)),
    };
  }

  private constrainSize(size: { width: number; height: number }): { width: number; height: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tabBarH = this.tabBarHeight();

    return {
      width: Math.max(this.MIN_WIDTH, Math.min(size.width, viewportWidth)),
      height: Math.max(this.MIN_HEIGHT, Math.min(size.height, viewportHeight - tabBarH)),
    };
  }

  scrollToBottom(): void {
    if (this.messagesContainerRef) {
      const container = this.messagesContainerRef.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
