# AI Chat Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a global AI chat panel that slides in from the right, compressing the main content area, with liquid-glass styling and streaming-markdown integration.

**Architecture:**
- App-level layout wrapper (`AiChatShellComponent`) that manages main content compression
- Global state service (`AiChatStateService`) for panel open/close, width, and active session
- Panel components using existing `SessionChatContainerComponent`, `StreamingMarkdownComponent`, and `LiquidGlassDirective`
- Drag-to-resize handle on left edge with visual preview indicator

**Tech Stack:** Angular 20+, Signals, Tailwind CSS v4, Liquid Glass Directive, Streaming Markdown Component

---

## Task 1: Create AiChatStateService

**Files:**
- Create: `src/app/shared/ui/ai-chat/services/ai-chat-state.service.ts`
- Create: `src/app/shared/ui/ai-chat/services/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/services/ai-chat-state.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AiChatStateService } from './ai-chat-state.service';

describe('AiChatStateService', () => {
  let service: AiChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiChatStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with panel closed', () => {
    expect(service.panelOpen()).toBe(false);
  });

  it('should initialize with default panel width', () => {
    expect(service.panelWidth()).toBe(500);
  });

  it('should toggle panel open state', () => {
    service.togglePanel();
    expect(service.panelOpen()).toBe(true);
    service.togglePanel();
    expect(service.panelOpen()).toBe(false);
  });

  it('should clamp panel width between min and max', () => {
    service.setPanelWidth(200);
    expect(service.panelWidth()).toBe(300); // min
    service.setPanelWidth(1000);
    expect(service.panelWidth()).toBe(800); // max
  });

  it('should track user scroll state', () => {
    expect(service.userScrolled()).toBe(false);
    service.setUserScrolled(true);
    expect(service.userScrolled()).toBe(true);
  });

  it('should track new messages indicator', () => {
    expect(service.hasNewMessages()).toBe(false);
    service.setHasNewMessages(true);
    expect(service.hasNewMessages()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ai-chat-state.service.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './ai-chat-state.service'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/services/ai-chat-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SessionData } from '@app/shared/models';

const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 800;
const PANEL_DEFAULT_WIDTH = 500;
const STORAGE_KEY = 'ai-chat-panel-width';

interface AiChatState {
  panelOpen: boolean;
  panelWidth: number;
  activeSessionId: string | null;
  sessions: Map<string, SessionData>;
  userScrolled: boolean;
  hasNewMessages: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiChatStateService {
  private readonly state = signal<AiChatState>({
    panelOpen: false,
    panelWidth: this.loadStoredWidth(),
    activeSessionId: null,
    sessions: new Map(),
    userScrolled: false,
    hasNewMessages: false,
  });

  /** Computed signals for read-only access */
  readonly panelOpen = computed(() => this.state().panelOpen);
  readonly panelWidth = computed(() => this.state().panelWidth);
  readonly activeSessionId = computed(() => this.state().activeSessionId);
  readonly sessions = computed(() => this.state().sessions);
  readonly userScrolled = computed(() => this.state().userScrolled);
  readonly hasNewMessages = computed(() => this.state().hasNewMessages);

  /** Computed CSS value for main content compression */
  readonly mainContentStyle = computed(() => {
    const width = this.panelOpen() ? this.state().panelWidth : 0;
    return {
      'flex-basis': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
      'max-width': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
    };
  });

  /** Computed CSS value for panel width */
  readonly panelStyle = computed(() => ({
    width: `${this.state().panelWidth}px`,
    transform: this.panelOpen() ? 'translateX(0)' : 'translateX(100%)',
  }));

  togglePanel(): void {
    this.state.update((s) => ({ ...s, panelOpen: !s.panelOpen }));
  }

  openPanel(): void {
    this.state.update((s) => ({ ...s, panelOpen: true }));
  }

  closePanel(): void {
    this.state.update((s) => ({ ...s, panelOpen: false }));
  }

  setPanelWidth(width: number): void {
    const clamped = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, width));
    this.state.update((s) => ({ ...s, panelWidth: clamped }));
    this.saveWidth(clamped);
  }

  setActiveSession(sessionId: string | null): void {
    this.state.update((s) => ({ ...s, activeSessionId: sessionId }));
  }

  setSessions(sessions: Map<string, SessionData>): void {
    this.state.update((s) => ({ ...s, sessions }));
  }

  setUserScrolled(scrolled: boolean): void {
    this.state.update((s) => ({ ...s, userScrolled: scrolled }));
  }

  setHasNewMessages(hasNew: boolean): void {
    this.state.update((s) => ({ ...s, hasNewMessages: hasNew }));
  }

  private loadStoredWidth(): number {
    if (typeof localStorage === 'undefined') return PANEL_DEFAULT_WIDTH;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : PANEL_DEFAULT_WIDTH;
    } catch {
      return PANEL_DEFAULT_WIDTH;
    }
  }

  private saveWidth(width: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, width.toString());
    } catch {
      // Ignore storage errors
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ai-chat-state.service.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/services/index.ts
export { AiChatStateService } from './ai-chat-state.service';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/services/
git commit -m "feat(ai-chat): add AiChatStateService for global panel state management"
```

---

## Task 2: Create MessageBubbleComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/message-bubble/message-bubble.component.ts`
- Create: `src/app/shared/ui/ai-chat/message-bubble/message-bubble.component.html`
- Create: `src/app/shared/ui/ai-chat/message-bubble/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/message-bubble/message-bubble.component.spec.ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from './message-bubble.component';
import { ChatMessage, MessageRole } from '@app/shared/models';

describe('MessageBubbleComponent', () => {
  it('should create user message with solid background', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
    }).createComponent(MessageBubbleComponent);

    const userMessage: ChatMessage = {
      id: '1',
      role: MessageRole.USER,
      content: 'Hello',
      timestamp: Date.now(),
    };

    fixture.componentRef.setInput('message', userMessage);
    fixture.detectChanges();

    expect(fixture.componentInstance.isUser()).toBe(true);
  });

  it('should create AI message with glass effect', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
    }).createComponent(MessageBubbleComponent);

    const aiMessage: ChatMessage = {
      id: '2',
      role: MessageRole.ASSISTANT,
      content: 'Hi there!',
      timestamp: Date.now(),
    };

    fixture.componentRef.setInput('message', aiMessage);
    fixture.detectChanges();

    expect(fixture.componentInstance.isAI()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- message-bubble.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './message-bubble.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/message-bubble/message-bubble.component.ts
import { Component, Input, computed } from '@angular/core';
import { ChatMessage, MessageRole } from '@app/shared/models';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';

@Component({
  selector: 'ai-message-bubble',
  standalone: true,
  imports: [LiquidGlassDirective],
  templateUrl: './message-bubble.component.html',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: ChatMessage;

  readonly isUser = computed(() => this.message.role === MessageRole.USER);
  readonly isAI = computed(() => this.message.role === MessageRole.ASSISTANT);

  protected readonly MessageRole = MessageRole;
}
```

```html
<!-- src/app/shared/ui/ai-chat/message-bubble/message-bubble.component.html -->
@switch (message.role) {
  @case (MessageRole.USER) {
    <div class="flex justify-end">
      <div class="max-w-[80%] px-4 py-2 rounded-lg bg-primary text-primary-foreground rounded-tr-sm">
        <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
      </div>
    </div>
  }

  @case (MessageRole.ASSISTANT) {
    <div class="flex justify-start">
      <div
        liquidGlass
        lgTheme="mineral-dark"
        lgBlurAmount="0.08"
        lgSaturation="100"
        lgDisableAnimation="true"
        class="max-w-[80%] px-4 py-2 rounded-lg rounded-tl-sm bg-card/80 backdrop-blur-sm">
        <p class="text-sm text-card-foreground whitespace-pre-wrap">{{ message.content }}</p>
      </div>
    </div>
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- message-bubble.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/message-bubble/index.ts
export { MessageBubbleComponent } from './message-bubble.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/message-bubble/
git commit -m "feat(ai-chat): add MessageBubbleComponent with user solid/AI glass styling"
```

---

## Task 3: Create MessageListComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/message-list/message-list.component.ts`
- Create: `src/app/shared/ui/ai-chat/message-list/message-list.component.html`
- Create: `src/app/shared/ui/ai-chat/message-list/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/message-list/message-list.component.spec.ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageListComponent } from './message-list.component';
import { ChatMessage, MessageRole } from '@app/shared/models';

describe('MessageListComponent', () => {
  it('should display empty state when no messages', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).createComponent(MessageListComponent);

    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display messages when provided', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).createComponent(MessageListComponent);

    const messages: ChatMessage[] = [
      {
        id: '1',
        role: MessageRole.USER,
        content: 'Hello',
        timestamp: Date.now(),
      },
    ];

    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();

    const bubbles = fixture.nativeElement.querySelectorAll('ai-message-bubble');
    expect(bubbles.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- message-list.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './message-list.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/message-list/message-list.component.ts
import { Component, Input, ViewChild, ElementRef, AfterViewChecked, output } from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { MessageBubbleComponent } from '../message-bubble';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './message-list.component.html',
})
export class MessageListComponent implements AfterViewChecked {
  @Input({ required: true }) messages!: ChatMessage[];
  @Input() streamingContent = '';
  @Input() maxHeight = 'calc(100vh - 200px)';

  @Output() scrollChange = new EventEmitter<boolean>();

  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef<HTMLDivElement>;

  private isNearBottom = true;
  private readonly BOTTOM_THRESHOLD = 100;

  ngAfterViewChecked(): void {
    if (!this.scrollContainer?.nativeElement) return;

    const el = this.scrollContainer.nativeElement;
    const wasNearBottom = this.isNearBottom;

    // Check if near bottom
    this.isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < this.BOTTOM_THRESHOLD;

    // Emit if state changed
    if (wasNearBottom !== this.isNearBottom) {
      this.scrollChange.emit(!this.isNearBottom);
    }

    // Auto-scroll if near bottom
    if (this.isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/message-list/message-list.component.html -->
<div
  #scrollContainer
  class="overflow-y-auto"
  [style.max-height]="maxHeight">
  @if (messages.length === 0 && !streamingContent) {
    <div class="empty-state flex items-center justify-center h-full text-muted-foreground">
      <p class="text-sm">开始一个新的对话...</p>
    </div>
  } @else {
    <div class="space-y-4 p-4">
      @for (message of messages; track message.id) {
        <ai-message-bubble [message]="message" />
      }

      @if (streamingContent) {
        <div class="flex justify-start">
          <div
            liquidGlass
            lgTheme="mineral-dark"
            lgBlurAmount="0.08"
            lgDisableAnimation="true"
            class="max-w-[80%] px-4 py-2 rounded-lg rounded-tl-sm bg-card/80 backdrop-blur-sm">
            <p class="text-sm text-card-foreground whitespace-pre-wrap">{{ streamingContent }}</p>
            <span class="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1"></span>
          </div>
        </div>
      }
    </div>
  }
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- message-list.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/message-list/index.ts
export { MessageListComponent } from './message-list.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/message-list/
git commit -m "feat(ai-chat): add MessageListComponent with smart scroll behavior"
```

---

## Task 4: Create PanelHeaderComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/panel-header/panel-header.component.ts`
- Create: `src/app/shared/ui/ai-chat/panel-header/panel-header.component.html`
- Create: `src/app/shared/ui/ai-chat/panel-header/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/panel-header/panel-header.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { PanelHeaderComponent } from './panel-header.component';
import { signal } from '@angular/core';

describe('PanelHeaderComponent', () => {
  it('should display session name', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [PanelHeaderComponent],
    }).createComponent(PanelHeaderComponent);

    fixture.componentRef.setInput('sessionName', signal('Test Session'));
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.session-name');
    expect(nameEl?.textContent).toContain('Test Session');
  });

  it('should emit rename event when editing completes', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [PanelHeaderComponent],
    }).createComponent(PanelHeaderComponent);

    let emittedName = '';
    fixture.componentRef.rename.subscribe((name) => (emittedName = name));

    fixture.componentRef.setInput('sessionName', signal('Old Name'));
    fixture.detectChanges();

    fixture.componentInstance.onNameEditComplete('New Name');
    expect(emittedName).toBe('New Name');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- panel-header.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './panel-header.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/panel-header/panel-header.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';

@Component({
  selector: 'ai-panel-header',
  standalone: true,
  imports: [CommonModule, LiquidGlassDirective],
  templateUrl: './panel-header.component.html',
})
export class PanelHeaderComponent {
  @Input({ required: true }) sessionName!: Signal<string>;
  @Input() hasNewMessages = false;
  @Input() isEditing = false;

  @Output() rename = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly isEditingName = signal(false);
  readonly editValue = signal('');

  protected readonly isNewMessageIndicatorVisible = computed(() => this.hasNewMessages);

  startEditing(): void {
    this.isEditingName.set(true);
    this.editValue.set(this.sessionName());
  }

  cancelEdit(): void {
    this.isEditingName.set(false);
    this.editValue.set('');
  }

  onNameEditComplete(newName: string): void {
    if (newName.trim() && newName.trim() !== this.sessionName()) {
      this.rename.emit(newName.trim());
    }
    this.isEditingName.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onNameEditComplete(this.editValue());
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/panel-header/panel-header.component.html -->
<div
  liquidGlass
  lgTheme="mineral-dark"
  lgBlurAmount="0.12"
  class="flex items-center justify-between px-4 py-3 border-b border-border/50">
  <div class="flex items-center gap-2 flex-1 min-w-0">
    @if (isEditingName()) {
      <input
        type="text"
        [value]="editValue()"
        (input)="editValue.set($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (blur)="onNameEditComplete(editValue())"
        class="flex-1 px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
        autofocus
      />
    } @else {
      <div class="flex items-center gap-2">
        @if (isNewMessageIndicatorVisible()) {
          <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
        }
        <button
          (click)="startEditing()"
          class="session-name text-sm font-medium text-foreground hover:text-accent transition-colors cursor-pointer truncate">
          {{ sessionName() }}
        </button>
      </div>
    }
  </div>

  <div class="flex items-center gap-1">
    @if (!isEditingName()) {
      <button
        (click)="delete.emit()"
        class="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="删除会话">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button
        (click)="close.emit()"
        class="p-1.5 rounded hover:bg-muted transition-colors"
        title="关闭面板">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    }
  </div>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- panel-header.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/panel-header/index.ts
export { PanelHeaderComponent } from './panel-header.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/panel-header/
git commit -m "feat(ai-chat): add PanelHeaderComponent with inline rename and new message indicator"
```

---

## Task 5: Create ResizeHandleComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/resize-handle/resize-handle.component.ts`
- Create: `src/app/shared/ui/ai-chat/resize-handle/resize-handle.component.html`
- Create: `src/app/shared/ui/ai-chat/resize-handle/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/resize-handle/resize-handle.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ResizeHandleComponent } from './resize-handle.component';

describe('ResizeHandleComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).createComponent(ResizeHandleComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit resize events during drag', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).createComponent(ResizeHandleComponent);

    let emittedWidth = 0;
    fixture.componentRef.resizePreview.subscribe((width) => (emittedWidth = width));

    fixture.componentInstance.startDrag(new MouseEvent('mousedown', { clientX: 1000 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 900 }));

    expect(emittedWidth).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- resize-handle.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './resize-handle.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/resize-handle/resize-handle.component.ts
import {
  Component,
  Output,
  EventEmitter,
  ElementRef,
  inject,
  HostListener,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-resize-handle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resize-handle.component.html',
})
export class ResizeHandleComponent {
  @Output() resizePreview = new EventEmitter<number>();
  @Output() resizeCommit = new EventEmitter<number>();

  private el = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  isDragging = false;
  startX = 0;
  startWidth = 0;

  constructor() {
    afterNextRender(() => {
      this.setupDragListeners();
    });
  }

  private setupDragListeners(): void {
    // Global mouse move and up listeners
    const onMove = (event: MouseEvent) => this.onMouseMove(event);
    const onUp = (event: MouseEvent) => this.onMouseUp(event);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    });

    this.windowMouseMove = onMove;
    this.windowMouseUp = onUp;
  }

  private windowMouseMove!: (event: MouseEvent) => void;
  private windowMouseUp!: (event: MouseEvent) => void;

  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startWidth = this.getWidth();

    window.addEventListener('mousemove', this.windowMouseMove);
    window.addEventListener('mouseup', this.windowMouseUp);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.startX - event.clientX;
    const newWidth = this.startWidth + deltaX;

    // Clamp between min/max (preview only, can show outside range temporarily)
    this.resizePreview.emit(newWidth);
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.startX - event.clientX;
    const newWidth = this.startWidth + deltaX;

    this.isDragging = false;
    window.removeEventListener('mousemove', this.windowMouseMove);
    window.removeEventListener('mouseup', this.windowMouseUp);

    this.resizeCommit.emit(newWidth);
  }

  private getWidth(): number {
    return this.el.nativeElement.parentElement?.offsetWidth || 500;
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent): void {
    this.startDrag(event);
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/resize-handle/resize-handle.component.html -->
<div
  class="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:w-2 transition-all group/resize">
  <!-- Visual indicator -->
  <div
    class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-8 bg-border/50 rounded-full
           group-hover/resize:bg-accent/50 group-hover/resize:h-12 transition-all"></div>

  <!-- Preview indicator (shown during drag) -->
  @if (isDragging) {
    <div
      class="absolute left-0 top-0 bottom-0 w-px bg-accent"
      [style.left.px]="-100">
      <div
        class="absolute top-1/2 left-2 -translate-y-1/2 px-2 py-1 text-xs bg-accent text-accent-foreground rounded">
        {{ resizePreview | async }}px
      </div>
    </div>
  }
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- resize-handle.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/resize-handle/index.ts
export { ResizeHandleComponent } from './resize-handle.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/resize-handle/
git commit -m "feat(ai-chat): add ResizeHandleComponent with drag preview indicator"
```

---

## Task 6: Create AiChatPanelComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.ts`
- Create: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html`
- Create: `src/app/shared/ui/ai-chat/ai-chat-panel/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { AiChatPanelComponent } from './ai-chat-panel.component';
import { AiChatStateService } from '../services';
import { signal } from '@angular/core';
import { SessionData } from '@app/shared/models';

describe('AiChatPanelComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display active session name', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    const sessionData: SessionData = {
      id: 'test-1',
      name: 'Test Session',
      messages: [],
      inputValue: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      mode: 'docked',
      lastUpdated: Date.now(),
    };

    fixture.componentRef.setInput('activeSession', signal(sessionData));
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.session-name');
    expect(nameEl?.textContent).toContain('Test Session');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ai-chat-panel.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './ai-chat-panel.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.ts
import { Component, Input, Signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData } from '@app/shared/models';
import { AiChatStateService } from '../services';
import { PanelHeaderComponent } from '../panel-header';
import { MessageListComponent } from '../message-list';
import { ResizeHandleComponent } from '../resize-handle';

@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [CommonModule, PanelHeaderComponent, MessageListComponent, ResizeHandleComponent],
  templateUrl: './ai-chat-panel.component.html',
})
export class AiChatPanelComponent {
  @Input({ required: true }) activeSession!: Signal<SessionData | null>;
  @Input() streamingContent = '';
  @Input() previewWidth: number | null = null;

  @Output() rename = new EventEmitter<{ sessionId: string; name: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() resizeCommit = new EventEmitter<number>();

  protected readonly sessionName = computed(() => this.activeSession()?.name ?? '');
  protected readonly messages = computed(() => this.activeSession()?.messages ?? []);
  protected readonly sessionId = computed(() => this.activeSession()?.id ?? '');

  onRename(newName: string): void {
    const id = this.sessionId();
    if (id) {
      this.rename.emit({ sessionId: id, name: newName });
    }
  }

  onDelete(): void {
    const id = this.sessionId();
    if (id) {
      this.delete.emit(id);
    }
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html -->
<aside
  class="fixed right-0 top-0 h-full bg-card/95 backdrop-blur-sm border-l border-border/50 shadow-xl overflow-hidden"
  [style.width.px]="previewWidth || 500"
  [style.opacity]="previewWidth !== null ? '0.8' : '1'"
  [style.transform]="previewWidth !== null ? 'scale(0.98)' : 'scale(1)'"
  style="transform-origin: right center; transition: width 0.3s var(--ease-spring-smooth);">
  <!-- Resize Handle -->
  <ai-resize-handle
    (resizePreview)="$event"
    (resizeCommit)="resizeCommit.emit($event)" />

  <!-- Panel Header -->
  <ai-panel-header
    [sessionName]="sessionName"
    [hasNewMessages]="false"
    (rename)="onRename($event)"
    (delete)="onDelete()"
    (close)="close.emit()" />

  <!-- Message List -->
  <ai-message-list
    [messages]="messages()"
    [streamingContent]="streamingContent"
    maxHeight="calc(100vh - 120px)" />
</aside>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ai-chat-panel.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-panel/index.ts
export { AiChatPanelComponent } from './ai-chat-panel.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/ai-chat-panel/
git commit -m "feat(ai-chat): add AiChatPanelComponent with header and message list"
```

---

## Task 7: Create AiChatShellComponent

**Files:**
- Create: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts`
- Create: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html`
- Create: `src/app/shared/ui/ai-chat/ai-chat-shell/index.ts`

**Step 1: Write the failing test**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { AiChatShellComponent } from './ai-chat-shell.component';
import { AiChatStateService } from '../services';

describe('AiChatShellComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatShellComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compress main content when panel is open', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatShellComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatShellComponent);

    const stateService = TestBed.inject(AiChatStateService);
    fixture.detectChanges();

    // Panel open should compress main content
    stateService.openPanel();
    fixture.detectChanges();

    const mainContent = fixture.nativeElement.querySelector('.main-content');
    expect(mainContent).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ai-chat-shell.component.spec.ts --watch=false`
Expected: FAIL with "Cannot find module './ai-chat-shell.component'"

**Step 3: Write minimal implementation**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts
import { Component, computed, inject, ContentChild, TemplateRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatStateService } from '../services';
import { AiChatPanelComponent } from '../ai-chat-panel';
import { SessionChatContainerComponent } from '../session-chat-container';

@Component({
  selector: 'ai-chat-shell',
  standalone: true,
  imports: [RouterOutlet, AiChatPanelComponent, SessionChatContainerComponent],
  templateUrl: './ai-chat-shell.component.html',
})
export class AiChatShellComponent {
  private state = inject(AiChatStateService);

  readonly panelOpen = this.state.panelOpen;
  readonly panelWidth = this.state.panelWidth;
  readonly activeSessionId = this.state.activeStateId;
  readonly sessions = this.state.sessions;

  readonly mainContentStyle = this.state.mainContentStyle;
  readonly panelStyle = this.state.panelStyle;

  readonly activeSession = computed(() => {
    const id = this.activeSessionId();
    const sessions = this.sessions();
    return id ? sessions.get(id) ?? null : null;
  });
}
```

```html
<!-- src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html -->
<div class="app-shell flex min-h-screen bg-background">
  <!-- Main Content Area (compressible) -->
  <main
    class="main-content flex-1 transition-all duration-300 ease-out"
    [style.flex-basis]="mainContentStyle()['flex-basis']"
    [style.max-width]="mainContentStyle()['max-width']">
    <router-outlet />
  </main>

  <!-- AI Chat Panel -->
  @if (panelOpen()) {
    <ai-chat-panel
      [activeSession]="activeSession()"
      (rename)="onRename($event)"
      (delete)="onDelete($event)"
      (close)="state.closePanel()"
      (resizeCommit)="onResizeCommit($event)" />
  }
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ai-chat-shell.component.spec.ts --watch=false`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-shell/index.ts
export { AiChatShellComponent } from './ai-chat-shell.component';
```

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "feat(ai-chat): add AiChatShellComponent with compressible main content area"
```

---

## Task 8: Update ai-chat barrel exports

**Files:**
- Modify: `src/app/shared/ui/ai-chat/index.ts`

**Step 1: Update exports**

```typescript
// src/app/shared/ui/ai-chat/index.ts
/**
 * AI Chat Components - Public API
 * Mineral & Time Theme - Angular 20+
 */

// Sub-components (existing)
export { StatusBadgesComponent } from './status-badges/status-badges.component';
export type { StatusBadge } from './status-badges/status-badges.component';
export { ChatInputComponent } from './chat-input/chat-input.component';
export { SessionToggleComponent } from './session-toggle-button/session-toggle-button.component';
export { SessionTabsBarComponent } from './session-tabs-bar/session-tabs-bar.component';
export { SessionChatContainerComponent } from './session-chat-container/session-chat-container.component';

// New components
export { AiChatShellComponent } from './ai-chat-shell';
export { AiChatPanelComponent } from './ai-chat-panel';
export { PanelHeaderComponent } from './panel-header';
export { MessageListComponent } from './message-list';
export { MessageBubbleComponent } from './message-bubble';
export { ResizeHandleComponent } from './resize-handle';

// Services
export { AiChatStateService } from './services';

// Types (existing)
export type {
  ChatMessage,
  MessageRole,
  MessageAction,
  BadgeType,
} from './types/chat.types';

// Re-export StatusBadgeType as alias (existing)
import type { StatusBadge } from './status-badges/status-badges.component';
export type { StatusBadge as StatusBadgeType };
```

**Step 2: Commit**

```bash
git add src/app/shared/ui/ai-chat/index.ts
git commit -m "feat(ai-chat): update barrel exports with new components and service"
```

---

## Task 9: Integrate AiChatShell into App

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

**Step 1: Update App component**

```typescript
// src/app/app.ts
import { Component } from '@angular/core';
import { AiChatShellComponent } from './shared/ui/ai-chat';

@Component({
  selector: 'app-root',
  imports: [AiChatShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

```html
<!-- src/app/app.html -->
<ai-chat-shell />
```

**Step 2: Run application to verify**

Run: `npm run dev`
Expected: App loads with AiChatShell wrapping router outlet

**Step 3: Commit**

```bash
git add src/app/app.ts src/app/app.html
git commit -m "feat(app): integrate AiChatShell as root layout wrapper"
```

---

## Task 10: Add SessionStateService integration

**Files:**
- Create: `src/app/shared/ui/ai-chat/services/session-state.service.ts`

**Step 1: Write the service**

```typescript
// src/app/shared/ui/ai-chat/services/session-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SessionData, SessionStatus, SessionColor } from '@app/shared/models';
import { v4 as uuidv4 } from 'uuid';

const MAX_SESSIONS = 5;
const STORAGE_KEY = 'ai-chat-sessions';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private readonly sessions = signal<Map<string, SessionData>>(new Map());
  private readonly activeSessionId = signal<string | null>(null);

  readonly sessionsSignal = this.sessions.asReadonly();
  readonly activeSessionIdSignal = this.activeSessionId.asReadonly();

  readonly activeSession = computed(() => {
    const id = this.activeSessionId();
    return id ? this.sessions().get(id) ?? null : null;
  });

  constructor() {
    this.loadFromStorage();
  }

  createSession(name?: string): string {
    const id = uuidv4();
    const session: SessionData = {
      id,
      name: name || `会话 ${this.sessions().size + 1}`,
      messages: [],
      inputValue: '',
      position: { x: 100, y: 50 },
      size: { width: 400, height: 600 },
      mode: 'docked',
      lastUpdated: Date.now(),
      status: SessionStatus.IDLE,
      color: this.getNextColor(),
    };

    // Enforce max sessions
    this.enforceMaxSessions();

    this.sessions.update((map) => new Map(map).set(id, session));
    this.activeSessionId.set(id);
    this.saveToStorage();

    return id;
  }

  switchSession(sessionId: string): void {
    if (this.sessions().has(sessionId)) {
      this.activeSessionId.set(sessionId);
      const session = this.sessions().get(sessionId);
      if (session) {
        this.updateSessionLastUpdated(sessionId);
      }
    }
  }

  closeSession(sessionId: string): void {
    const map = this.sessions();
    if (!map.has(sessionId)) return;

    const newMap = new Map(map);
    newMap.delete(sessionId);

    // If closing active session, switch to another
    if (this.activeSessionId() === sessionId) {
      const remaining = Array.from(newMap.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
      this.activeSessionId.set(remaining[0]?.id ?? null);
    }

    this.sessions.set(newMap);
    this.saveToStorage();
  }

  updateSessionInput(sessionId: string, value: string): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessions.update((map) => {
        const newMap = new Map(map);
        newMap.set(sessionId, { ...session, inputValue: value, lastUpdated: Date.now() });
        return newMap;
      });
      this.saveToStorage();
    }
  }

  addMessage(sessionId: string, message: { role: 'user' | 'assistant'; content: string }): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      const newMessage = {
        id: uuidv4(),
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: Date.now(),
      };

      this.sessions.update((map) => {
        const newMap = new Map(map);
        newMap.set(sessionId, {
          ...session,
          messages: [...session.messages, newMessage],
          lastUpdated: Date.now(),
        });
        return newMap;
      });
      this.saveToStorage();
    }
  }

  renameSession(sessionId: string, newName: string): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessions.update((map) => {
        const newMap = new Map(map);
        newMap.set(sessionId, { ...session, name: newName, lastUpdated: Date.now() });
        return newMap;
      });
      this.saveToStorage();
    }
  }

  setSessionStatus(sessionId: string, status: SessionStatus): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessions.update((map) => {
        const newMap = new Map(map);
        newMap.set(sessionId, { ...session, status, lastUpdated: Date.now() });
        return newMap;
      });
    }
  }

  private updateSessionLastUpdated(sessionId: string): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessions.update((map) => {
        const newMap = new Map(map);
        newMap.set(sessionId, { ...session, lastUpdated: Date.now() });
        return newMap;
      });
    }
  }

  private enforceMaxSessions(): void {
    const sessions = Array.from(this.sessions().values()).sort((a, b) => a.lastUpdated - b.lastUpdated);
    while (sessions.length >= MAX_SESSIONS) {
      const oldest = sessions.shift();
      if (oldest) {
        this.sessions.update((map) => {
          const newMap = new Map(map);
          newMap.delete(oldest.id);
          return newMap;
        });
      }
    }
  }

  private getNextColor(): SessionColor {
    const colors: SessionColor[] = ['default', 'blue', 'purple', 'pink', 'orange', 'yellow'];
    const usedColors = new Set(
      Array.from(this.sessions().values()).map((s) => s.color ?? 'default')
    );
    return colors.find((c) => !usedColors.has(c)) ?? 'default';
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = Array.from(this.sessions().values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: SessionData[] = JSON.parse(stored);
        const map = new Map<string, SessionData>();
        for (const session of data) {
          map.set(session.id, session);
        }
        this.sessions.set(map);

        // Set active session to most recent
        const sorted = Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
        if (sorted.length > 0) {
          this.activeSessionId.set(sorted[0].id);
        }
      }
    } catch {
      // Start fresh if storage is corrupt
    }
  }
}
```

**Step 2: Update services barrel export**

```typescript
// src/app/shared/ui/ai-chat/services/index.ts
export { AiChatStateService } from './ai-chat-state.service';
export { SessionStateService } from './session-state.service';
```

**Step 3: Commit**

```bash
git add src/app/shared/ui/ai-chat/services/
git commit -m "feat(ai-chat): add SessionStateService for session management with localStorage persistence"
```

---

## Task 11: Wire up SessionChatContainer with AiChatShell

**Files:**
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html`

**Step 1: Update shell component**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts
import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatStateService } from '../services';
import { SessionStateService } from '../services/session-state.service';
import { AiChatPanelComponent } from '../ai-chat-panel';
import { SessionChatContainerComponent } from '../session-chat-container';

@Component({
  selector: 'ai-chat-shell',
  standalone: true,
  imports: [RouterOutlet, AiChatPanelComponent, SessionChatContainerComponent],
  templateUrl: './ai-chat-shell.component.html',
})
export class AiChatShellComponent {
  private chatState = inject(AiChatStateService);
  private sessionState = inject(SessionStateService);

  readonly panelOpen = this.chatState.panelOpen;
  readonly panelWidth = this.chatState.panelWidth;
  readonly mainContentStyle = this.chatState.mainContentStyle;
  readonly panelStyle = this.chatState.panelStyle;

  // Connect SessionState to AiChatState
  readonly sessions = this.sessionState.sessionsSignal;
  readonly activeSessionId = this.sessionState.activeSessionIdSignal;
  readonly activeSession = this.sessionState.activeSession;
  readonly currentInputValue = computed(() => this.activeSession()?.inputValue ?? '');

  // Event handlers
  onNewChat(): void {
    this.sessionState.createSession();
    this.chatState.openPanel();
  }

  onSessionSelect(sessionId: string): void {
    this.sessionState.switchSession(sessionId);
    if (!this.panelOpen()) {
      this.chatState.openPanel();
    }
  }

  onSessionToggle(): void {
    this.chatState.togglePanel();
  }

  onSend(message: string): void {
    const sessionId = this.activeSessionId();
    if (sessionId) {
      this.sessionState.addMessage(sessionId, { role: 'user', content: message });
      this.sessionState.updateSessionInput(sessionId, '');
      // TODO: Send to AI service
    }
  }

  onInputChange(value: string): void {
    const sessionId = this.activeSessionId();
    if (sessionId) {
      this.sessionState.updateSessionInput(sessionId, value);
    }
  }

  onRename(data: { sessionId: string; name: string }): void {
    this.sessionState.renameSession(data.sessionId, data.name);
  }

  onDelete(sessionId: string): void {
    if (confirm('确认删除会话？')) {
      this.sessionState.closeSession(sessionId);
      if (!this.activeSession()) {
        this.chatState.closePanel();
      }
    }
  }

  onClosePanel(): void {
    this.chatState.closePanel();
  }

  onResizeCommit(width: number): void {
    this.chatState.setPanelWidth(width);
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html -->
<div class="app-shell flex min-h-screen bg-background relative">
  <!-- Main Content Area (compressible) -->
  <main
    class="main-content flex-1 transition-all duration-300 ease-out"
    [style.flex-basis]="mainContentStyle()['flex-basis']"
    [style.max-width]="mainContentStyle()['max-width']">
    <router-outlet />
  </main>

  <!-- Session Chat Container (always visible) -->
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
    <app-session-chat-container
      [sessions]="sessions()"
      [activeSessionId]="activeSessionId() ?? ''"
      [isOpen]="panelOpen()"
      [inputValue]="currentInputValue()"
      (newChat)="onNewChat()"
      (sessionSelect)="onSessionSelect($event)"
      (sessionToggle)="onSessionToggle()"
      (send)="onSend($event)"
      (inputValueChange)="onInputChange($event)" />
  </div>

  <!-- AI Chat Panel -->
  @if (panelOpen()) {
    <ai-chat-panel
      [activeSession]="activeSession()"
      (rename)="onRename($event)"
      (delete)="onDelete($event)"
      (close)="onClosePanel()"
      (resizeCommit)="onResizeCommit($event)" />
  }
</div>
```

**Step 2: Commit**

```bash
git add src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "feat(ai-chat): wire up SessionChatContainer with AiChatShell and connect event handlers"
```

---

## Task 12: Add delete confirmation dialog component

**Files:**
- Create: `src/app/shared/ui/ai-chat/delete-confirm-dialog/delete-confirm-dialog.component.ts`
- Create: `src/app/shared/ui/ai-chat/delete-confirm-dialog/delete-confirm-dialog.component.html`
- Create: `src/app/shared/ui/ai-chat/delete-confirm-dialog/index.ts`

**Step 1: Write the component**

```typescript
// src/app/shared/ui/ai-chat/delete-confirm-dialog/delete-confirm-dialog.component.ts
import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ai-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirm-dialog.component.html',
})
export class DeleteConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() sessionName = '';

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/delete-confirm-dialog/delete-confirm-dialog.component.html -->
@if (isOpen) {
  <div
    (click)="onBackdropClick($event)"
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div
      liquidGlass
      lgTheme="mineral-dark"
      class="max-w-sm w-full mx-4 p-6 rounded-lg shadow-xl">
      <h3 class="text-lg font-medium text-foreground mb-2">确认删除会话</h3>
      <p class="text-sm text-muted-foreground mb-6">
        确定要删除会话 "<span class="text-foreground font-medium">{{ sessionName }}</span>" 吗？此操作无法撤销。
      </p>

      <div class="flex justify-end gap-3">
        <button
          (click)="onCancel()"
          class="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
          取消
        </button>
        <button
          (click)="onConfirm()"
          class="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
          删除
        </button>
      </div>
    </div>
  </div>
}
```

**Step 2: Update shell to use dialog**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatStateService } from '../services';
import { SessionStateService } from '../services/session-state.service';
import { AiChatPanelComponent } from '../ai-chat-panel';
import { SessionChatContainerComponent } from '../session-chat-container';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog';

@Component({
  selector: 'ai-chat-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    AiChatPanelComponent,
    SessionChatContainerComponent,
    DeleteConfirmDialogComponent,
  ],
  templateUrl: './ai-chat-shell.component.html',
})
export class AiChatShellComponent {
  // ... existing code ...

  readonly deleteDialogOpen = signal(false);
  readonly sessionToDelete = signal<string | null>(null);

  onDelete(sessionId: string): void {
    const session = this.sessions().get(sessionId);
    if (session) {
      this.sessionToDelete.set(sessionId);
      this.deleteDialogOpen.set(true);
    }
  }

  onConfirmDelete(): void {
    const sessionId = this.sessionToDelete();
    if (sessionId) {
      this.sessionState.closeSession(sessionId);
      if (!this.activeSession()) {
        this.chatState.closePanel();
      }
    }
    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }

  onCancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }
}
```

**Step 3: Update template**

```html
<!-- Add to ai-chat-shell.component.html -->
<ai-delete-confirm-dialog
  [isOpen]="deleteDialogOpen()"
  [sessionName]="sessions().get(sessionToDelete())?.name ?? ''"
  (confirm)="onConfirmDelete()"
  (cancel)="onCancelDelete()" />
```

**Step 4: Commit**

```bash
git add src/app/shared/ui/ai-chat/delete-confirm-dialog/ src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "feat(ai-chat): add delete confirmation dialog with liquid-glass styling"
```

---

## Task 13: Add streaming markdown integration to AiChatPanel

**Files:**
- Modify: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.ts`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html`

**Step 1: Update component to use StreamingMarkdownComponent**

```typescript
// src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.ts
import { Component, Input, Signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData } from '@app/shared/models';
import { AiChatStateService } from '../services';
import { PanelHeaderComponent } from '../panel-header';
import { StreamingMarkdownComponent } from '@app/shared/components/streaming-markdown';
import { ResizeHandleComponent } from '../resize-handle';
import { MessageBubbleComponent } from '../message-bubble';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    PanelHeaderComponent,
    StreamingMarkdownComponent,
    ResizeHandleComponent,
    MessageBubbleComponent,
  ],
  templateUrl: './ai-chat-panel.component.html',
})
export class AiChatPanelComponent {
  @Input({ required: true }) activeSession!: Signal<SessionData | null>;
  @Input() streamingContent = '';
  @Input() previewWidth: number | null = null;

  @Output() rename = new EventEmitter<{ sessionId: string; name: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() resizeCommit = new EventEmitter<number>();

  protected readonly sessionName = computed(() => this.activeSession()?.name ?? '');
  protected readonly messages = computed(() => this.activeSession()?.messages ?? []);
  protected readonly sessionId = computed(() => this.activeSession()?.id ?? '');
  protected readonly streaming$ = computed(() => of(this.streamingContent) as Observable<string>);

  onRename(newName: string): void {
    const id = this.sessionId();
    if (id) {
      this.rename.emit({ sessionId: id, name: newName });
    }
  }

  onDelete(): void {
    const id = this.sessionId();
    if (id) {
      this.delete.emit(id);
    }
  }
}
```

```html
<!-- src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html -->
<aside
  class="fixed right-0 top-0 h-full bg-card/95 backdrop-blur-sm border-l border-border/50 shadow-xl overflow-hidden flex flex-col"
  [style.width.px]="previewWidth || 500"
  [style.opacity]="previewWidth !== null ? '0.8' : '1'"
  [style.transform]="previewWidth !== null ? 'scale(0.98)' : 'scale(1)'"
  style="transform-origin: right center; transition: width 0.3s var(--ease-spring-smooth);">
  <!-- Resize Handle -->
  <ai-resize-handle
    (resizePreview)="$event"
    (resizeCommit)="resizeCommit.emit($event)" />

  <!-- Panel Header -->
  <ai-panel-header
    [sessionName]="sessionName"
    [hasNewMessages]="false"
    (rename)="onRename($event)"
    (delete)="onDelete()"
    (close)="close.emit()" />

  <!-- Messages Container -->
  <div class="flex-1 overflow-y-auto" style="max-height: calc(100vh - 120px);">
    <div class="p-4 space-y-4">
      @for (message of messages(); track message.id) {
        @if (message.role === 'user') {
          <ai-message-bubble [message]="message" />
        } @else {
          <!-- AI messages use streaming-markdown -->
          <div class="flex justify-start">
            <div class="max-w-[80%]">
              <app-streaming-markdown
                [stream$]="of(message.content)"
                [maxHeight]="'none'"
                [virtualScroll]="false" />
            </div>
          </div>
        }
      }

      @if (streamingContent) {
        <div class="flex justify-start">
          <div class="max-w-[80%]">
            <app-streaming-markdown
              [stream$]="streaming$()"
              [maxHeight]="'none'"
              [virtualScroll]="false" />
          </div>
        </div>
      }

      @if (messages().length === 0 && !streamingContent) {
        <div class="empty-state flex items-center justify-center h-64 text-muted-foreground">
          <p class="text-sm">开始一个新的对话...</p>
        </div>
      }
    </div>
  </div>
</aside>
```

**Step 2: Commit**

```bash
git add src/app/shared/ui/ai-chat/ai-chat-panel/
git commit -m "feat(ai-chat): integrate StreamingMarkdownComponent for AI message rendering"
```

---

## Task 14: Create demo page for testing

**Files:**
- Create: `src/app/demo/ai-chat-panel/demo-ai-chat-panel.component.ts`
- Create: `src/app/demo/ai-chat-panel/demo-ai-chat-panel.component.html`
- Modify: `src/app/app.routes.ts`

**Step 1: Create demo component**

```typescript
// src/app/demo/ai-chat-panel/demo-ai-chat-panel.component.ts
import { Component, inject } from '@angular/core';
import { SessionStateService } from '@app/shared/ui/ai-chat/services';
import { SessionStatus } from '@app/shared/models';

@Component({
  selector: 'app-demo-ai-chat-panel',
  standalone: true,
  template: `
    <div class="p-8 space-y-6">
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold">AI Chat Panel Demo</h1>
        <p class="text-muted-foreground">
          这是一个全局 AI 对话面板的演示页面。点击底部的"新建会话"按钮开始使用。
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (card of demoCards; track card.title) {
          <div
            class="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer"
            (click)="fillDemoContent(card.type)">
            <h3 class="font-medium">{{ card.title }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ card.description }}</p>
          </div>
        }
      </div>

      <div class="p-4 rounded-lg border border-border bg-muted/20">
        <h3 class="font-medium mb-2">当前状态</h3>
        <div class="text-sm space-y-1 text-muted-foreground">
          <p>会话数量: {{ sessions().size }}</p>
          <p>活动会话: {{ activeSessionId() ?? '无' }}</p>
        </div>
      </div>
    </div>
  `,
})
export class DemoAiChatPanelComponent {
  private sessionState = inject(SessionStateService);

  readonly sessions = this.sessionState.sessionsSignal;
  readonly activeSessionId = this.sessionState.activeSessionIdSignal;

  readonly demoCards = [
    { title: '代码生成', description: '让 AI 生成 Angular 组件代码', type: 'code' },
    { title: '问题解答', description: '询问技术问题获得解答', type: 'qa' },
    { title: '创意写作', description: '让 AI 帮助创作内容', type: 'creative' },
    { title: '数据分析', description: '分析和解释数据', type: 'data' },
    { title: '翻译', description: '多语言翻译服务', type: 'translate' },
    { title: '总结', description: '总结长文本内容', type: 'summary' },
  ];

  fillDemoContent(type: string): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      this.sessionState.createSession();
      return;
    }

    const prompts: Record<string, string> = {
      code: '帮我创建一个 Angular 组件，实现一个带搜索功能的下拉选择框',
      qa: '什么是 Angular 的 Signal？它和 RxJS Observable 有什么区别？',
      creative: '写一段关于"未来城市"的创意描述',
      data: '解释一下 TypeScript 的泛型是什么，以及何时使用它们',
      translate: '将以下句子翻译成英文：Angular 是一个用于构建移动端和桌面端 Web 应用的平台',
      summary: '总结一下 Angular 17 的新特性',
    };

    const prompt = prompts[type] || '你好！';
    this.sessionState.updateSessionInput(sessionId, prompt);
  }
}
```

**Step 2: Add route**

```typescript
// src/app/app.routes.ts - add to demo children
{
  path: 'ai-chat-panel',
  loadComponent: () =>
    import('./demo/ai-chat-panel/demo-ai-chat-panel.component').then(
      (m) => m.DemoAiChatPanelComponent
    ),
},
```

**Step 3: Commit**

```bash
git add src/app/demo/ai-chat-panel/ src/app/app.routes.ts
git commit -m "feat(demo): add AI Chat Panel demo page with sample prompts"
```

---

## Task 15: Add CSS for panel animations

**Files:**
- Modify: `src/styles.css`

**Step 1: Add panel animations**

```css
/* Add to src/styles.css after existing keyframes */

/* Panel slide in from right */
@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Panel slide out to right */
@keyframes panel-slide-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.98);
  }
}

/* Message bubble entrance */
@keyframes message-bubble-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Apply animations */
.ai-chat-panel-enter {
  animation: panel-slide-in 0.3s var(--ease-spring-smooth) forwards;
}

.ai-chat-panel-exit {
  animation: panel-slide-out 0.2s var(--ease-spring-smooth) forwards;
}

.message-bubble-enter {
  animation: message-bubble-in 0.2s var(--ease-spring-snappy) forwards;
}
```

**Step 2: Commit**

```bash
git add src/styles.css
git commit -m "styles(ai-chat): add panel and message bubble animations"
```

---

## Final Integration Test

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run E2E test (if available)**

Run: `npm run e2e`
Expected: E2E tests pass

**Step 3: Manual testing checklist**

- [ ] Panel opens when clicking active session tab
- [ ] Panel closes when clicking active session tab again
- [ ] Switching sessions updates panel content
- [ ] Dragging resize handle shows preview
- [ ] Releasing resize handle commits new width
- [ ] Width is clamped between 300-800px
- [ ] Panel width persists across page refresh
- [ ] Session rename works inline
- [ ] Delete confirmation dialog appears
- [ ] Messages display with correct styling
- [ ] User messages have solid background
- [ ] AI messages have glass effect
- [ ] Empty state shows when no messages
- [ ] New messages indicator appears when user scrolls up

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(ai-chat): complete AI chat panel implementation with all features"
```

---

## Summary

This implementation plan creates a complete AI chat panel system with:

1. **Global state management** via `AiChatStateService` and `SessionStateService`
2. **Compressible layout** that squeezes main content when panel opens
3. **Drag-to-resize** with visual preview indicator
4. **Liquid glass styling** using existing directive
5. **Streaming markdown** integration for AI responses
6. **Smart scroll behavior** with new message indicator
7. **Inline session renaming** with confirmation dialogs
8. **LocalStorage persistence** for sessions and panel width

All components are standalone, use Angular Signals, and follow the project's existing patterns.
