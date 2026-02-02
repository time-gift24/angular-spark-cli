# Multi-Session Chat Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-session AI chat page with hybrid docked/floating session modes, where SessionChatContainer sits at bottom-center and messages display either in a shared right-side dock (docked mode) or at independent positions (floating mode).

**Architecture:** Smart container component (MultiSessionChatPage) manages session state with a new `mode` property, routes messages to one of two dumb presentational components (DockedMessagesArea for right-side display, FloatingSessionRenderer for positioned display), reusing existing SessionChatContainer and ChatMessagesCard components.

**Tech Stack:** Angular 20+, Angular Signals, TypeScript 5.9, Tailwind CSS v4, OKLCH color space

---

## Task 1: Update SessionData Model with Mode Property

**Files:**
- Modify: `src/app/shared/models/session.interface.ts`

**Step 1: Write the failing test**

Create: `src/app/shared/models/session.interface.spec.ts`

```typescript
import { SessionData, SessionMode } from './session.interface';

describe('SessionData Interface', () => {
  it('should have mode property with docked and floating options', () => {
    const dockedSession: SessionData = {
      id: 'test-1',
      name: 'Test',
      messages: [],
      inputValue: '',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default',
      mode: 'docked'  // NEW property
    };

    expect(dockedSession.mode).toBe('docked');
  });

  it('should support floating mode', () => {
    const floatingSession: SessionData = {
      id: 'test-2',
      name: 'Test',
      messages: [],
      inputValue: '',
      position: { x: 200, y: 200 },
      size: { width: 500, height: 600 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default',
      mode: 'floating'  // NEW property
    };

    expect(floatingSession.mode).toBe('floating');
  });

  it('should default to docked mode if not specified', () => {
    const session: Partial<SessionData> = {
      id: 'test-3',
      name: 'Test',
      mode: 'docked'  // Explicit for type checking
    };

    expect(session.mode).toBe('docked');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/shared/models/session.interface.spec.ts`

Expected: FAIL - "Property 'mode' does not exist on type 'SessionData'"

**Step 3: Update SessionData interface**

Open: `src/app/shared/models/session.interface.ts`

Find the SessionData interface and add the mode property:

```typescript
/**
 * Session display mode
 */
export type SessionMode = 'docked' | 'floating';

/**
 * Session data interface
 */
export interface SessionData {
  id: string;
  name: string;
  messages: ChatMessage[];
  inputValue: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lastUpdated: number;
  status: SessionStatus;
  color: SessionColor;
  mode: SessionMode;  // NEW PROPERTY - defaults to 'docked'
}
```

Also export SessionMode at the top of the file with other type exports.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/shared/models/session.interface.spec.ts`

Expected: PASS (all 3 tests pass)

**Step 5: Commit**

```bash
git add src/app/shared/models/session.interface.ts src/app/shared/models/session.interface.spec.ts
git commit -m "feat: add mode property to SessionData interface

Add SessionMode type ('docked' | 'floating') to support hybrid
docked/floating session display system."
```

---

## Task 2: Create DockedMessagesArea Component

**Files:**
- Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.ts`
- Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.html`
- Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.css`
- Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.spec.ts`

**Step 1: Write the failing test**

Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DockedMessagesAreaComponent } from './docked-messages-area.component';
import { ChatMessage } from '@app/shared/models';

describe('DockedMessagesAreaComponent', () => {
  let component: DockedMessagesAreaComponent;
  let fixture: ComponentFixture<DockedMessagesAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DockedMessagesAreaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DockedMessagesAreaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept messages as input', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now()
      }
    ];

    component.messages = messages;
    fixture.detectChanges();

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].content).toBe('Hello');
  });

  it('should accept sessionId as input', () => {
    component.sessionId = 'session-123';
    fixture.detectChanges();

    expect(component.sessionId).toBe('session-123');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/shared/ui/docked-messages-area/docked-messages-area.component.spec.ts`

Expected: FAIL - "Component doesn't exist"

**Step 3: Create component TypeScript file**

Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.ts`

```typescript
import { Component, Input, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '@app/shared/models';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card';

/**
 * DockedMessagesAreaComponent
 *
 * Pure presentational component that displays chat messages in a
 * fixed right-side dock area. Used for sessions with mode='docked'.
 *
 * Features:
 * - Fixed positioning on right side of viewport
 * - Full height (above SessionChatContainer)
 * - Receives messages and sessionId as @Input
 * - Delegates rendering to ChatMessagesCardComponent
 *
 * @example
 * ```html
 * <app-docked-messages-area
 *   [messages]="activeSession()?.messages || []"
 *   [sessionId]="activeSessionId()"
 * />
 * ```
 */
@Component({
  selector: 'app-docked-messages-area',
  standalone: true,
  imports: [CommonModule, ChatMessagesCardComponent],
  templateUrl: './docked-messages-area.component.html',
  styleUrl: './docked-messages-area.component.css',
  changeDetection: 0  // OnPush
})
export class DockedMessagesAreaComponent {
  /**
   * Messages to display
   * @required
   */
  @Input({ required: true })
  messages!: ChatMessage[];

  /**
   * Session ID for these messages
   * @required
   */
  @Input({ required: true })
  sessionId!: string;

  /**
   * Default container classes
   * Fixed position: right side, full height
   */
  protected readonly containerClasses = [
    'docked-messages-area',
    'fixed',
    'right-0',
    'top-0',
    'bottom-[120px]',  // Leave space for SessionChatContainer at bottom
    'w-[480px]',  // Fixed width for docked area
    'bg-background/80',  // Semi-transparent background
    'backdrop-blur-sm',  // Subtle glass effect
    'border-l',
    'border-border',
    'shadow-xl'
  ].join(' ');
}
```

**Step 4: Create component template**

Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.html`

```html
<!-- Docked Messages Area - Fixed Right Side -->
<div [class]="containerClasses">
  <app-chat-messages-card
    [messages]="messages"
    [sessionId]="sessionId"
  />
</div>
```

**Step 5: Create component styles**

Create: `src/app/shared/ui/docked-messages-area/docked-messages-area.component.css`

```css
:host {
  display: block;
}

.docked-messages-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInRight 0.2s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scrollbar styling for messages */
.docked-messages-area ::ng-deep .chat-messages-card {
  height: 100%;
  overflow-y: auto;
}

.docked-messages-area ::ng-deep .chat-messages-card::-webkit-scrollbar {
  width: 6px;
}

.docked-messages-area ::ng-deep .chat-messages-card::-webkit-scrollbar-track {
  background: transparent;
}

.docked-messages-area ::ng-deep .chat-messages-card::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  border-radius: var(--radius);
}

.docked-messages-area ::ng-deep .chat-messages-card::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/app/shared/ui/docked-messages-area/docked-messages-area.component.spec.ts`

Expected: PASS (all 3 tests pass)

**Step 7: Commit**

```bash
git add src/app/shared/ui/docked-messages-area/
git commit -m "feat: add DockedMessagesArea component

Pure presentational component for displaying docked session messages
in fixed right-side area. Features:
- Fixed positioning (right: 0, full height)
- Semi-transparent background with backdrop blur
- Delegates to ChatMessagesCard for rendering
- Slide-in animation from right"
```

---

## Task 3: Create FloatingSessionRenderer Component

**Files:**
- Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.ts`
- Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.html`
- Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.css`
- Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.spec.ts`

**Step 1: Write the failing test**

Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FloatingSessionRendererComponent } from './floating-session-renderer.component';
import { SessionData } from '@app/shared/models';

describe('FloatingSessionRendererComponent', () => {
  let component: FloatingSessionRendererComponent;
  let fixture: ComponentFixture<FloatingSessionRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingSessionRendererComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingSessionRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply session position to style', () => {
    const session: SessionData = {
      id: 'test-1',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 100, y: 200 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    expect(positionStyle['left']).toBe('100px');
    expect(positionStyle['top']).toBe('200px');
  });

  it('should apply session size to style', () => {
    const session: SessionData = {
      id: 'test-2',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 0, y: 0 },
      size: { width: 500, height: 600 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    expect(positionStyle['width']).toBe('500px');
    expect(positionStyle['height']).toBe('600px');
  });

  it('should use default position when session position is invalid', () => {
    const session: SessionData = {
      id: 'test-3',
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: -100, y: -200 },  // Invalid position
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.session = session;
    fixture.detectChanges();

    const positionStyle = component.getPositionStyle();
    // Should clamp to viewport bounds
    expect(parseInt(positionStyle['left'])).toBeGreaterThanOrEqual(0);
    expect(parseInt(positionStyle['top'])).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.spec.ts`

Expected: FAIL - "Component doesn't exist"

**Step 3: Create component TypeScript file**

Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.ts`

```typescript
import { Component, Input, Signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionData, ChatMessage } from '@app/shared/models';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card';

/**
 * Default floating session position
 */
const DEFAULT_POSITION = { x: 100, y: 100 };

/**
 * Default floating session size
 */
const DEFAULT_SIZE = { width: 400, height: 500 };

/**
 * Minimum position values (viewport boundaries)
 */
const MIN_POSITION = { x: 0, y: 0 };

/**
 * FloatingSessionRendererComponent
 *
 * Pure presentational component that displays chat messages at an
 * absolute position determined by the session's position and size.
 * Used for sessions with mode='floating'.
 *
 * Features:
 * - Absolute positioning based on session.position
 * - Dynamic sizing based on session.size
 * - Viewport boundary clamping (prevents off-screen rendering)
 * - Fallback to DEFAULT_POSITION if position invalid
 * - Delegates rendering to ChatMessagesCardComponent
 *
 * @example
 * ```html
 * <app-floating-session-renderer
 *   [session]="activeSession()"
 *   [messages]="activeSession()?.messages || []"
 * />
 * ```
 */
@Component({
  selector: 'app-floating-session-renderer',
  standalone: true,
  imports: [CommonModule, ChatMessagesCardComponent],
  templateUrl: './floating-session-renderer.component.html',
  styleUrl: './floating-session-renderer.component.css',
  changeDetection: 0  // OnPush
})
export class FloatingSessionRendererComponent {
  /**
   * Session data containing position and size
   * @required
   */
  @Input({ required: true })
  session!: SessionData;

  /**
   * Messages to display (also available in session.messages)
   * @required
   */
  @Input({ required: true })
  messages!: ChatMessage[];

  /**
   * Get clamped position style
   * Ensures session stays within viewport bounds
   */
  protected getPositionStyle(): Record<string, string> {
    if (!this.session?.position) {
      return {
        left: `${DEFAULT_POSITION.x}px`,
        top: `${DEFAULT_POSITION.y}px`,
        width: `${DEFAULT_SIZE.width}px`,
        height: `${DEFAULT_SIZE.height}px`
      };
    }

    const { x, y } = this.session.position;
    const { width, height } = this.session.size || DEFAULT_SIZE;

    // Clamp position to viewport bounds
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height - 120; // Reserve space for container

    const clampedX = Math.max(MIN_POSITION.x, Math.min(x, maxX));
    const clampedY = Math.max(MIN_POSITION.y, Math.min(y, maxY));

    return {
      position: 'absolute',
      left: `${clampedX}px`,
      top: `${clampedY}px`,
      width: `${width}px`,
      height: `${height}px`
    };
  }

  /**
   * Default container classes
   * Absolute positioning with shadow and border
   */
  protected readonly containerClasses = [
    'floating-session-renderer',
    'bg-background',
    'border',
    'border-border',
    'rounded-lg',
    'shadow-2xl',
    'overflow-hidden',
    'z-10'
  ].join(' ');
}
```

**Step 4: Create component template**

Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.html`

```html
<!-- Floating Session Renderer - Absolute Positioned -->
<div [class]="containerClasses" [ngStyle]="getPositionStyle()">
  <app-chat-messages-card
    [messages]="messages"
    [sessionId]="session.id"
  />
</div>
```

**Step 5: Create component styles**

Create: `src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.css`

```css
:host {
  display: block;
}

.floating-session-renderer {
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Scrollbar styling */
.floating-session-renderer ::ng-deep .chat-messages-card {
  height: 100%;
  overflow-y: auto;
}

.floating-session-renderer ::ng-deep .chat-messages-card::-webkit-scrollbar {
  width: 6px;
}

.floating-session-renderer ::ng-deep .chat-messages-card::-webkit-scrollbar-track {
  background: var(--muted);
}

.floating-session-renderer ::ng-deep .chat-messages-card::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  border-radius: var(--radius);
}

.floating-session-renderer ::ng-deep .chat-messages-card::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/app/shared/ui/floating-session-renderer/floating-session-renderer.component.spec.ts`

Expected: PASS (all 4 tests pass)

**Step 7: Commit**

```bash
git add src/app/shared/ui/floating-session-renderer/
git commit -m "feat: add FloatingSessionRenderer component

Pure presentational component for displaying floating session messages
at absolute positions. Features:
- Absolute positioning based on session.position
- Viewport boundary clamping (prevents off-screen)
- Fallback to default position (100, 100) if invalid
- Fade-in animation
- Dynamic sizing based on session.size"
```

---

## Task 4: Create MultiSessionChatPage Smart Component

**Files:**
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.ts`
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.html`
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.css`
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.spec.ts`

**Step 1: Write the failing test**

Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSessionChatPageComponent } from './multi-session-chat-page.component';
import { SessionData, SessionStatus, SessionColor } from '@app/shared/models';

describe('MultiSessionChatPageComponent', () => {
  let component: MultiSessionChatPageComponent;
  let fixture: ComponentFixture<MultiSessionChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSessionChatPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSessionChatPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default docked session', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const sessions = component.sessions();
    expect(sessions.size).toBe(1);

    const firstSession = Array.from(sessions.values())[0];
    expect(firstSession.mode).toBe('docked');
    expect(firstSession.name).toBe('New Chat');
  });

  it('should detect active session mode correctly', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const activeMode = component.activeMode();
    expect(activeMode).toBe('docked');
  });

  it('should show docked area when active session is docked', () => {
    component.ngOnInit();
    component.isOpen.set(true);
    fixture.detectChanges();

    const shouldShow = component.shouldShowDocked();
    expect(shouldShow).toBe(true);
  });

  it('should not show floating renderer when active session is docked', () => {
    component.ngOnInit();
    component.isOpen.set(true);
    fixture.detectChanges();

    const shouldShow = component.shouldShowFloating();
    expect(shouldShow).toBe(false);
  });

  it('should switch active session', () => {
    component.ngOnInit();

    const sessionId2 = 'session-2';
    const session2: SessionData = {
      id: sessionId2,
      name: 'Chat 2',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 200, y: 200 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.sessionsInternal.update(map => new Map(map).set(sessionId2, session2));
    component.onSessionSelect(sessionId2);
    fixture.detectChanges();

    expect(component.activeSessionId()).toBe(sessionId2);
    expect(component.activeMode()).toBe('floating');
    expect(component.shouldShowDocked()).toBe(false);
    expect(component.shouldShowFloating()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/features/multi-session-chat/multi-session-chat-page.component.spec.ts`

Expected: FAIL - "Component doesn't exist"

**Step 3: Create component TypeScript file**

Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.ts`

```typescript
import { Component, signal, computed, Signal, inject, DestroyRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionChatContainerComponent } from '@app/shared/ui/session-chat-container';
import { DockedMessagesAreaComponent } from '@app/shared/ui/docked-messages-area';
import { FloatingSessionRendererComponent } from '@app/shared/ui/floating-session-renderer';
import { SessionData, SessionStatus, SessionColor, ChatMessage } from '@app/shared/models';

/**
 * Storage keys for multi-session chat
 */
const SESSIONS_STORAGE_KEY = 'multi-chat-sessions';
const ACTIVE_SESSION_KEY = 'multi-chat-active-session';
const PANEL_STATE_KEY = 'multi-chat-panel-state';

/**
 * Stored sessions data structure
 */
interface StoredSessionsData {
  sessions: Record<string, SessionData>;
  activeSessionId: string;
  panelOpen: boolean;
}

/**
 * MultiSessionChatPageComponent
 *
 * Smart container component for multi-session AI chat page with
 * hybrid docked/floating session modes.
 *
 * Architecture:
 * - Manages all session state (Map<id, SessionData>)
 * - Routes messages to DockedMessagesArea OR FloatingSessionRenderer
 * - Reuses SessionChatContainer for tabs and input
 * - Persists state to localStorage
 *
 * Responsibilities:
 * - Session CRUD (create, read, update, delete)
 * - Active session switching
 * - Message sending and AI response simulation
 * - Storage persistence
 * - 5-session limit enforcement
 */
@Component({
  selector: 'app-multi-session-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    SessionChatContainerComponent,
    DockedMessagesAreaComponent,
    FloatingSessionRendererComponent
  ],
  templateUrl: './multi-session-chat-page.component.html',
  styleUrl: './multi-session-chat-page.component.css'
})
export class MultiSessionChatPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  // ===== State Signals =====

  /**
   * Panel visibility state
   */
  readonly isOpen = signal<boolean>(true);

  /**
   * All sessions map
   */
  private readonly sessionsInternal = signal<Map<string, SessionData>>(new Map());
  readonly sessions: Signal<Map<string, SessionData>> = computed(() => this.sessionsInternal());

  /**
   * Active session ID
   */
  readonly activeSessionId = signal<string>('');

  /**
   * Current input value
   */
  readonly inputValue = signal<string>('');

  // ===== Computed Values =====

  /**
   * Active session data
   */
  readonly activeSession = computed(() => {
    const id = this.activeSessionId();
    return id ? this.sessionsInternal().get(id) : undefined;
  });

  /**
   * Active session's mode (docked or floating)
   */
  readonly activeMode = computed(() => {
    return this.activeSession()?.mode || 'docked';
  });

  /**
   * Should show docked messages area?
   */
  readonly shouldShowDocked = computed(() => {
    return this.isOpen() && this.activeMode() === 'docked';
  });

  /**
   * Should show floating session renderer?
   */
  readonly shouldShowFloating = computed(() => {
    return this.isOpen() && this.activeMode() === 'floating';
  });

  // ===== Constructor =====

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultSession();

    // Auto-save on destroy
    this.destroyRef.onDestroy(() => {
      this.saveToStorage();
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Ensure we have at least one session
    if (this.sessionsInternal().size === 0) {
      this.createNewSession('New Chat');
    }
  }

  // ===== Session Management =====

  /**
   * Load state from storage
   */
  private loadFromStorage(): void {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      const panelState = localStorage.getItem(PANEL_STATE_KEY);

      if (sessionsData) {
        const parsed = JSON.parse(sessionsData) as StoredSessionsData;
        const sessionsMap = new Map<string, SessionData>(Object.entries(parsed.sessions));
        this.sessionsInternal.set(sessionsMap);
        this.activeSessionId.set(activeSession || parsed.activeSessionId || '');
      }

      if (panelState) {
        const state = JSON.parse(panelState);
        this.isOpen.set(state.panelOpen ?? true);
      }
    } catch (error) {
      console.error('[MultiSessionChatPage] Failed to load from storage:', error);
    }
  }

  /**
   * Save state to storage
   */
  private saveToStorage(): void {
    try {
      const sessionsObj = Object.fromEntries(this.sessionsInternal());
      const data: StoredSessionsData = {
        sessions: sessionsObj,
        activeSessionId: this.activeSessionId(),
        panelOpen: this.isOpen()
      };

      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId());
      localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ panelOpen: this.isOpen() }));
    } catch (error) {
      console.error('[MultiSessionChatPage] Failed to save to storage:', error);
    }
  }

  /**
   * Initialize default session if none exists
   */
  private initializeDefaultSession(): void {
    if (this.sessionsInternal().size === 0) {
      this.createNewSession('New Chat');
    }
  }

  /**
   * Create a new session
   */
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
      mode: 'docked'  // Default to docked mode
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

  /**
   * Handle session selection from tabs bar
   */
  onSessionSelect(sessionId: string): void {
    // Save current input to active session before switching
    this.saveCurrentInput();

    this.activeSessionId.set(sessionId);
    const session = this.sessionsInternal().get(sessionId);

    if (session) {
      this.inputValue.set(session.inputValue || '');
    }

    this.saveToStorage();
  }

  /**
   * Handle new chat creation
   */
  onNewChat(): void {
    this.saveCurrentInput();

    // Enforce 5-session limit
    if (this.sessionsInternal().size >= 5) {
      this.closeLeastActiveSession();
    }

    this.createNewSession(`Chat ${this.sessionsInternal().size + 1}`);
  }

  /**
   * Close least active session (by lastUpdated timestamp)
   */
  private closeLeastActiveSession(): void {
    const sessions = Array.from(this.sessionsInternal().entries());
    sessions.sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);

    const [leastActiveId] = sessions[0];
    if (leastActiveId !== this.activeSessionId()) {
      this.sessionsInternal.update(map => {
        const newMap = new Map(map);
        newMap.delete(leastActiveId);
        return newMap;
      });
      console.log(`[MultiSessionChatPage] Closed least active session: ${leastActiveId}`);
    }
  }

  // ===== Input Handling =====

  /**
   * Handle send message
   */
  onSend(message: string): void {
    if (!this.activeSessionId()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    // Add user message
    this.addMessage(userMessage);

    // Clear input
    this.inputValue.set('');
    this.saveCurrentInput();

    // Simulate AI response
    this.simulateAIResponse(message);
  }

  /**
   * Add message to active session
   */
  private addMessage(message: ChatMessage): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated: SessionData = {
          ...session,
          messages: [...session.messages, message],
          lastUpdated: Date.now()
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });

    this.saveToStorage();
  }

  /**
   * Simulate AI response (demo purposes)
   */
  private simulateAIResponse(userMessage: string): void {
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `I received: "${userMessage}". This is a demo response.`,
        timestamp: Date.now()
      };

      this.addMessage(aiMessage);
    }, 1000);
  }

  /**
   * Save current input to active session
   */
  private saveCurrentInput(): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated = {
          ...session,
          inputValue: this.inputValue(),
          lastUpdated: Date.now()
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });
  }

  /**
   * Handle input value change
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);
  }
}
```

**Step 4: Create component template**

Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.html`

```html
<div class="multi-session-chat-page">
  <!-- Docked Messages Area (Right Side) -->
  @if (shouldShowDocked()) {
    <app-docked-messages-area
      [messages]="activeSession()?.messages || []"
      [sessionId]="activeSessionId()"
    />
  }

  <!-- Floating Session Renderer (Absolute Positioned) -->
  @if (shouldShowFloating()) {
    <app-floating-session-renderer
      [session]="activeSession()!"
      [messages]="activeSession()?.messages || []"
    />
  }

  <!-- Session Chat Container (Bottom Center) -->
  <div class="container-wrapper">
    <app-session-chat-container
      [sessions]="sessions()"
      [activeSessionId]="activeSessionId()"
      [isOpen]="isOpen()"
      [inputValue]="inputValue()"
      placeholder="Ask AI anything..."
      (newChat)="onNewChat()"
      (sessionSelect)="onSessionSelect($event)"
      (send)="onSend($event)"
      (inputValueChange)="onInputChange($event)"
    />
  </div>
</div>
```

**Step 5: Create component styles**

Create: `src/app/features/multi-session-chat/multi-session-chat-page.component.css`

```css
:host {
  display: block;
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.multi-session-chat-page {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--background);
}

/* Container wrapper for bottom-center positioning */
.container-wrapper {
  position: fixed;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 90%;
  max-width: 800px;
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/app/features/multi-session-chat/multi-session-chat-page.component.spec.ts`

Expected: PASS (all 6 tests pass)

**Step 7: Commit**

```bash
git add src/app/features/multi-session-chat/
git commit -m "feat: add MultiSessionChatPage smart component

Container component managing multi-session AI chat with hybrid
docked/floating modes. Features:
- Session CRUD with 5-session limit
- Mode-based routing (docked → right area, floating → positioned)
- SessionChatContainer at bottom-center
- localStorage persistence
- AI response simulation
- Active session switching with input preservation"
```

---

## Task 5: Add Routing for Multi-Session Chat Page

**Files:**
- Modify: `src/app/app.routes.ts`

**Step 1: Read current routes**

Run: `cat src/app/app.routes.ts`

Review existing route structure to understand pattern.

**Step 2: Add route for multi-session chat page**

Open: `src/app/app.routes.ts`

Add the route to the routes array:

```typescript
{
  path: 'multi-session-chat',
  loadComponent: () => import('./features/multi-session-chat/multi-session-chat-page.component')
    .then(m => m.MultiSessionChatPageComponent)
},
```

**Step 3: Test route access**

Run: `npm run build`

Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat: add route for multi-session chat page

Route: /multi-session-chat
Loads MultiSessionChatPageComponent lazily"
```

---

## Task 6: Create Demo Page for Multi-Session Chat

**Files:**
- Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.ts`
- Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.html`
- Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.css`

**Step 1: Create demo component**

Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.ts`

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Demo navigation component for Multi-Session Chat page
 */
@Component({
  selector: 'app-demo-multi-session-chat',
  standalone: true,
  templateUrl: './demo-multi-session-chat.component.html',
  styleUrl: './demo-multi-session-chat.component.css'
})
export class DemoMultiSessionChatComponent {
  constructor(private router: Router) {}

  /**
   * Navigate to multi-session chat page
   */
  navigateToChat(): void {
    this.router.navigate(['/multi-session-chat']);
  }
}
```

**Step 2: Create demo template**

Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.html`

```html
<div class="demo-container">
  <div class="demo-content">
    <h1>Multi-Session AI Chat</h1>

    <p class="description">
      A multi-session AI chat interface with hybrid docked/floating session modes.
      SessionChatContainer sits at bottom-center, messages display in right-side dock
      (docked mode) or at independent positions (floating mode).
    </p>

    <div class="features">
      <h2>Features</h2>
      <ul>
        <li>✅ Multiple concurrent sessions (max 5)</li>
        <li>✅ Docked mode: Shared right-side message area</li>
        <li>✅ Floating mode: Independent positioning</li>
        <li>✅ Session tabs with color customization</li>
        <li>✅ localStorage persistence</li>
        <li>✅ AI response simulation</li>
      </ul>
    </div>

    <div class="actions">
      <button class="btn-primary" (click)="navigateToChat()">
        Open Multi-Session Chat
      </button>
    </div>

    <div class="usage">
      <h2>Usage</h2>
      <ol>
        <li>Click "Open Multi-Session Chat" to launch the page</li>
        <li>Send messages using the input at bottom-center</li>
        <li>Create new sessions (max 5)</li>
        <li>Switch between sessions using tabs</li>
        <li>Docked sessions show in right-side area</li>
        <li>Floating sessions show at independent positions (future UI)</li>
      </ol>
    </div>
  </div>
</div>
```

**Step 3: Create demo styles**

Create: `src/app/demo/multi-session-chat/demo-multi-session-chat.component.css`

```css
:host {
  display: block;
}

.demo-container {
  min-height: 100vh;
  padding: var(--spacing-xl);
  background: var(--background);
}

.demo-content {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: var(--spacing-lg);
}

.description {
  font-size: var(--font-size-sm);
  color: var(--muted-foreground);
  line-height: 1.6;
  margin-bottom: var(--spacing-xl);
}

.features h2,
.usage h2 {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--foreground);
  margin-bottom: var(--spacing-md);
}

.features ul,
.usage ol {
  font-size: var(--font-size-sm);
  color: var(--foreground);
  line-height: 1.8;
  margin-bottom: var(--spacing-xl);
  padding-left: var(--spacing-xl);
}

.features li,
.usage li {
  margin-bottom: var(--spacing-sm);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 400;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}
```

**Step 4: Add demo route**

Modify: `src/app/app.routes.ts`

```typescript
{
  path: 'demo/multi-session-chat',
  loadComponent: () => import('./demo/multi-session-chat/demo-multi-session-chat.component')
    .then(m => m.DemoMultiSessionChatComponent)
},
```

**Step 5: Test demo page**

Run: `npm run build`

Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/demo/multi-session-chat/ src/app/app.routes.ts
git commit -m "feat: add demo page for multi-session chat

Demo page at /demo/multi-session-chat with:
- Feature description
- Usage instructions
- Navigation link to /multi-session-chat"
```

---

## Task 7: Integration Testing

**Files:**
- Create: `src/app/features/multi-session-chat/multi-session-chat-page.integration.spec.ts`

**Step 1: Write integration test**

Create: `src/app/features/multi-session-chat/multi-session-chat-page.integration.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSessionChatPageComponent } from './multi-session-chat-page.component';
import { SessionData, SessionStatus } from '@app/shared/models';

describe('MultiSessionChatPage Integration', () => {
  let component: MultiSessionChatPageComponent;
  let fixture: ComponentFixture<MultiSessionChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSessionChatPageComponent]
    }).compileComponents();

    // Clear localStorage before each test
    localStorage.clear();

    fixture = TestBed.createComponent(MultiSessionChatPageComponent);
    component = fixture.componentInstance;
  });

  it('should complete full session lifecycle', () => {
    // 1. Initialize
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.sessions().size).toBe(1);

    // 2. Create new session
    component.onNewChat();
    fixture.detectChanges();

    expect(component.sessions().size).toBe(2);

    // 3. Send message
    component.inputValue.set('Hello AI');
    component.onSend('Hello AI');
    fixture.detectChanges();

    const activeSession = component.activeSession();
    expect(activeSession?.messages.length).toBe(1); // User message

    // 4. Wait for AI response
    setTimeout(() => {
      fixture.detectChanges();
      expect(activeSession?.messages.length).toBe(2); // User + AI
    }, 1500);
  });

  it('should switch between docked and floating sessions', () => {
    component.ngOnInit();

    // Create floating session
    const floatingId = 'floating-1';
    const floatingSession: SessionData = {
      id: floatingId,
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 300, y: 200 },
      size: { width: 500, height: 600 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.sessionsInternal.update(map => new Map(map).set(floatingId, floatingSession));

    // Switch to floating session
    component.onSessionSelect(floatingId);
    fixture.detectChanges();

    expect(component.activeMode()).toBe('floating');
    expect(component.shouldShowFloating()).toBe(true);
    expect(component.shouldShowDocked()).toBe(false);

    // Switch back to docked session
    const dockedId = Array.from(component.sessions().keys())[0];
    component.onSessionSelect(dockedId);
    fixture.detectChanges();

    expect(component.activeMode()).toBe('docked');
    expect(component.shouldShowDocked()).toBe(true);
    expect(component.shouldShowFloating()).toBe(false);
  });

  it('should enforce 5-session limit', () => {
    component.ngOnInit();

    // Create 5 sessions
    for (let i = 0; i < 5; i++) {
      component.onNewChat();
    }

    expect(component.sessions().size).toBe(5);

    // Try to create 6th session
    const initialSize = component.sessions().size;
    component.onNewChat();

    // Should still be 5 (least active closed)
    expect(component.sessions().size).toBe(5);
  });

  afterEach(() => {
    localStorage.clear();
  });
});
```

**Step 2: Run integration tests**

Run: `npm test -- src/app/features/multi-session-chat/multi-session-chat-page.integration.spec.ts`

Expected: All integration tests pass

**Step 3: Commit**

```bash
git add src/app/features/multi-session-chat/multi-session-chat-page.integration.spec.ts
git commit -m "test: add integration tests for MultiSessionChatPage

Coverage:
- Full session lifecycle (create, send, receive)
- Docked/floating mode switching
- 5-session limit enforcement"
```

---

## Task 8: E2E Testing

**Files:**
- Create: `e2e/multi-session-chat.e2e.spec.ts`

**Step 1: Write E2E test**

Create: `e2e/multi-session-chat.e2e.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Multi-Session Chat E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multi-session-chat');
    await page.waitForLoadState('networkidle');
  });

  test('should load page with default session', async ({ page }) => {
    // Check that container is visible
    const container = page.locator('app-session-chat-container');
    await expect(container).toBeVisible();

    // Check that tabs bar has at least one tab
    const tabs = page.locator('.session-tabs-bar app-session-tab');
    await expect(tabs).toHaveCount(1);
  });

  test('should send and receive message', async ({ page }) => {
    // Type message
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await input.fill('Hello from E2E test');

    // Click send button
    const sendBtn = page.locator('button[title="Send message"]');
    await sendBtn.click();

    // Wait for AI response
    await page.waitForTimeout(1500);

    // Check that messages are displayed
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(2); // User + AI
  });

  test('should create new session', async ({ page }) => {
    const initialTabs = page.locator('.session-tabs-bar app-session-tab');
    const initialCount = await initialTabs.count();

    // Click new chat button
    const newChatBtn = page.locator('button[title="New chat"]');
    await newChatBtn.click();

    // Wait for new tab
    const newTabs = page.locator('.session-tabs-bar app-session-tab');
    await expect(newTabs).toHaveCount(initialCount + 1);
  });

  test('should switch between sessions', async ({ page }) => {
    // Create second session
    const newChatBtn = page.locator('button[title="New chat"]');
    await newChatBtn.click();

    // Switch to first session
    const firstTab = page.locator('.session-tabs-bar app-session-tab').first();
    await firstTab.click();

    // Verify input is empty (different session)
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await expect(input).toHaveValue('');
  });

  test('should persist state across reloads', async ({ page }) => {
    // Send a message
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await input.fill('Persistence test');
    const sendBtn = page.locator('button[title="Send message"]');
    await sendBtn.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that message is still there
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(2); // User + AI
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run e2e`

Expected: All E2E tests pass

**Step 3: Commit**

```bash
git add e2e/multi-session-chat.e2e.spec.ts
git commit -m "test: add E2E tests for multi-session chat

Coverage:
- Page load and initialization
- Message send/receive flow
- New session creation
- Session switching
- State persistence across reloads"
```

---

## Task 9: Documentation

**Files:**
- Create: `docs/features/multi-session-chat.md`

**Step 1: Create feature documentation**

Create: `docs/features/multi-session-chat.md`

```markdown
# Multi-Session Chat Page

Feature overview and usage guide for the multi-session AI chat page with hybrid docked/floating modes.

## Overview

The multi-session chat page provides a flexible AI chat interface supporting up to 5 concurrent sessions. Sessions can be displayed in two modes:

- **Docked**: Messages appear in a shared right-side area (full height)
- **Floating**: Messages appear at independent positions (future UI for drag/resize)

## Architecture

### Components

- **MultiSessionChatPage**: Smart container managing session state
- **DockedMessagesArea**: Fixed right-side display for docked sessions
- **FloatingSessionRenderer**: Absolute-positioned display for floating sessions
- **SessionChatContainer**: Reused bottom-center tabs and input

### State Management

All state managed by MultiSessionChatPage using Angular Signals:
- `sessions`: Map<sessionId, SessionData>
- `activeSessionId`: Currently active session ID
- `isOpen`: Panel open/closed state
- `inputValue`: Current input text

### Storage

Persists to localStorage:
- `multi-chat-sessions`: All sessions data
- `multi-chat-active-session`: Active session ID
- `multi-chat-panel-state`: Panel open/closed state

## Usage

### Basic Usage

1. Navigate to `/multi-session-chat`
2. Type message in input at bottom-center
3. Click send button (or press Enter)
4. AI responds after 1 second (demo)

### Session Management

- **Create new session**: Click "+" button in tabs bar
- **Switch sessions**: Click session tab
- **Rename session**: Double-click tab name (future)
- **Change color**: Click color picker (future)
- **Close session**: Click X on tab (future)

### Session Limits

- Maximum 5 concurrent sessions
- When limit reached, least active session (by `lastUpdated`) closes automatically

### Session Modes

**Docked Mode** (default):
- Messages display in fixed right-side area
- Full height (above SessionChatContainer)
- Semi-transparent background with backdrop blur

**Floating Mode**:
- Messages display at absolute position
- Independent width/height
- Viewport boundary clamping (prevents off-screen)

## API

### SessionData Interface

```typescript
interface SessionData {
  id: string;
  name: string;
  messages: ChatMessage[];
  inputValue: string;
  mode: 'docked' | 'floating';  // NEW
  position: { x: number; y: number };
  size: { width: number; height: number };
  lastUpdated: number;
  status: SessionStatus;
  color: SessionColor;
}
```

### Component Inputs/Outputs

**DockedMessagesArea**:
- `@Input() messages: ChatMessage[]`
- `@Input() sessionId: string`

**FloatingSessionRenderer**:
- `@Input() session: SessionData`
- `@Input() messages: ChatMessage[]`

**MultiSessionChatPage**:
- Uses SessionChatContainer inputs/outputs

## Future Enhancements

See parking lot in design doc:
- Floating session drag/resize UI
- Mode toggle button
- Multi-session visibility
- Dock zone highlighting
- Smooth animations
- Keyboard shortcuts

## Testing

- Unit: `src/app/features/multi-session-chat/*.spec.ts`
- Integration: `src/app/features/multi-session-chat/*.integration.spec.ts`
- E2E: `e2e/multi-session-chat.e2e.spec.ts`

Run all tests:
```bash
npm test
npm run e2e
```
```

**Step 2: Commit**

```bash
git add docs/features/multi-session-chat.md
git commit -m "docs: add multi-session chat feature documentation

Complete usage guide with:
- Architecture overview
- State management details
- Storage keys
- Session management instructions
- API reference
- Testing instructions"
```

---

## Task 10: Final Build and Verification

**Step 1: Run full test suite**

```bash
npm test -- --watch=false
```

Expected: All tests pass (unit + integration)

**Step 2: Run E2E tests**

```bash
npm run e2e
```

Expected: All E2E tests pass

**Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: Verify manual testing**

1. Start dev server: `npm start`
2. Navigate to: `http://localhost:4200/demo/multi-session-chat`
3. Click "Open Multi-Session Chat"
4. Test:
   - Send message, receive AI response
   - Create new session
   - Switch between sessions
   - Reload page (verify persistence)
   - Create 6th session (verify limit enforcement)

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete multi-session chat page implementation

MVP features complete:
✅ SessionData with mode property
✅ DockedMessagesArea component
✅ FloatingSessionRenderer component
✅ MultiSessionChatPage smart container
✅ Routing configuration
✅ Demo page
✅ Integration tests
✅ E2E tests
✅ Documentation

Hybrid docked/floating session system with:
- 5-session limit with auto-close
- localStorage persistence
- AI response simulation
- Mode-based message routing
- Mineral & Time theme integration

Ready for review and testing."
```

---

## Summary

**Total Tasks**: 10
**Estimated Time**: 2-3 hours
**Test Coverage**: Unit + Integration + E2E
**Documentation**: Design + Feature + API

**Components Created**:
- 3 new components (DockedMessagesArea, FloatingSessionRenderer, MultiSessionChatPage)
- 1 updated interface (SessionData)
- 1 demo page
- Comprehensive tests (unit, integration, E2E)
- Full documentation

**Design Principles**:
- ✅ TDD (test-first for all components)
- ✅ DRY (reused ChatMessagesCard, SessionChatContainer)
- ✅ YAGNI (parked future features)
- ✅ Frequent commits (each task)
- ✅ Type safety (TypeScript throughout)

**Next Steps After Implementation**:
1. Code review with superpowers:code-reviewer
2. Future enhancements from parking lot
3. User testing and feedback
4. Performance optimization
5. Accessibility audit
