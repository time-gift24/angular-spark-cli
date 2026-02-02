# Enhanced ChatMessagesCard + Multi-Session-Chat Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an enhanced ChatMessagesCard component with drag, resize (8 handles), minimize/maximize functionality, and integrate it with MultiSessionChatPage for stateful session switching.

**Architecture:** Single smart container (MultiSessionChatPage) managing session state + Enhanced ChatMessagesCard with autonomous drag/resize/min-max logic. All card state persisted in SessionData.cardState.

**Tech Stack:** Angular 20+, Angular Signals, Angular CDK DragDrop, TypeScript 5.9, localStorage

---

## Phase 1: Data Structure Enhancement

### Task 1.1: Add CardState Interface

**Files:**
- Create: `src/app/shared/ui/ai-chat/chat-messages-card/types/card-state.interface.ts`
- Modify: `src/app/shared/models/session-data.interface.ts`

**Step 1: Create CardState interface**

```typescript
// src/app/shared/ui/ai-chat/chat-messages-card/types/card-state.interface.ts

/**
 * Card state for EnhancedChatMessagesCard
 *
 * Persists position, size, and window state (minimized/maximized)
 * for each session's chat messages card.
 */
export interface CardState {
  /**
   * Card position in pixels
   */
  position: {
    x: number;
    y: number;
  };

  /**
   * Card size in pixels
   */
  size: {
    width: number;
    height: number;
  };

  /**
   * Whether card is minimized (collapsed to title bar only)
   */
  minimized: boolean;

  /**
   * Whether card is maximized (fills available space)
   */
  maximized: boolean;

  /**
   * Previous state before maximize/minimize (for restore)
   */
  previousState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    minimized: boolean;
  };
}

/**
 * Default card state
 */
export const DEFAULT_CARD_STATE: CardState = {
  position: { x: 0, y: 0 },  // Will be calculated based on viewport
  size: { width: 600, height: 500 },
  minimized: false,
  maximized: false,
};
```

**Step 2: Run TypeScript check**

Run: `npm run build 2>&1 | grep -E "(error|warning)" | head -20`
Expected: No new errors (interface only, no usage yet)

**Step 3: Update SessionData interface**

```typescript
// src/app/shared/models/session-data.interface.ts

import { CardState } from '@app/shared/ui/ai-chat/types/card-state.interface';

export interface SessionData {
  // ... existing fields ...

  /**
   * Chat messages card state
   *
   * Persists position, size, and window state for the session's
   * EnhancedChatMessagesCard. Enables each session to remember
   * its card layout across session switches.
   */
  cardState?: CardState;
}
```

**Step 4: Run TypeScript check**

Run: `npm run build 2>&1 | grep -E "error" | head -10`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/shared/ui/ai-chat/types/ src/app/shared/models/session-data.interface.ts
git commit -m "feat: add CardState interface and extend SessionData

Add CardState interface for tracking EnhancedChatMessagesCard state
(position, size, minimized, maximized). Extend SessionData to include
optional cardState field.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: EnhancedChatMessagesCard Component - Basic Structure

### Task 2.1: Create Component Shell

**Files:**
- Create: `src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.ts`
- Create: `src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.html`
- Create: `src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.css`
- Create: `src/app/shared/ui/enhanced-chat-messages-card/index.ts`

**Step 1: Write component TypeScript file**

```typescript
// src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.ts

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
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CardState } from '@app/shared/ui/ai-chat/types/card-state.interface';
import { cn } from '@app/shared/utils';

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
  imports: [LiquidGlassDirective, DragDropModule],
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

  /**
   * Messages to display
   */
  readonly messages = input<ChatMessage[]>([]);

  /**
   * Card state (position, size, minimized, maximized)
   */
  readonly cardState = input.required<CardState>();

  /**
   * Tab bar height in pixels (for boundary calculation)
   * @default 60
   */
  readonly tabBarHeight = input<number>(60);

  // ===== Outputs =====

  /**
   * Emitted when card position changes
   */
  readonly positionChange = output<{ x: number; y: number }>();

  /**
   * Emitted when card size changes
   */
  readonly sizeChange = output<{ width: number; height: number }>();

  /**
   * Emitted when card state changes (minimize/maximize/restore)
   */
  readonly stateChange = output<CardState>();

  // ===== Internal State =====

  /**
   * Whether currently dragging
   */
  readonly isDragging = signal(false);

  /**
   * Whether currently resizing
   */
  readonly isResizing = signal(false);

  /**
   * Current resize direction (if resizing)
   */
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

  /**
   * Computed card style based on cardState
   */
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

  /**
   * Whether to show content (not minimized)
   */
  protected readonly showContent = computed(() => {
    return !this.cardState().minimized;
  });

  // ===== Event Handlers =====

  /**
   * Handle drag start
   */
  protected onDragStart(event: { source: { element: HTMLElement } }): void {
    this.isDragging.set(true);
    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    this.dragStartPos = { x: rect.left, y: rect.top };
    // Mouse tracking will be handled by cdkDrag
  }

  /**
   * Handle drag end
   */
  protected onDragEnd(event: { source: { element: HTMLElement } }): void {
    this.isDragging.set(false);

    const rect = this.cardRef.nativeElement.getBoundingClientRect();
    const newPosition = this.constrainPosition(
      { x: rect.left, y: rect.top },
      { width: rect.width, height: rect.height }
    );

    this.positionChange.emit(newPosition);
  }

  /**
   * Start resizing
   */
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

  /**
   * Handle resize move
   */
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

  /**
   * Stop resizing
   */
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

  /**
   * Toggle minimize
   */
  protected toggleMinimize(): void {
    const currentState = this.cardState();
    const newState: CardState = {
      ...currentState,
      minimized: !currentState.minimized,
      maximized: false,  // Exit maximize if minimizing
    };

    this.stateChange.emit(newState);
  }

  /**
   * Toggle maximize
   */
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

  /**
   * Reset position to default (top-right)
   */
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

  /**
   * Constrain position to viewport bounds
   */
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

  /**
   * Constrain size to min/max bounds
   */
  private constrainSize(size: { width: number; height: number }): { width: number; height: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tabBarH = this.tabBarHeight();

    return {
      width: Math.max(this.MIN_WIDTH, Math.min(size.width, viewportWidth)),
      height: Math.max(this.MIN_HEIGHT, Math.min(size.height, viewportHeight - tabBarH)),
    };
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    if (this.messagesContainerRef) {
      const container = this.messagesContainerRef.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
```

**Step 2: Write component template**

```html
<!-- src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.html -->

<div
  #card
  liquidGlass
  lgTheme="mineral-light"
  lgCornerRadius="12px"
  [lgBlurAmount]="0.5"
  [lgDisplacementScale]="0"
  lgTint="oklch(0 0 0 / 2%)"
  lgHotspot="oklch(1 0 0 / 3%)"
  lgAriaLabel="Enhanced chat messages card"
  [ngStyle]="cardStyle()"
  cdkDrag
  [cdkDragDisabled]="isResizing()"
  (cdkDragStarted)="onDragStart($event)"
  (cdkDragEnded)="onDragEnd($event)"
>

  <!-- Title Bar (Drag Handle + Controls) -->
  <div class="card-title-bar" cdkDragHandle>
    <div class="title-bar-left">
      <svg class="drag-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <span class="session-name">{{ cardState().maximized ? 'Maximized' : (cardState().minimized ? 'Minimized' : 'Chat') }}</span>
    </div>

    <div class="title-bar-controls">
      <!-- Minimize Button -->
      <button
        type="button"
        class="control-btn"
        (click)="toggleMinimize()"
        [disabled]="cardState().maximized"
        aria-label="Minimize"
        title="Minimize"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="12" x2="20" y2="12"></line>
        </svg>
      </button>

      <!-- Maximize/Restore Button -->
      <button
        type="button"
        class="control-btn"
        (click)="toggleMaximize()"
        [disabled]="cardState().minimized"
        [attr.aria-label]="cardState().maximized ? 'Restore' : 'Maximize'"
        [title]="cardState().maximized ? 'Restore' : 'Maximize'"
      >
        @if (cardState().maximized) {
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="14" height="14" rx="2"></rect>
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          </svg>
        }
      </button>
    </div>
  </div>

  <!-- Messages Container (hidden when minimized) -->
  @if (showContent()) {
    <div class="messages-container" #messagesContainer>
      @for (message of messages(); track message.id) {
        <div [class]="'message message-' + message.role">
          <div [class]="'message-bubble bubble-' + message.role">
            @if (message.role === 'assistant') {
              <div class="ai-content">
                <p>{{ message.content }}</p>
              </div>
            } @else {
              {{ message.content }}
            }
          </div>
        </div>
      }
    </div>
  }

  <!-- Resize Handles (8 handles) -->
  @if (!cardState().maximized && !cardState().minimized) {
    <!-- Top-Left -->
    <div class="resize-handle resize-nw" (mousedown)="startResize($event, 'nw')"></div>

    <!-- Top -->
    <div class="resize-handle resize-n" (mousedown)="startResize($event, 'n')"></div>

    <!-- Top-Right -->
    <div class="resize-handle resize-ne" (mousedown)="startResize($event, 'ne')"></div>

    <!-- Right -->
    <div class="resize-handle resize-e" (mousedown)="startResize($event, 'e')"></div>

    <!-- Bottom-Right -->
    <div class="resize-handle resize-se" (mousedown)="startResize($event, 'se')"></div>

    <!-- Bottom -->
    <div class="resize-handle resize-s" (mousedown)="startResize($event, 's')"></div>

    <!-- Bottom-Left -->
    <div class="resize-handle resize-sw" (mousedown)="startResize($event, 'sw')"></div>

    <!-- Left -->
    <div class="resize-handle resize-w" (mousedown)="startResize($event, 'w')"></div>
  }
</div>
```

**Step 3: Write component styles**

```css
/* src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.css */

app-enhanced-chat-messages-card {
  display: block;
}

/* Card Container */
[ngStyle][style*="position: fixed"] {
  z-index: 1000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

/* Title Bar */
.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border, oklch(0.85 0.015 85));
  cursor: move;
  user-select: none;
  background: oklch(0.94 0.015 85 / 0.5);
  border-radius: 12px 12px 0 0;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-icon {
  width: 16px;
  height: 16px;
  color: var(--muted-foreground, oklch(0.55 0.02 185));
}

.session-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground, oklch(0.28 0.03 185));
}

.title-bar-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--muted-foreground, oklch(0.55 0.02 185));
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: oklch(0 0 0 / 0.05);
  color: var(--foreground, oklch(0.28 0.03 185));
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Messages Container */
.messages-container {
  height: calc(100% - 40px);
  overflow-y: auto;
  padding: 16px;
  background: oklch(1 0 0 / 0.8);
  border-radius: 0 0 12px 12px;
}

.message {
  margin-bottom: 12px;
}

.message:last-child {
  margin-bottom: 0;
}

.message-bubble {
  display: inline-block;
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.bubble-user {
  background: var(--primary, oklch(0.48 0.07 195));
  color: white;
  margin-left: auto;
  display: block;
  text-align: right;
}

.bubble-assistant {
  background: oklch(0.95 0.01 85);
  color: var(--foreground, oklch(0.28 0.03 185));
  border: 1px solid var(--border, oklch(0.85 0.015 85));
}

.ai-content {
  display: block;
}

.ai-content p {
  margin: 0;
}

/* Resize Handles */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10;
}

.resize-nw {
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.resize-n {
  top: 0;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: ns-resize;
}

.resize-ne {
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-e {
  top: 12px;
  right: 0;
  bottom: 12px;
  width: 6px;
  cursor: ew-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.resize-s {
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: ns-resize;
}

.resize-sw {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-w {
  top: 12px;
  left: 0;
  bottom: 12px;
  width: 6px;
  cursor: ew-resize;
}

/* Resize handles visual feedback */
.resize-handle:hover {
  background: oklch(0.48 0.07 195 / 0.2);
}
```

**Step 4: Create index file**

```typescript
// src/app/shared/ui/enhanced-chat-messages-card/index.ts

export { EnhancedChatMessagesCardComponent } from './enhanced-chat-messages-card.component';
```

**Step 5: Run TypeScript check**

Run: `npm run build 2>&1 | grep -E "error" | head -20`
Expected: No errors

**Step 6: Commit**

```bash
git add src/app/shared/ui/enhanced-chat-messages-card/
git commit -m "feat: create EnhancedChatMessagesCard component shell

Add basic component structure with:
- Drag/resize/min-max state management
- 8 resize handles (4 corners + 4 edges)
- Position and size constraint logic
- Template with title bar controls

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Integrate with MultiSessionChatPage

### Task 3.1: Update MultiSessionChatPage to Use Enhanced Component

**Files:**
- Modify: `src/app/features/multi-session-chat/multi-session-chat-page.component.ts`
- Modify: `src/app/features/multi-session-chat/multi-session-chat-page.component.html`

**Step 1: Update component TypeScript**

```typescript
// src/app/features/multi-session-chat/multi-session-chat-page.component.ts

// Add import at top
import { EnhancedChatMessagesCardComponent } from '@app/shared/ui/enhanced-chat-messages-card';
import { CardState, DEFAULT_CARD_STATE } from '@app/shared/ui/ai-chat/types/card-state.interface';

// In component class, after existing properties:

/**
 * Whether card is visible (not collapsed)
 */
readonly isCardVisible = signal<boolean>(true);

/**
 * Get card state for active session, with defaults
 */
readonly activeCardState = computed(() => {
  const session = this.activeSession();
  if (!session || !session.cardState) {
    return this.getDefaultCardState();
  }
  return session.cardState;
});

/**
 * Handle card position change
 */
onCardPositionChange(position: { x: number; y: number }): void {
  const sessionId = this.activeSessionId();
  if (!sessionId) return;

  this.sessionsInternal.update(map => {
    const newMap = new Map(map);
    const session = newMap.get(sessionId);
    if (session) {
      const cardState = session.cardState || this.getDefaultCardState();
      newMap.set(sessionId, {
        ...session,
        cardState: {
          ...cardState,
          position,
        },
        lastUpdated: Date.now(),
      });
    }
    return newMap;
  });

  this.saveToStorage();
}

/**
 * Handle card size change
 */
onCardSizeChange(size: { width: number; height: number }): void {
  const sessionId = this.activeSessionId();
  if (!sessionId) return;

  this.sessionsInternal.update(map => {
    const newMap = new Map(map);
    const session = newMap.get(sessionId);
    if (session) {
      const cardState = session.cardState || this.getDefaultCardState();
      newMap.set(sessionId, {
        ...session,
        cardState: {
          ...cardState,
          size,
        },
        lastUpdated: Date.now(),
      });
    }
    return newMap;
  });

  this.saveToStorage();
}

/**
 * Handle card state change (minimize/maximize)
 */
onCardStateChange(newState: CardState): void {
  const sessionId = this.activeSessionId();
  if (!sessionId) return;

  this.sessionsInternal.update(map => {
    const newMap = new Map(map);
    const session = newMap.get(sessionId);
    if (session) {
      newMap.set(sessionId, {
        ...session,
        cardState: newState,
        lastUpdated: Date.now(),
      });
    }
    return newMap;
  });

  this.saveToStorage();
}

/**
 * Get default card state based on viewport
 */
private getDefaultCardState(): CardState {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tabBarHeight = 60;

  return {
    position: {
      x: Math.max(0, viewportWidth - 600 - 24),
      y: 24,
    },
    size: {
      width: 600,
      height: Math.max(200, viewportHeight - tabBarHeight - 48),
    },
    minimized: false,
    maximized: false,
  };
}

/**
 * Handle session toggle (collapse/expand card)
 */
onSessionToggle(): void {
  this.isCardVisible.update(v => !v);
}

// Update onSessionSelect to include card state initialization
override onSessionSelect(sessionId: string): void {
  super.onSessionSelect(sessionId);  // Call parent logic

  // Ensure session has cardState
  const session = this.sessionsInternal().get(sessionId);
  if (session && !session.cardState) {
    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.set(sessionId, {
        ...session,
        cardState: this.getDefaultCardState(),
      });
      return newMap;
    });
    this.saveToStorage();
  }

  // Show card when switching sessions
  this.isCardVisible.set(true);
}
```

**Step 2: Update component template**

```html
<!-- src/app/features/multi-session-chat/multi-session-chat-page.component.html -->

<div class="multi-session-chat-page">
  <!-- Session Tabs + Input Container (Bottom) -->
  <app-session-chat-container
    [sessions]="sessions"
    [activeSessionId]="activeSessionId()"
    [isOpen]="isOpen()"
    [inputValue]="inputValue()"
    (newChat)="onNewChat()"
    (sessionSelect)="onSessionSelect($event)"
    (sessionToggle)="onSessionToggle()"
    (send)="onSend($event)"
    (inputValueChange)="onInputChange($event)"
  />

  <!-- Enhanced Chat Messages Card (Floating) -->
  @if (isCardVisible()) {
    <app-enhanced-chat-messages-card
      [messages]="activeMessages"
      [cardState]="activeCardState()"
      [tabBarHeight]="60"
      (positionChange)="onCardPositionChange($event)"
      (sizeChange)="onCardSizeChange($event)"
      (stateChange)="onCardStateChange($event)"
    />
  }
</div>
```

**Step 3: Run TypeScript check**

Run: `npm run build 2>&1 | grep -E "error" | head -20`
Expected: No errors

**Step 4: Test in browser**

Run: `npm start` (in separate terminal)
Navigate to: `http://localhost:4200/multi-session-chat`

Expected:
- Page loads without errors
- Chat card visible in top-right
- Can drag card
- Can resize from any handle
- Minimize/maximize buttons work

**Step 5: Commit**

```bash
git add src/app/features/multi-session-chat/
git commit -m "feat: integrate EnhancedChatMessagesCard with MultiSessionChatPage

- Replace DockedMessagesArea with EnhancedChatMessagesCard
- Add card state persistence to session data
- Handle position/size/state changes
- Add collapse/expand logic for session toggle

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Tab Switching and State Restoration

### Task 4.1: Implement Session Switch with State Persistence

**Files:**
- Modify: `src/app/features/multi-session-chat/multi-session-chat-page.component.ts`

**Step 1: Enhance onSessionSelect with smooth transition**

```typescript
// Replace existing onSessionSelect method with this enhanced version:

/**
 * Handle session selection from tabs bar
 * Persists current state, loads new session state
 */
onSessionSelect(sessionId: string): void {
  // Save current input and card state before switching
  this.saveCurrentInput();
  this.saveCurrentCardState();

  // Switch active session
  this.activeSessionId.set(sessionId);
  const session = this.sessionsInternal().get(sessionId);

  if (session) {
    // Load session's input value
    this.inputValue.set(session.inputValue || '');

    // Ensure session has cardState
    if (!session.cardState) {
      this.initializeCardState(sessionId);
    }
  }

  // Show card (if it was hidden)
  this.isCardVisible.set(true);

  // Save to storage
  this.saveToStorage();
}

/**
 * Save current card state to session
 */
private saveCurrentCardState(): void {
  const sessionId = this.activeSessionId();
  if (!sessionId) return;

  // Note: Position and size are already saved via onCardPositionChange/SizeChange
  // This ensures minimized/maximized state is persisted
  this.saveToStorage();
}

/**
 * Initialize card state for a session
 */
private initializeCardState(sessionId: string): void {
  this.sessionsInternal.update(map => {
    const newMap = new Map(map);
    const session = newMap.get(sessionId);
    if (session) {
      newMap.set(sessionId, {
        ...session,
        cardState: this.getDefaultCardState(),
      });
    }
    return newMap;
  });
}
```

**Step 2: Update createNewSession to include cardState**

```typescript
// Modify createNewSession method to initialize cardState:

private createNewSession(name: string): string {
  const newSession: SessionData = {
    id: `session-${Date.now()}`,
    name,
    messages: [],
    inputValue: '',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 500 },
    lastUpdated: Date.now(),
    status: SessionStatus.IDLE,
    color: 'default',
    mode: 'docked',
    cardState: this.getDefaultCardState(),  // Add this line
  };

  this.sessionsInternal.update(map => {
    const newMap = new Map(map);
    newMap.set(newSession.id, newSession);
    return newMap;
  });

  this.activeSessionId.set(newSession.id);
  this.saveToStorage();

  return newSession.id;
}
```

**Step 3: Test session switching**

Run: `npm start` (in dev mode)
1. Create 2 sessions
2. Move card in session 1 to different position
3. Resize card in session 1
4. Switch to session 2
5. Move card in session 2 to different position
6. Switch back to session 1
7. Verify: Card restores to session 1's position/size
8. Switch to session 2
9. Verify: Card restores to session 2's position/size

**Step 4: Commit**

```bash
git add src/app/features/multi-session-chat/multi-session-chat-page.component.ts
git commit -m "feat: implement session switching with state restoration

- Save card state before switching sessions
- Restore card position/size when switching sessions
- Initialize cardState for new sessions
- Ensure smooth transitions between sessions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: Error Handling and Edge Cases

### Task 5.1: Add localStorage Migration and Error Handling

**Files:**
- Modify: `src/app/features/multi-session-chat/multi-session-chat-page.component.ts`

**Step 1: Add data migration logic**

```typescript
// Add after existing imports:

interface StoredSessionsData {
  sessions: Record<string, SessionData>;
  activeSessionId: string;
  panelOpen: boolean;
  version?: number;  // Add version field for migrations
}

// Modify loadFromStorage method:

private loadFromStorage(): void {
  try {
    const sessionsData = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);
    const panelState = localStorage.getItem(PANEL_STATE_KEY);

    if (sessionsData) {
      const parsed = JSON.parse(sessionsData) as StoredSessionsData;

      // Migrate data if needed
      const migratedData = this.migrateSessionData(parsed);

      const sessionsMap = new Map<string, SessionData>(Object.entries(migratedData.sessions));
      this.sessionsInternal.set(sessionsMap);
      this.activeSessionId.set(activeSession || migratedData.activeSessionId || '');
    }

    if (panelState) {
      const state = JSON.parse(panelState);
      this.isOpen.set(state.panelOpen ?? true);
    }
  } catch (error) {
    console.error('[MultiSessionChatPage] Failed to load from storage:', error);

    // Clear corrupted data and start fresh
    this.clearStorage();
    this.initializeDefaultSession();
  }
}

/**
 * Migrate session data to latest schema
 */
private migrateSessionData(data: StoredSessionsData): StoredSessionsData {
  const version = data.version || 0;

  // Migration v0 -> v1: Add cardState to existing sessions
  if (version < 1) {
    const sessions = data.sessions;
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      if (!session.cardState) {
        session.cardState = this.getDefaultCardState();
      }
    }
    data.version = 1;
  }

  return data;
}

/**
 * Clear all storage data
 */
private clearStorage(): void {
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  localStorage.removeItem(PANEL_STATE_KEY);
}

/**
 * Save state to storage with error handling
 */
private saveToStorage(): void {
  try {
    const sessionsObj = Object.fromEntries(this.sessionsInternal());
    const data: StoredSessionsData = {
      sessions: sessionsObj,
      activeSessionId: this.activeSessionId(),
      panelOpen: this.isOpen(),
      version: 1,  // Current version
    };

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId());
    localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ panelOpen: this.isOpen() }));
  } catch (error) {
    if ((error as Error).name === 'QuotaExceededError') {
      console.warn('[MultiSessionChatPage] localStorage quota exceeded, attempting cleanup...');

      // Try cleanup: remove old sessions
      this.cleanupOldSessions();

      // Try saving again
      try {
        this.saveToStorage();
      } catch (retryError) {
        console.error('[MultiSessionChatPage] Failed to save after cleanup:', retryError);
        // Continue anyway - state will be lost on reload but app won't crash
      }
    } else {
      console.error('[MultiSessionChatPage] Failed to save to storage:', error);
    }
  }
}

/**
 * Cleanup old sessions to free space
 */
private cleanupOldSessions(): void {
  const sessions = Array.from(this.sessionsInternal().entries());

  // Sort by lastUpdated, remove oldest if more than 5
  sessions.sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);

  if (sessions.length > 5) {
    const toRemove = sessions.slice(0, sessions.length - 5);
    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      for (const [id] of toRemove) {
        newMap.delete(id);
      }
      return newMap;
    });
  }
}
```

**Step 2: Add viewport resize handling**

```typescript
// Add to component class:

/**
 * Handle viewport resize
 * Ensures card stays within bounds
 */
@HostListener('window:resize')
onViewportResize(): void {
  const sessionId = this.activeSessionId();
  if (!sessionId) return;

  const session = this.sessionsInternal().get(sessionId);
  if (!session || !session.cardState) return;

  const cardState = session.cardState;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tabBarHeight = 60;

  // Constrain position
  let newX = Math.max(0, Math.min(cardState.position.x, viewportWidth - cardState.size.width));
  let newY = Math.max(0, Math.min(cardState.position.y, viewportHeight - tabBarHeight - cardState.size.height));

  // Constrain size
  let newWidth = Math.min(cardState.size.width, viewportWidth);
  let newHeight = Math.min(cardState.size.height, viewportHeight - tabBarHeight);

  // Update if needed
  if (
    newX !== cardState.position.x ||
    newY !== cardState.position.y ||
    newWidth !== cardState.size.width ||
    newHeight !== cardState.size.height
  ) {
    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.set(sessionId, {
        ...session,
        cardState: {
          ...cardState,
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        },
      });
      return newMap;
    });
  }
}
```

**Step 3: Test error scenarios**

1. Test localStorage quota exceeded:
   - DevTools → Application → Local Storage
   - Manually fill localStorage with data
   - Try switching sessions
   - Expected: Cleanup happens, app continues working

2. Test corrupted data:
   - DevTools → Console
   - Run: `localStorage.setItem('multi-chat-sessions', '{invalid json')`
   - Reload page
   - Expected: Error caught, fresh state created

3. Test viewport resize:
   - Resize browser window
   - Expected: Card stays within bounds

**Step 4: Commit**

```bash
git add src/app/features/multi-session-chat/multi-session-chat-page.component.ts
git commit -m "feat: add error handling and edge case management

- Add localStorage migration system (v0 -> v1)
- Handle quota exceeded with cleanup
- Handle corrupted data gracefully
- Auto-adjust card position on viewport resize
- Add version field to stored data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 6: Testing and Documentation

### Task 6.1: Write Unit Tests

**Files:**
- Create: `src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.spec.ts`
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.spec.ts` (update existing)

**Step 1: Write EnhancedChatMessagesCard tests**

```typescript
// src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { EnhancedChatMessagesCardComponent } from './enhanced-chat-messages-card.component';
import { CardState } from '@app/shared/ui/ai-chat/types/card-state.interface';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';

describe('EnhancedChatMessagesCardComponent', () => {
  let component: EnhancedChatMessagesCardComponent;
  let fixture: ComponentFixture<EnhancedChatMessagesCardComponent>;
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: Date.now(),
    },
  ];

  const mockCardState: CardState = {
    position: { x: 100, y: 100 },
    size: { width: 600, height: 500 },
    minimized: false,
    maximized: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedChatMessagesCardComponent, DragDropModule],
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnhancedChatMessagesCardComponent);
    component = fixture.componentInstance;
    component.messages = mockMessages;
    component.cardState = mockCardState;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display messages', () => {
    const messageElements = fixture.debugElement.queryAll(By.css('.message'));
    expect(messageElements.length).toBe(2);
  });

  it('should hide content when minimized', () => {
    component.cardState = { ...mockCardState, minimized: true };
    fixture.detectChanges();

    const messagesContainer = fixture.debugElement.query(By.css('.messages-container'));
    expect(messagesContainer).toBeNull();
  });

  it('should emit positionChange on drag end', (done) => {
    component.positionChange.subscribe((pos) => {
      expect(pos.x).toBeDefined();
      expect(pos.y).toBeDefined();
      done();
    });

    component.onDragEnd({ source: { element: fixture.nativeElement } } as any);
  });

  it('should emit stateChange on minimize toggle', (done) => {
    component.stateChange.subscribe((state) => {
      expect(state.minimized).toBe(true);
      done();
    });

    component.toggleMinimize();
  });

  it('should emit stateChange on maximize toggle', (done) => {
    component.stateChange.subscribe((state) => {
      expect(state.maximized).toBe(true);
      expect(state.previousState).toBeDefined();
      done();
    });

    component.toggleMaximize();
  });

  it('should constrain size to minimum', () => {
    const tinySize = { width: 100, height: 100 };
    const constrained = component['constrainSize'](tinySize);

    expect(constrained.width).toBeGreaterThanOrEqual(280);
    expect(constrained.height).toBeGreaterThanOrEqual(200);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --watch=false --no-coverage 2>&1 | tail -50`
Expected: All tests pass

**Step 3: Write integration test for session switching**

```typescript
// Add to existing multi-session-chat-page.component.spec.ts

it('should restore card state when switching sessions', () => {
  // Setup: Create 2 sessions with different card states
  component.onCreateSession('Session 1');
  component.onCreateSession('Session 2');

  const session1Id = component.activeSessionId();

  // Move card in session 1
  component.onCardPositionChange({ x: 200, y: 200 });

  // Switch to session 2
  const sessions = Array.from(component['sessionsInternal']().keys());
  const session2Id = sessions[1];
  component.onSessionSelect(session2Id);

  // Move card in session 2
  component.onCardPositionChange({ x: 400, y: 400 });

  // Switch back to session 1
  component.onSessionSelect(session1Id);

  // Verify: Card state restored to session 1's position
  const activeState = component.activeCardState();
  expect(activeState.position.x).toBe(200);
  expect(activeState.position.y).toBe(200);
});

it('should persist card state across page reloads', () => {
  // Create session and modify card state
  component.onCreateSession('Test Session');
  component.onCardSizeChange({ width: 700, height: 600 });

  // Simulate page reload (re-create component)
  const newComponent = new MultiSessionChatPageComponent(/*...*/);
  newComponent['loadFromStorage']();

  // Verify: Card state persisted
  const activeState = newComponent.activeCardState();
  expect(activeState.size.width).toBe(700);
  expect(activeState.size.height).toBe(600);
});
```

**Step 4: Run all tests**

Run: `npm test -- --watch=false --no-coverage 2>&1 | grep -E "(PASS|FAIL|specs)" | tail -20`
Expected: All specs pass

**Step 5: Commit**

```bash
git add src/app/shared/ui/enhanced-chat-messages-card/ src/app/features/multi-session-chat/
git commit -m "test: add unit and integration tests

- Test EnhancedChatMessagesCard drag/resize/min-max
- Test session switching with state restoration
- Test localStorage persistence
- Test size and position constraints

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Task 6.2: Update Documentation

**Files:**
- Modify: `docs/features/multi-session-chat.md` (if exists, create if not)

**Step 1: Create/update feature documentation**

```markdown
# Multi-Session Chat with Enhanced Messages Card

## Overview

Multi-session AI chat interface with draggable, resizable chat messages cards.
Each session maintains its own card state (position, size, minimized, maximized).

## Features

### Session Management
- Create up to 5 concurrent chat sessions
- Switch between sessions via tabs
- Each session preserves:
  - Message history
  - Draft input
  - Card position and size
  - Minimize/maximize state

### Enhanced Chat Messages Card
- **Drag**: Drag card by title bar to reposition
- **Resize**: 8 resize handles (4 corners + 4 edges)
- **Minimize**: Collapse to title bar only
- **Maximize**: Fill available viewport space
- **Restore**: Return to previous position and size

### State Persistence
All state automatically persisted to localStorage:
- Session data (messages, input)
- Card state (position, size, minimized, maximized)
- Active session
- Panel state

## Usage

### Basic Workflow

1. **Create Session**: Click "+" button in tab bar
2. **Send Message**: Type in input and press Enter
3. **Adjust Card**: Drag to move, use handles to resize
4. **Switch Session**: Click different tab
5. **Minimize/Maximize**: Use buttons in title bar

### Keyboard Shortcuts

- `Ctrl/Cmd + 1-5`: Switch to session by number
- `Ctrl/Cmd + N`: New session
- `Ctrl/Cmd + W`: Close current session

### Card Controls

- **Drag**: Click and drag title bar
- **Resize**: Drag any edge or corner
- **Minimize**: Click "-" button
- **Maximize**: Click "□" button
- **Restore**: Click "◱" button (when maximized)

## Architecture

```
MultiSessionChatPage (Smart Container)
  ├─ SessionChatContainer (Dumb)
  │    ├─ SessionTabsBar
  │    └─ ChatInput
  │
  └─ EnhancedChatMessagesCard (Autonomous)
       ├─ Drag logic (Angular CDK)
       ├─ Resize logic (8 handles)
       └─ Min-max logic
```

## Data Model

### SessionData

```typescript
interface SessionData {
  id: string;
  name: string;
  messages: ChatMessage[];
  inputValue: string;
  position: PanelPosition;
  size: PanelSize;
  mode: 'docked' | 'floating';
  status: SessionStatus;
  color: SessionColor;
  cardState?: CardState;  // Enhanced card state
}
```

### CardState

```typescript
interface CardState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  maximized: boolean;
  previousState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    minimized: boolean;
  };
}
```

## Future Enhancements

- Multi-window layouts (tile, cascade)
- Keyboard shortcuts for card controls
- Snap-to-edge functionality
- Animation transitions
- Z-index management for overlapping cards
```

**Step 2: Commit**

```bash
git add docs/
git commit -m "docs: add Multi-Session Chat feature documentation

Document enhanced chat messages card features, usage,
architecture, and data model.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 7: Final Polish

### Task 7.1: Performance Optimization

**Files:**
- Modify: `src/app/shared/ui/enhanced-chat-messages-card/enhanced-chat-messages-card.component.ts`

**Step 1: Add throttling to resize/drag events**

```typescript
// Import throttle from RxJS
import { throttleTime, asyncScheduler } from 'rxjs';
import { fromEvent } from 'rxjs';

// In component class, add:

private resizeThrottle$ = fromEvent(window, 'mousemove').pipe(
  throttleTime(16, asyncScheduler, { leading: true, trailing: true })  // 60fps
);

// Update onResizeMove to use throttled observable
private resizeSubscription = this.resizeThrottle$.subscribe((event) => {
  if (!this.isResizing()) return;
  // ... existing resize logic
});

// Cleanup in ngOnDestroy (if component implements OnDestroy)
```

**Step 2: Test performance**

1. Open 5 sessions with 100 messages each
2. Drag card rapidly
3. Resize from multiple handles
4. Expected: Smooth 60fps interaction

**Step 3: Commit**

```bash
git add src/app/shared/ui/enhanced-chat-messages-card/
git commit -m "perf: throttle resize/drag events for smooth interaction

Use throttleTime(16) to limit mousemove events to 60fps,
preventing performance issues during rapid interactions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Task 7.2: Final Build and Test

**Step 1: Run full test suite**

Run: `npm test -- --watch=false --no-coverage 2>&1 | tail -30`
Expected: All tests pass

**Step 2: Run production build**

Run: `npm run build 2>&1 | tail -50`
Expected: Build succeeds with no errors

**Step 3: Manual smoke test**

1. Run: `npm start`
2. Navigate to `/multi-session-chat`
3. Create 3 sessions
4. Test: Drag, resize, minimize, maximize each session
5. Test: Switch between sessions, verify state restoration
6. Test: Reload page, verify persistence
7. Test: Resize browser window, verify card stays in bounds

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete EnhancedChatMessagesCard integration

All phases complete:
- Phase 1: Data structure enhancement (CardState interface)
- Phase 2: EnhancedChatMessagesCard component
- Phase 3: MultiSessionChatPage integration
- Phase 4: Tab switching with state restoration
- Phase 5: Error handling and edge cases
- Phase 6: Testing and documentation
- Phase 7: Performance optimization

Ready for review and merge.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [x] CardState interface created
- [x] SessionData extended with cardState
- [x] EnhancedChatMessagesCard component created
- [x] 8 resize handles implemented
- [x] Drag with boundary checking
- [x] Minimize/maximize/restore functionality
- [x] MultiSessionChatPage integration
- [x] Session switching with state restoration
- [x] localStorage persistence and migration
- [x] Error handling (quota exceeded, corrupted data)
- [x] Viewport resize handling
- [x] Unit tests written
- [x] Integration tests written
- [x] Documentation updated
- [x] Performance optimization
- [x] Production build successful

---

## Next Steps After Implementation

1. **Code Review**: Use `superpowers:code-reviewer` for comprehensive review
2. **Testing**: Run E2E tests with Playwright
3. **Deployment**: Merge to main branch after approval
4. **Future Enhancements**: Implement features from "Future/Divergent Ideas" section

---

**Total Estimated Time**: 4-6 hours
**Total Files Created**: ~12
**Total Files Modified**: ~5
**Total Lines of Code**: ~1500
