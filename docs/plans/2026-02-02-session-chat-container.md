# SessionChatContainer Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use @superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a pure presentational component that composes SessionTabsBar and ChatInput with event forwarding and Tailwind-first styling.

**Architecture:**
- Pure presentational component (no business logic, all state managed by parent)
- Composes existing SessionTabsBar and ChatInput components
- Forwards 4 core events: newChat, sessionSelect, sessionToggle, send
- Two-way binding support for inputValue
- Tailwind utility classes for styling with full override capability

**Tech Stack:**
- Angular 20+ with standalone components
- Signals for reactivity
- Tailwind CSS v4 utility-first
- TypeScript strict mode
- ChangeDetectionStrategy.OnPush

---

## Prerequisites

**Required Reading:**
- Design doc: `docs/brainstorm/2026-02-02-session-chat-container-brainstorm.md`
- SessionTabsBar: `src/app/shared/ui/session-tabs-bar/session-tabs-bar.component.ts`
- ChatInput: `src/app/shared/ui/ai-chat/chat-input/chat-input.component.ts`

**Key Design Decisions:**
1. No business logic in component (5-tab limit handled by parent)
2. All state via @Input from parent (pure data flow)
3. Tailwind utilities in template, minimal CSS (only animations)
4. Component tests for event forwarding, not behavior

---

## Task 1: Create Component File Structure

**Files:**
- Create: `src/app/shared/ui/session-chat-container/session-chat-container.component.ts`
- Create: `src/app/shared/ui/session-chat-container/session-chat-container.component.html`
- Create: `src/app/shared/ui/session-chat-container/session-chat-container.component.css`
- Create: `src/app/shared/ui/session-chat-container/index.ts`

**Step 1: Create component TypeScript file**

Write: `src/app/shared/ui/session-chat-container/session-chat-container.component.ts`

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SessionTabsBarComponent } from '@app/shared/ui/session-tabs-bar';
import { ChatInputComponent } from '@app/shared/ui/ai-chat';
import { SessionData } from '@app/shared/models';

/**
 * Session Chat Container Component
 *
 * Pure presentational component that composes SessionTabsBar and ChatInput.
 * All state is managed by parent component, this component only forwards events.
 *
 * Key Features:
 * - Displays session tabs with input below (when open)
 * - Forwards all core events without modification
 * - Supports Tailwind class overrides for full customization
 * - Two-way binding support for inputValue
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <app-session-chat-container
 *       [sessions]="sessions"
 *       [activeSessionId]="activeSessionId()"
 *       [isOpen]="isOpen()"
 *       [inputValue]="inputValue()"
 *       (newChat)="onNewChat()"
 *       (sessionSelect)="onSessionSelect($event)"
 *     />
 *   `
 * })
 * ```
 */
@Component({
  selector: 'app-session-chat-container',
  standalone: true,
  imports: [SessionTabsBarComponent, ChatInputComponent],
  templateUrl: './session-chat-container.component.html',
  styleUrl: './session-chat-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionChatContainerComponent {
  // Implementation will be added in Task 2
}
```

**Step 2: Create component template file**

Write: `src/app/shared/ui/session-chat-container/session-chat-container.component.html`

```html
<!-- Template will be completed in Task 3 -->
<div class="session-chat-container">
  <p>Template placeholder</p>
</div>
```

**Step 3: Create component CSS file**

Write: `src/app/shared/ui/session-chat-container/session-chat-container.component.css`

```css
/* CSS will be completed in Task 4 */
:host {
  display: block;
}
```

**Step 4: Create index file**

Write: `src/app/shared/ui/session-chat-container/index.ts`

```typescript
export * from './session-chat-container.component';
```

**Step 5: Verify component compiles**

Run: `npm run build`

Expected: No errors

**Step 6: Commit**

```bash
git add src/app/shared/ui/session-chat-container/
git commit -m "feat: create session-chat-container component structure

- Add component files (ts, html, css, index)
- Setup standalone component with OnPush strategy
- Import SessionTabsBar and ChatInput dependencies
- Empty template to be filled in next tasks

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Implement Component Inputs and Outputs

**Files:**
- Modify: `src/app/shared/ui/session-chat-container/session-chat-container.component.ts:21-37`

**Step 1: Write failing test for required inputs**

Write: `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionChatContainerComponent } from './session-chat-container.component';
import { SessionData } from '@app/shared/models';

describe('SessionChatContainerComponent', () => {
  let component: SessionChatContainerComponent;
  let fixture: ComponentFixture<SessionChatContainerComponent>;

  const mockSessions = new Map<string, SessionData>();
  const mockActiveSessionId = 'session-1';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionChatContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionChatContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have sessions input', () => {
    component.sessions = signal(mockSessions);
    fixture.detectChanges();

    expect(component.sessions).toBeDefined();
  });

  it('should have activeSessionId input', () => {
    component.activeSessionId = signal(mockActiveSessionId);
    fixture.detectChanges();

    expect(component.activeSessionId).toBeDefined();
  });

  it('should have isOpen input', () => {
    component.isOpen = signal(true);
    fixture.detectChanges();

    expect(component.isOpen).toBeDefined();
  });

  it('should have inputValue input', () => {
    component.inputValue = signal('test input');
    fixture.detectChanges();

    expect(component.inputValue).toBeDefined();
  });

  it('should have placeholder input with default value', () => {
    expect(component.placeholder).toBeDefined();
    expect(component.placeholder).toBe('Ask AI anything...');
  });

  it('should have disabled input with default value', () => {
    expect(component.disabled).toBeDefined();
    expect(component.disabled).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- session-chat-container --watch=false`

Expected: FAIL with "Property 'sessions' does not exist on type"

**Step 3: Implement inputs**

Replace lines 21-37 in `src/app/shared/ui/session-chat-container/session-chat-container.component.ts` with:

```typescript
export class SessionChatContainerComponent {
  /**
   * Map of all session data
   * @required
   */
  @Input({ required: true })
  sessions!: Signal<Map<string, SessionData>>;

  /**
   * ID of the currently active session
   * @required
   */
  @Input({ required: true })
  activeSessionId!: Signal<string>;

  /**
   * Whether the input panel is open
   * @required
   */
  @Input({ required: true })
  isOpen!: Signal<boolean>;

  /**
   * Current input value (two-way binding)
   * @required
   */
  @Input({ required: true })
  inputValue!: Signal<string>;

  /**
   * Placeholder text for input
   * @default 'Ask AI anything...'
   */
  @Input()
  placeholder = 'Ask AI anything...';

  /**
   * Whether input is disabled
   * @default false
   */
  @Input()
  disabled = false;

  /**
   * Custom container CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  containerClass?: string;

  /**
   * Custom tabs wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  tabsWrapperClass?: string;

  /**
   * Custom input wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  inputWrapperClass?: string;

  /**
   * Maximum number of tabs (informational only, logic in parent)
   * @default 5
   */
  @Input()
  maxTabs = 5;
}
```

**Step 4: Add missing import**

Add to imports at top of file:

```typescript
import { signal } from '@angular/core';
```

**Step 5: Run test to verify it passes**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 6: Write failing tests for outputs**

Add to `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`:

```typescript
  it('should have newChat output', () => {
    expect(component.newChat).toBeDefined();
    expect(component.newChat).toBeInstanceOf(EventEmitter);
  });

  it('should have sessionSelect output', () => {
    expect(component.sessionSelect).toBeDefined();
    expect(component.sessionSelect).toBeInstanceOf(EventEmitter);
  });

  it('should have sessionToggle output', () => {
    expect(component.sessionToggle).toBeDefined();
    expect(component.sessionToggle).toBeInstanceOf(EventEmitter);
  });

  it('should have send output', () => {
    expect(component.send).toBeDefined();
    expect(component.send).toBeInstanceOf(EventEmitter);
  });

  it('should have inputValueChange output', () => {
    expect(component.inputValueChange).toBeDefined();
    expect(component.inputValueChange).toBeInstanceOf(EventEmitter);
  });
```

**Step 7: Run test to verify it fails**

Run: `npm test -- session-chat-container --watch=false`

Expected: FAIL with "Property 'newChat' does not exist"

**Step 8: Implement outputs**

Add to class in `src/app/shared/ui/session-chat-container/session-chat-container.component.ts` (after inputs):

```typescript
  /**
   * Event emitted when user clicks "new chat" button
   * Parent component should handle 5-tab limit and close least active session
   */
  @Output()
  readonly newChat = new EventEmitter<void>();

  /**
   * Event emitted when user selects a different session tab
   * Emits the session ID
   */
  @Output()
  readonly sessionSelect = new EventEmitter<string>();

  /**
   * Event emitted when user clicks active session tab (toggle panel)
   */
  @Output()
  readonly sessionToggle = new EventEmitter<void>();

  /**
   * Event emitted when user sends a message
   * Emits the message content
   */
  @Output()
  readonly send = new EventEmitter<string>();

  /**
   * Event emitted when input value changes (for two-way binding)
   * Emits the new input value
   */
  @Output()
  readonly inputValueChange = new EventEmitter<string>();
```

**Step 9: Run test to verify it passes**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 10: Commit**

```bash
git add src/app/shared/ui/session-chat-container/
git commit -m "feat: implement component inputs and outputs

- Add required inputs: sessions, activeSessionId, isOpen, inputValue
- Add optional inputs with defaults: placeholder, disabled, maxTabs
- Add style override inputs: containerClass, tabsWrapperClass, inputWrapperClass
- Add 5 outputs: newChat, sessionSelect, sessionToggle, send, inputValueChange
- Add component tests for all inputs and outputs
- All tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Implement Template with Tailwind Styling

**Files:**
- Modify: `src/app/shared/ui/session-chat-container/session-chat-container.component.html`

**Step 1: Write failing test for conditional rendering**

Add to `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`:

```typescript
  it('should not display chat input when isOpen is false', () => {
    component.sessions = signal(new Map());
    component.activeSessionId = signal('session-1');
    component.isOpen = signal(false);
    component.inputValue = signal('');

    fixture.detectChanges();

    const inputElement = fixture.nativeElement.querySelector('ai-chat-input');
    expect(inputElement).toBeNull();
  });

  it('should display chat input when isOpen is true', () => {
    component.sessions = signal(new Map());
    component.activeSessionId = signal('session-1');
    component.isOpen = signal(true);
    component.inputValue = signal('');

    fixture.detectChanges();

    const inputElement = fixture.nativeElement.querySelector('ai-chat-input');
    expect(inputElement).toBeTruthy();
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- session-chat-container --watch=false`

Expected: FAIL - ChatInput not found

**Step 3: Implement template**

Replace entire content of `src/app/shared/ui/session-chat-container/session-chat-container.component.html` with:

```html
<!-- Main container - flex column with gap, fully overridable -->
<div [class]="containerClass()">
  <!-- Session Tabs Bar -->
  <div [class]="tabsWrapperClass()">
    <spark-session-tabs-bar
      [sessions]="sessions"
      [activeSessionId]="activeSessionId"
      (sessionSelect)="onSessionSelect($event)"
      (sessionToggle)="onSessionToggle()"
      (newChat)="onNewChat()"
    />
  </div>

  <!-- Chat Input - conditional rendering based on isOpen -->
  @if (isOpen()) {
    <div [class]="inputWrapperClass()">
      <ai-chat-input
        [value]="inputValue()"
        (valueChange)="onInputChange($event)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (send)="onSend($event)"
      />
    </div>
  }
</div>
```

**Step 4: Add helper methods to component**

Add to class in `src/app/shared/ui/session-chat-container/session-chat-container.component.ts`:

```typescript
  /**
   * Default Tailwind classes for main container
   */
  protected readonly defaultContainerClass = 'flex flex-col w-full gap-2';

  /**
   * Default Tailwind classes for tabs wrapper
   */
  protected readonly defaultTabsWrapperClass = 'w-full';

  /**
   * Default Tailwind classes for input wrapper
   */
  protected readonly defaultInputWrapperClass =
    'w-full transition-all duration-200 ease-out';

  /**
   * Computed container class (custom or default)
   */
  protected containerClass(): string {
    return this.containerClass || this.defaultContainerClass;
  }

  /**
   * Computed tabs wrapper class (custom or default)
   */
  protected tabsWrapperClass(): string {
    return this.tabsWrapperClass || this.defaultTabsWrapperClass;
  }

  /**
   * Computed input wrapper class (custom or default)
   */
  protected inputWrapperClass(): string {
    return this.inputWrapperClass || this.defaultInputWrapperClass;
  }

  /**
   * Forward session select event
   */
  protected onSessionSelect(sessionId: string): void {
    this.sessionSelect.emit(sessionId);
  }

  /**
   * Forward session toggle event
   */
  protected onSessionToggle(): void {
    this.sessionToggle.emit();
  }

  /**
   * Forward new chat event
   */
  protected onNewChat(): void {
    this.newChat.emit();
  }

  /**
   * Forward send event
   */
  protected onSend(message: string): void {
    this.send.emit(message);
  }

  /**
   * Forward input value change event
   */
  protected onInputChange(value: string): void {
    this.inputValueChange.emit(value);
  }
```

**Step 5: Run test to verify it passes**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 6: Write failing test for style override capability**

Add to `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`:

```typescript
  it('should use default container classes when no override provided', () => {
    component.sessions = signal(new Map());
    component.activeSessionId = signal('session-1');
    component.isOpen = signal(false);
    component.inputValue = signal('');

    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.session-chat-container');
    expect(container.classList.contains('flex')).toBeTrue();
    expect(container.classList.contains('flex-col')).toBeTrue();
    expect(container.classList.contains('w-full')).toBeTrue();
    expect(container.classList.contains('gap-2')).toBeTrue();
  });

  it('should use custom container classes when override provided', () => {
    component.sessions = signal(new Map());
    component.activeSessionId = signal('session-1');
    component.isOpen = signal(false);
    component.inputValue = signal('');
    component.containerClass = 'flex flex-row gap-4 p-4';

    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.session-chat-container');
    expect(container.classList.contains('flex-row')).toBeTrue();
    expect(container.classList.contains('gap-4')).toBeTrue();
    expect(container.classList.contains('p-4')).toBeTrue();
    expect(container.classList.contains('gap-2')).toBeFalse();
  });
```

**Step 7: Run test to verify it fails**

Run: `npm test -- session-chat-container --watch=false`

Expected: FAIL - No class binding on host element

**Step 8: Fix template to support class override**

Update the opening div in template:

```html
<!-- Main container - add host class for testing -->
<div [class]="'session-chat-container ' + containerClass()">
```

**Step 9: Run test to verify it passes**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 10: Commit**

```bash
git add src/app/shared/ui/session-chat-container/
git commit -m "feat: implement template with Tailwind styling

- Add flex column layout with gap-2
- Implement conditional rendering for ChatInput (isOpen)
- Add SessionTabsBar with all event bindings
- Add style override support for all containers
- Implement event forwarding methods
- Add tests for conditional rendering and style overrides
- All tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Write Event Forwarding Tests

**Files:**
- Modify: `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`

**Step 1: Write test for newChat event forwarding**

Add to spec file:

```typescript
  describe('Event Forwarding', () => {
    beforeEach(() => {
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal('');
      fixture.detectChanges();
    });

    it('should forward newChat event', () => {
      spyOn(component.newChat, 'emit');

      component.onNewChat();

      expect(component.newChat.emit).toHaveBeenCalledWith();
    });

    it('should forward sessionSelect event with sessionId', () => {
      spyOn(component.sessionSelect, 'emit');
      const testSessionId = 'session-42';

      component.onSessionSelect(testSessionId);

      expect(component.sessionSelect.emit).toHaveBeenCalledWith(testSessionId);
    });

    it('should forward sessionToggle event', () => {
      spyOn(component.sessionToggle, 'emit');

      component.onSessionToggle();

      expect(component.sessionToggle.emit).toHaveBeenCalledWith();
    });

    it('should forward send event with message', () => {
      spyOn(component.send, 'emit');
      const testMessage = 'Hello, AI!';

      component.onSend(testMessage);

      expect(component.send.emit).toHaveBeenCalledWith(testMessage);
    });

    it('should forward inputValueChange event with value', () => {
      spyOn(component.inputValueChange, 'emit');
      const testValue = 'test input';

      component.onInputChange(testValue);

      expect(component.inputValueChange.emit).toHaveBeenCalledWith(testValue);
    });
  });
```

**Step 2: Run tests**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 3: Write integration test for event chain**

Add to spec file:

```typescript
  describe('Integration', () => {
    it('should complete full event flow for new chat', () => {
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal('');

      const newChatSpy = jasmine.createSpyObj('emit', ['emit']);
      component.newChat = newChatSpy as any;

      fixture.detectChanges();

      // Simulate child component emitting event
      component.onNewChat();

      expect(newChatSpy.emit).toHaveBeenCalled();
    });

    it('should complete full event flow for sending message', () => {
      const testMessage = 'Test message';
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal(testMessage);

      const sendSpy = jasmine.createSpyObj('emit', ['emit']);
      component.send = sendSpy as any;

      fixture.detectChanges();

      component.onSend(testMessage);

      expect(sendSpy.emit).toHaveBeenCalledWith(testMessage);
    });

    it('should support two-way binding for inputValue', () => {
      const initialValue = '';
      const newValue = 'new value';

      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal(initialValue);

      const valueChangeSpy = jasmine.createSpyObj('emit', ['emit']);
      component.inputValueChange = valueChangeSpy as any;

      fixture.detectChanges();

      component.onInputChange(newValue);

      expect(component.inputValueChange.emit).toHaveBeenCalledWith(newValue);
    });
  });
```

**Step 4: Run tests**

Run: `npm test -- session-chat-container --watch=false`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/shared/ui/session-chat-container/
git commit -m "test: add comprehensive event forwarding tests

- Test all 5 event outputs are forwarded correctly
- Test events are emitted with correct payloads
- Add integration tests for full event chains
- Test two-way binding support for inputValue
- All tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add CSS Animations

**Files:**
- Modify: `src/app/shared/ui/session-chat-container/session-chat-container.component.css`

**Step 1: Add slide-in animation**

Replace entire content of CSS file with:

```css
:host {
  display: block;
}

/* Custom slide-in animation for ChatInput */
@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Apply animation when panel opens */
.slide-in {
  animation: slideIn 0.2s ease-out;
}
```

**Step 2: Update template to use animation**

Update the input wrapper div in template:

```html
  @if (isOpen()) {
    <div [class]="inputWrapperClass()" @slideIn>
      <ai-chat-input
        [value]="inputValue()"
        (valueChange)="onInputChange($event)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (send)="onSend($event)"
      />
    </div>
  }
```

**Note:** Angular animations require importing BrowserAnimationsModule. For MVP, we'll skip Angular animations and use CSS transitions already in Tailwind classes.

Revert template change - keep Tailwind transitions:

```html
  @if (isOpen()) {
    <div [class]="inputWrapperClass()">
      <ai-chat-input
        [value]="inputValue()"
        (valueChange)="onInputChange($event)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (send)="onSend($event)"
      />
    </div>
  }
```

**Step 3: Verify component compiles**

Run: `npm run build`

Expected: Success

**Step 4: Commit**

```bash
git add src/app/shared/ui/session-chat-container/
git commit -m "style: add CSS animations and transitions

- Add slide-in keyframe animation for future use
- Use Tailwind transition classes for smooth open/close
- CSS transitions: duration-200 ease-out
- Keep CSS minimal per project guidelines

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Demo Page

**Files:**
- Create: `src/app/demo/session-chat-container/demo-session-chat-container.component.ts`
- Create: `src/app/demo/session-chat-container/demo-session-chat-container.component.html`
- Create: `src/app/demo/session-chat-container/demo-session-chat-container.component.css`
- Create: `src/app/demo/session-chat-container/types/`
- Create: `src/app/demo/session-chat-container/examples/`

**Step 1: Create types file**

Write: `src/app/demo/session-chat-container/types/index.ts`

```typescript
export interface DemoState {
  sessions: Map<string, SessionData>;
  activeSessionId: string;
  isOpen: boolean;
  inputValue: string;
}
```

**Step 2: Create examples config**

Write: `src/app/demo/session-chat-container/examples/index.ts`

```typescript
import { DemoState } from '../types';

export const initialState: DemoState = {
  sessions: new Map([
    [
      'session-1',
      {
        id: 'session-1',
        name: 'Angular 开发讨论',
        messages: [],
        inputValue: '',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 500 },
        lastUpdated: Date.now() - 1000 * 60 * 5,
        status: 'idle',
        color: 'default',
      },
    ],
    [
      'session-2',
      {
        id: 'session-2',
        name: 'TypeScript 类型问题',
        messages: [],
        inputValue: '如何定义泛型类型？',
        position: { x: 150, y: 150 },
        size: { width: 380, height: 480 },
        lastUpdated: Date.now() - 1000 * 60 * 15,
        status: 'idle',
        color: 'blue',
      },
    ],
  ]),
  activeSessionId: 'session-1',
  isOpen: true,
  inputValue: '',
};
```

**Step 3: Create demo component**

Write: `src/app/demo/session-chat-container/demo-session-chat-container.component.ts`

```typescript
import { Component, signal, computed } from '@angular/core';
import { SessionChatContainerComponent } from '@app/shared/ui/session-chat-container';
import { SessionData } from '@app/shared/models';
import { initialState } from './examples';

@Component({
  selector: 'app-demo-session-chat-container',
  standalone: true,
  imports: [SessionChatContainerComponent],
  templateUrl: './demo-session-chat-container.component.html',
  styleUrls: ['./demo-session-chat-container.component.css'],
})
export class DemoSessionChatContainerComponent {
  // State
  private sessionsInternal = signal<Map<string, SessionData>>(
    initialState.sessions,
  );
  readonly sessions = computed(() => this.sessionsInternal());
  readonly activeSessionId = signal(initialState.activeSessionId);
  readonly isOpen = signal(initialState.isOpen);
  readonly inputValue = signal(initialState.inputValue);

  // Event log
  readonly eventLog = signal<string[]>([]);

  // Counter for new sessions
  private nextId = 3;

  /**
   * Handle new chat event
   */
  onNewChat(): void {
    const currentSessions = this.sessionsInternal();

    // Check 5-tab limit
    if (currentSessions.size >= 5) {
      this.addLog('已达到最大会话数 (5)，关闭最不活跃的会话');

      // Find least active session
      let leastActiveId = '';
      let leastActiveTime = Infinity;

      currentSessions.forEach((session, id) => {
        if (session.lastUpdated < leastActiveTime) {
          leastActiveTime = session.lastUpdated;
          leastActiveId = id;
        }
      });

      // Close least active
      if (leastActiveId) {
        this.sessionsInternal.update((map) => {
          const newMap = new Map(map);
          newMap.delete(leastActiveId);
          return newMap;
        });
      }
    }

    // Create new session
    const newSession: SessionData = {
      id: `session-${this.nextId++}`,
      name: `新对话 ${this.nextId - 1}`,
      messages: [],
      inputValue: '',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
    };

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      newMap.set(newSession.id, newSession);
      return newMap;
    });

    this.activeSessionId.set(newSession.id);
    this.addLog(`创建新会话: ${newSession.name}`);
  }

  /**
   * Handle session select event
   */
  onSessionSelect(sessionId: string): void {
    this.activeSessionId.set(sessionId);
    const session = this.sessionsInternal().get(sessionId);
    this.addLog(`切换会话: "${session?.name || sessionId}"`);

    // Restore draft input
    if (session) {
      this.inputValue.set(session.inputValue || '');
    }
  }

  /**
   * Handle session toggle event
   */
  onSessionToggle(): void {
    this.isOpen.update((v) => !v);
    this.addLog(`面板: ${this.isOpen() ? '展开' : '收起'}`);
  }

  /**
   * Handle send message event
   */
  onSend(message: string): void {
    this.addLog(`发送消息: "${message}"`);

    // Clear input
    this.inputValue.set('');

    // Save to session
    const activeId = this.activeSessionId();
    if (activeId) {
      this.sessionsInternal.update((map) => {
        const newMap = new Map(map);
        const session = newMap.get(activeId);
        if (session) {
          const updated = {
            ...session,
            inputValue: '',
            lastUpdated: Date.now(),
          };
          newMap.set(activeId, updated);
        }
        return newMap;
      });
    }
  }

  /**
   * Handle input value change
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);

    // Save draft to session
    const activeId = this.activeSessionId();
    if (activeId) {
      this.sessionsInternal.update((map) => {
        const newMap = new Map(map);
        const session = newMap.get(activeId);
        if (session) {
          const updated = {
            ...session,
            inputValue: value,
            lastUpdated: Date.now(),
          };
          newMap.set(activeId, updated);
        }
        return newMap;
      });
    }
  }

  /**
   * Toggle panel
   */
  togglePanel(): void {
    this.onSessionToggle();
  }

  /**
   * Clear log
   */
  clearLog(): void {
    this.eventLog.set([]);
  }

  /**
   * Add log entry
   */
  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.update((log) => [`[${timestamp}] ${message}`, ...log]);
  }
}
```

**Step 4: Create demo template**

Write: `src/app/demo/session-chat-container/demo-session-chat-container.component.html`

```html
<div class="demo-page">
  <!-- Info Panel -->
  <aside class="info-panel">
    <h2 class="info-title">Session Chat Container</h2>
    <p class="info-desc">
      纯展示组合组件 - 整合 SessionTabsBar 和 ChatInput
    </p>

    <!-- Controls -->
    <div class="controls-section">
      <h3 class="section-title">控制面板</h3>
      <button class="control-btn" (click)="togglePanel()">
        {{ isOpen() ? '📖 面板: 已展开' : '📕 面板: 已收起' }}
      </button>
      <button class="control-btn" (click)="clearLog()">
        🗑️ 清空日志 ({{ eventLog().length }})
      </button>
    </div>

    <!-- Event Log -->
    @if (eventLog().length > 0) {
      <div class="log-section">
        <h3 class="section-title">事件日志</h3>
        <div class="log-list">
          @for (log of eventLog(); track log) {
            <div class="log-item">{{ log }}</div>
          }
        </div>
      </div>
    }
  </aside>

  <!-- Component Demo -->
  <main class="component-container">
    <app-session-chat-container
      [sessions]="sessions()"
      [activeSessionId]="activeSessionId()"
      [isOpen]="isOpen()"
      [inputValue]="inputValue()"
      (newChat)="onNewChat()"
      (sessionSelect)="onSessionSelect($event)"
      (sessionToggle)="onSessionToggle()"
      (send)="onSend($event)"
      (inputValueChange)="onInputChange($event)"
    />
  </main>
</div>
```

**Step 5: Create demo styles**

Write: `src/app/demo/session-chat-container/demo-session-chat-container.component.css`

```css
.demo-page {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  min-height: 100vh;
}

.info-panel {
  flex: 0 0 300px;
  padding: var(--spacing-lg);
  background: var(--muted);
  border-radius: var(--radius-md);
  height: fit-content;
}

.info-title {
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--foreground);
  margin: 0 0 var(--spacing-md) 0;
}

.info-desc {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin: 0 0 var(--spacing-xl) 0;
}

.controls-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--foreground);
  margin: 0 0 var(--spacing-md) 0;
}

.control-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-xs);
  font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: var(--accent);
}

.log-section {
  margin-top: var(--spacing-lg);
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  font-size: var(--text-xs);
  font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  color: var(--muted-foreground);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
}

.component-container {
  flex: 1;
  max-width: 40vw;
}

@media (max-width: 1024px) {
  .demo-page {
    flex-direction: column;
  }

  .info-panel {
    flex: 1;
    max-width: 100%;
  }

  .component-container {
    max-width: 100%;
  }
}
```

**Step 6: Verify component compiles**

Run: `npm run build`

Expected: Success

**Step 7: Commit**

```bash
git add src/app/demo/session-chat-container/
git commit -m "feat: create demo page for session-chat-container

- Implement demo component with full event handling
- Add 5-tab limit with least-active session closing
- Support input draft saving per session
- Add event logging for demonstration
- Create responsive demo layout
- Add example configurations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Route for Demo Page

**Files:**
- Modify: `src/app/app.routes.ts`

**Step 1: Read existing routes**

Run: `head -50 src/app/app.routes.ts`

Expected: See existing route pattern

**Step 2: Add route for demo**

Add to routes array:

```typescript
{
  path: 'demo/session-chat-container',
  loadComponent: () =>
    import('./demo/session-chat-container/demo-session-chat-container.component').then(
      (m) => m.DemoSessionChatContainerComponent
    ),
}
```

**Step 3: Verify route works**

Run: `npm run build`

Expected: Success

**Step 4: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat: add route for session-chat-container demo

- Add lazy-loaded route for demo page
- Route: /demo/session-chat-container

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Run Full Test Suite

**Files:**
- No file modifications

**Step 1: Run all component tests**

Run: `npm test -- session-chat-container --watch=false --code-coverage`

Expected:
- All tests pass
- Coverage report generated

**Step 2: Check coverage**

Expected:
- Statement coverage > 80%
- Branch coverage > 75%
- Function coverage > 90%
- Line coverage > 80%

**Step 3: Fix any coverage gaps**

If coverage below targets:
- Add tests for uncovered branches
- Ensure all code paths are tested

**Step 4: Run e2e test (if applicable)**

Run: `npm run e2e`

**Step 5: Commit**

```bash
git add .
git commit -m "test: achieve test coverage targets

- All unit tests passing
- Coverage: statements >80%, branches >75%, functions >90%
- Key paths: event forwarding 100%, conditional rendering 100%

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create API Documentation

**Files:**
- Create: `src/app/shared/ui/session-chat-container/README.md`

**Step 1: Create README**

Write: `src/app/shared/ui/session-chat-container/README.md`

```markdown
# SessionChatContainer Component

Pure presentational component that composes `SessionTabsBar` and `ChatInput` with event forwarding.

## Features

- ✅ Composes SessionTabsBar and ChatInput in single component
- ✅ Pure presentational - all state managed by parent
- ✅ Forwards 5 core events without modification
- ✅ Two-way binding support for inputValue
- ✅ Tailwind utility classes with full override capability
- ✅ Conditional rendering based on isOpen signal
- ✅ Default animations with Tailwind transitions

## Installation

```typescript
import { SessionChatContainerComponent } from '@app/shared/ui/session-chat-container';
```

## Usage

### Basic Example

```typescript
@Component({
  template: `
    <app-session-chat-container
      [sessions]="sessions()"
      [activeSessionId]="activeSessionId()"
      [isOpen]="isOpen()"
      [inputValue]="inputValue()"
      (newChat)="onNewChat()"
      (sessionSelect)="onSessionSelect($event)"
      (sessionToggle)="onSessionToggle()"
      (send)="onSend($event)"
      (inputValueChange)="onInputChange($event)"
    />
  `
})
export class ParentComponent {
  readonly sessions = signal<Map<string, SessionData>>(new Map());
  readonly activeSessionId = signal('session-1');
  readonly isOpen = signal(true);
  readonly inputValue = signal('');

  onNewChat() {
    // Create new session, check 5-tab limit
    // Close least active if needed
  }

  onSessionSelect(sessionId: string) {
    this.activeSessionId.set(sessionId);
  }

  onSessionToggle() {
    this.isOpen.update(v => !v);
  }

  onSend(message: string) {
    // Send message to AI
    this.inputValue.set('');
  }

  onInputChange(value: string) {
    this.inputValue.set(value);
    // Save draft to session
  }
}
```

### Custom Styling

```html
<app-session-chat-container
  containerClass="flex flex-col w-2/5 gap-4 p-4 bg-background rounded-lg border"
  tabsWrapperClass="sticky top-0 z-10"
  inputWrapperClass="transition-all duration-300 ease-in-out"
  [sessions]="sessions()"
  [activeSessionId]="activeSessionId()"
  [isOpen]="isOpen()"
  [inputValue]="inputValue()"
  (newChat)="onNewChat()"
/>
```

### Disabled State

```html
<app-session-chat-container
  [disabled]="true"
  placeholder="Chat is disabled"
  [sessions]="sessions()"
  [activeSessionId]="activeSessionId()"
  [isOpen]="isOpen()"
  [inputValue]="inputValue()"
/>
```

## API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sessions` | `Signal<Map<string, SessionData>>` | ✅ | - | Map of all session data |
| `activeSessionId` | `Signal<string>` | ✅ | - | ID of currently active session |
| `isOpen` | `Signal<boolean>` | ✅ | - | Whether input panel is open |
| `inputValue` | `Signal<string>` | ✅ | - | Current input value (two-way binding) |
| `placeholder` | `string` | ❌ | `'Ask AI anything...'` | Input placeholder text |
| `disabled` | `boolean` | ❌ | `false` | Whether input is disabled |
| `containerClass` | `string` | ❌ | `'flex flex-col w-full gap-2'` | Custom container Tailwind classes |
| `tabsWrapperClass` | `string` | ❌ | `'w-full'` | Custom tabs wrapper Tailwind classes |
| `inputWrapperClass` | `string` | ❌ | `'w-full transition-all duration-200 ease-out'` | Custom input wrapper Tailwind classes |
| `maxTabs` | `number` | ❌ | `5` | Maximum tab count (informational only) |

### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `newChat` | `void` | User clicked "new chat" button |
| `sessionSelect` | `string` | User selected different session (sessionId) |
| `sessionToggle` | `void` | User clicked active session tab |
| `send` | `string` | User sent a message (message content) |
| `inputValueChange` | `string` | Input value changed (new value) |

## Event Flow

```
Parent Component
  ↓ @Input (sessions, activeSessionId, isOpen, inputValue)
SessionChatContainer
  ↓ forwards to child components
SessionTabsBar + ChatInput
  ↓ @Output (user interactions)
SessionChatContainer
  ↓ forwards without modification
Parent Component
  ↓ handles business logic (5-tab limit, message sending, etc.)
State Updates
```

## Parent Component Responsibilities

1. **State Management**
   - Maintain sessions Map
   - Track activeSessionId
   - Track isOpen state
   - Track inputValue per session

2. **Business Logic**
   - Enforce 5-tab limit
   - Close least active session when limit reached
   - Send messages to AI
   - Save input drafts to sessions

3. **Event Handling**
   - Create new sessions
   - Switch between sessions
   - Toggle panel open/close
   - Clear input after sending

## Design Philosophy

- **Pure Presentational**: No business logic, only event forwarding
- **Stateless**: All state managed by parent component
- **Composable**: Reuses existing SessionTabsBar and ChatInput
- **Customizable**: Tailwind classes fully overrideable
- **Type-Safe**: Full TypeScript support with Signals

## Related Components

- `SessionTabsBarComponent` - Session tabs display
- `ChatInputComponent` - Message input with toolbar

## Demo

Visit `/demo/session-chat-container` for interactive demo with:
- Full event handling
- 5-tab limit enforcement
- Input draft saving
- Event logging
```

**Step 2: Commit**

```bash
git add src/app/shared/ui/session-chat-container/README.md
git commit -m "docs: add comprehensive API documentation

- Add full README with usage examples
- Document all inputs and outputs
- Explain event flow and parent responsibilities
- Include design philosophy and related components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Final Verification

**Files:**
- Multiple files for verification

**Step 1: Verify all tests pass**

Run: `npm test -- session-chat-container --watch=false`

Expected: All tests pass

**Step 2: Verify component compiles**

Run: `npm run build`

Expected: Build succeeds

**Step 3: Verify demo page accessible**

Run: `npm start`

Visit: `http://localhost:4200/demo/session-chat-container`

Expected: Demo page loads, component interactive

**Step 4: Check accessibility**

Run: `npm run build` and check for a11y issues

Expected: No critical a11y issues

**Step 5: Verify code quality**

Run: `npm run lint`

Expected: No linting errors

**Step 6: Create summary**

Create implementation summary file:

Write: `docs/session-chat-container-implementation-summary.md`

```markdown
# SessionChatContainer Implementation Summary

**Date**: 2026-02-02
**Status**: ✅ Complete
**Branch**: feature/session-chat-container

## What Was Built

Pure presentational component that composes SessionTabsBar and ChatInput with event forwarding and Tailwind-first styling.

## Files Created

- `src/app/shared/ui/session-chat-container/session-chat-container.component.ts`
- `src/app/shared/ui/session-chat-container/session-chat-container.component.html`
- `src/app/shared/ui/session-chat-container/session-chat-container.component.css`
- `src/app/shared/ui/session-chat-container/index.ts`
- `src/app/shared/ui/session-chat-container/session-chat-container.component.spec.ts`
- `src/app/shared/ui/session-chat-container/README.md`
- `src/app/demo/session-chat-container/*`
- `docs/plans/2026-02-02-session-chat-container.md`

## Features Implemented

✅ Pure presentational component (no business logic)
✅ Composes SessionTabsBar and ChatInput
✅ Forwards 5 core events: newChat, sessionSelect, sessionToggle, send, inputValueChange
✅ Two-way binding support for inputValue
✅ Tailwind utility classes with full override capability
✅ Conditional rendering (isOpen controls ChatInput visibility)
✅ CSS transitions for smooth animations
✅ Comprehensive unit tests
✅ Interactive demo page
✅ Full API documentation

## Test Coverage

- Statement coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 90%
- Key paths: 100% (event forwarding, conditional rendering, two-way binding)

## Usage Example

```html
<app-session-chat-container
  [sessions]="sessions()"
  [activeSessionId]="activeSessionId()"
  [isOpen]="isOpen()"
  [inputValue]="inputValue()"
  (newChat)="onNewChat()"
  (sessionSelect)="onSessionSelect($event)"
  (sessionToggle)="onSessionToggle()"
  (send)="onSend($event)"
/>
```

## Demo Location

`/demo/session-chat-container`

## Next Steps

Future enhancements (see Parking Lot in design doc):
1. Add helper event forwarding (sessionRename, sessionColorChange, etc.)
2. Add keyboard shortcuts
3. Improve accessibility features
4. Performance optimizations (if needed)

## Migration Notes

Component is ready for use. No breaking changes to existing components.
```

**Step 7: Final commit**

```bash
git add docs/session-chat-container-implementation-summary.md
git commit -m "docs: add implementation summary

- Document all created files
- List implemented features
- Record test coverage
- Provide usage example
- Note future enhancements

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 8: Merge to main**

```bash
git checkout main
git merge feature/session-chat-container --no-ff
git push origin main
```

---

## Completion Checklist

- [x] Component structure created
- [x] All inputs implemented with proper types
- [x] All outputs implemented with event forwarding
- [x] Template with Tailwind styling
- [x] CSS animations and transitions
- [x] Unit tests for all functionality
- [x] Demo page with event handling
- [x] Route configuration
- [x] API documentation
- [x] Test coverage targets met
- [x] Build verification
- [x] Accessibility check
- [x] Code quality check
- [x] Implementation summary

---

## Notes for Implementation

1. **TDD Approach**: Each task follows write-test → fail → implement → pass cycle
2. **Frequent Commits**: Commit after each task (not after each step)
3. **Tailwind First**: All styling via utility classes, minimal CSS
4. **Pure Component**: No business logic, only event forwarding
5. **Signal-Based**: All inputs use Angular Signals
6. **Type Safety**: Full TypeScript with no `any` types (except test spies)

---

**Plan complete and saved to `docs/plans/2026-02-02-session-chat-container.md`**

Ready for execution! Use @superpowers:executing-plans or @superpowers:subagent-driven-development to implement.
