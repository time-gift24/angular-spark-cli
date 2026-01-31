# AI Chat Panel Refactor - Continuation Prompt

## 📌 Current Status

**Progress:** 14/27 tasks complete (51.9%)
**Branch:** `feature/ai-chat-panel-refactor`
**Working Directory:** `/Users/wanyaozhong/Projects/angular-spark-cli/.worktrees/ai-chat-panel-refactor`
**Latest Commits:**
- `4cd350e` - feat: complete ChatInputComponent with auto-expand and styling
- `ae2bb13` - style: add SessionTabsBar styling with design tokens
- `0a18d0a` - fix: address code review feedback for SessionTabsBar component
- `df8eeb1` - fix: address critical code review feedback for SessionStorageService
- `bad9d35` - feat: implement Storage Sync Effect for SessionStateService

---

## ✅ Completed Work

### Phase 1: Core Domain Models (P1) - 4 tasks ✅
- P1-T1.1: Chat Message Interface (`src/app/shared/models/chat-message.interface.ts`)
- P1-T1.2: Session Data Interface (`src/app/shared/models/session-data.interface.ts`)
- P1-T1.3: Panel State Interface (`src/app/shared/models/panel-state.interface.ts`)
- P1-T1.4: Component Input/Output Interfaces (`src/app/shared/models/ai-chat-panel.interface.ts`)

### Phase 2: State Management Layer (P2) - 2 tasks ✅
- P2-T2.1: Session State Service (`src/app/shared/services/session-state.service.ts`)
  - 72 tests passing
  - Uses Angular Signals for reactive state
  - Storage sync effect integrated
- P2-T2.2: ID Generator Utility (`src/app/shared/utils/id-generator.util.ts`)
  - Collision detection for unique IDs

### Phase 3: Session Storage Service (P3) - 2 tasks ✅
- P3-T3.1: Session Storage Service (`src/app/shared/services/session-storage.service.ts`)
  - 43 tests passing
  - localStorage persistence with privacy mode handling
- P3-T3.2: Storage Sync Effect
  - Integrated into SessionStateService
  - 500ms debounce for performance

### Phase 4: Session Tabs Bar Component (P4) - 2 tasks ✅
- P4-T4.1: Component Definition (`src/app/shared/ui/session-tabs-bar/`)
  - 36 tests passing
  - Signal-based inputs and computed signals
- P4-T4.2: Styling
  - Full mineral & time design system
  - Fixed positioning at bottom center
  - Accessibility features (focus states, ARIA attributes)

### Phase 5: Chat Input Component (P5) - 4 tasks ✅
- P5-T5.1: Component Definition (`src/app/shared/ui/chat-input/`)
  - 34 tests passing (23 basic + 11 enhancements)
- P5-T5.2: Auto-Expanding Textarea Logic
  - MIN_HEIGHT: 24px, MAX_HEIGHT: 120px
  - Automatic height adjustment based on content
- P5-T5.3: Keyboard Interactions
  - Enter to send, Shift+Enter for newline
- P5-T5.4: Styling
  - Fixed positioning at bottom (above tabs)
  - 600px width, compact design

---

## 📋 Remaining Tasks (13 tasks)

### Phase 6: Chat Messages Card Component (P6) - 3 tasks
**Dependencies:** P5 (Chat Input)
**Location:** `src/app/shared/ui/chat-messages-card/`

#### P6-T6.1: Component Definition
**Output:**
- `chat-messages-card.component.ts`
- `chat-messages-card.component.html`
- `chat-messages-card.component.css`

**Interface:**
```typescript
@Component({ ... })
export class ChatMessagesCardComponent {
  @Input() messages: Signal<ChatMessage[]>;
  @Input() isVisible: Signal<boolean>;
  @Input() position: Signal<PanelPosition>;
  @Input() size: Signal<PanelSize>;
  @Output() positionChange = new EventEmitter<PanelPosition>();
  @Output() sizeChange = new EventEmitter<PanelSize>();

  readonly messageListRef = viewChild<ElementRef<HTMLDivElement>>('messageList');

  scrollToBottom(): void;
  private smoothScrollToBottom(): void;
}
```

**Template Structure:**
```html
<div
  [class.visible]="isVisible()"
  [style.left.px]="position().x"
  [style.top.px]="position().y"
  [style.width.px]="size().width"
  [style.height.px]="size().height"
  class="messages-card"
>
  <div class="drag-handle" appDragHandle>
    <span class="drag-icon">≡ ≡ ≡</span>
  </div>

  <div #messageList class="message-list">
    @for (message of messages(); track message.id) {
      <div [class.role]="message.role" class="message">
        <div class="message-content">{{ message.content }}</div>
        <div class="message-timestamp">{{ message.timestamp | date:'short' }}</div>
      </div>
    }
  </div>

  <div class="resize-handle" appResizeHandle></div>
</div>
```

#### P6-T6.2: Message List Scroll Behavior
**Responsibilities:**
- Auto-scroll to bottom on new message
- Preserve scroll position on session switch
- Smooth scroll animation

**Interface:**
```typescript
scrollToBottom(behavior: 'smooth' | 'auto' = 'smooth'): void;
private getScrollContainer(): HTMLElement | null;
```

#### P6-T6.3: Styling
**CSS Design Tokens** (from plan lines 560-623):
```css
.messages-card {
  position: fixed;
  bottom: calc(var(--spacing-xl) * 5);  /* ~80px */
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  border-radius: var(--radius-xl);
  background: var(--card / 90%);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: opacity var(--duration-slow) ease,
              transform var(--duration-slow) ease;
}

.messages-card:not(.visible) {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

.message.role-user {
  align-self: flex-end;
  background: var(--primary / 15%);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}

.message.role-assistant {
  align-self: flex-start;
  background: var(--muted);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}
```

---

### Phase 7: Drag & Resize Directives (P7) - 3 tasks
**Independence:** High (can work in parallel with P6)
**Location:** `src/app/shared/directives/`

#### P7-T7.1: DragHandleDirective
**Output:** `src/app/shared/directives/drag-handle.directive.ts`

**Responsibilities:**
- Handle mouse events for dragging
- Update position in real-time
- Emit position changes
- Disable transitions during drag

**Interface:**
```typescript
@Directive({ selector: '[appDragHandle]' })
export class DragHandleDirective implements OnInit, OnDestroy {
  @Input() position!: Signal<PanelPosition>;
  @Output() positionChange = new EventEmitter<PanelPosition>();
  @Output() dragStart = new EventEmitter<void>();
  @Output() dragEnd = new EventEmitter<void>();

  private isDragging = false;
  private startPosition!: PanelPosition;
  private startMousePosition!: { x: number; y: number };

  ngOnInit(): void;
  ngOnDestroy(): void;
  private onMouseDown(event: MouseEvent): void;
  private onMouseMove(event: MouseEvent): void;
  private onMouseUp(): void;
}
```

#### P7-T7.2: ResizeHandleDirective
**Output:** `src/app/shared/directives/resize-handle.directive.ts`

**Responsibilities:**
- Handle mouse events for resizing
- Enforce min/max constraints
- Emit size changes
- Disable transitions during resize

**Interface:**
```typescript
@Directive({ selector: '[appResizeHandle]' })
export class ResizeHandleDirective implements OnInit, OnDestroy {
  @Input() size!: Signal<PanelSize>;
  @Input() minSize = { width: 300, height: 200 };
  @Input() maxSize = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.7 };
  @Output() sizeChange = new EventEmitter<PanelSize>();
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resizeEnd = new EventEmitter<void>();

  private isResizing = false;
  private startSize!: PanelSize;
  private startMousePosition!: { x: number; y: number };

  ngOnInit(): void;
  ngOnDestroy(): void;
  private onMouseDown(event: MouseEvent): void;
  private onMouseMove(event: MouseEvent): void;
  private onMouseUp(): void;
  private clamp(value: number, min: number, max: number): number;
}
```

#### P7-T7.3: Constraint Constants
**Output:** `src/app/shared/constants/constraints.const.ts`

```typescript
export const PANEL_CONSTRAINTS = {
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  MAX_WIDTH_RATIO: 0.9,
  MAX_HEIGHT_RATIO: 0.7,
  DEFAULT_SIZE: {
    width: 600,
    height: 400
  },
  DEFAULT_POSITION: {
    x: 0,
    y: 0
  }
} as const;
```

---

### Phase 8: Root Orchestrator Component (P8) - 4 tasks
**Dependencies:** P4, P5, P6, P7
**Location:** `src/app/shared/ui/ai-chat-panel/`

#### P8-T8.1: Component Definition
**Output:**
- `ai-chat-panel.component.ts`
- `ai-chat-panel.component.html`
- `ai-chat-panel.component.css`

**Interface:**
```typescript
@Component({ ... })
export class AiChatPanelComponent {
  @Input() apiEndpoint?: string;
  @Output() messageSend = new EventEmitter<ChatMessage>();
  @Output() sessionChange = new EventEmitter<string>();
  @Output() panelToggle = new EventEmitter<boolean>();

  private sessionState = inject(SessionStateService);
  private storage = inject(SessionStorageService);

  readonly sessions = this.sessionState.sessions;
  readonly activeSessionId = this.sessionState.activeSessionId;
  readonly isMessagesVisible = this.sessionState.isMessagesVisible;
  readonly activeSession = this.sessionState.activeSession;

  ngOnInit(): void;
  sendMessage(): void;
  switchSession(sessionId: string): void;
  toggleMessagesVisibility(): void;
}
```

**Template Structure:**
```html
<div class="ai-chat-panel">
  <app-chat-messages-card
    [messages]="sessionState.activeMessages()"
    [isVisible]="isMessagesVisible()"
    [position]="activeSession()!.position"
    [size]="activeSession()!.size"
    (positionChange)="updatePosition($event)"
    (sizeChange)="updateSize($event)"
  />

  <app-session-tabs-bar
    [sessions]="sessions()"
    [activeSessionId]="activeSessionId()"
    (sessionSelect)="switchSession($event)"
    (sessionToggle)="toggleMessagesVisibility()"
  />

  <app-chat-input
    [inputValue]="sessionState.activeInputValue()"
    [canSend]="sessionState.canSendMessage()"
    (inputChange)="sessionState.updateInputValue($event)"
    (messageSend)="sendMessage()"
  />
</div>
```

#### P8-T8.2: Initialization Logic
**Responsibilities:**
- Load sessions from localStorage or create defaults
- Set up storage sync effect
- Initialize default session if none exists

#### P8-T8.3: Position & Size Persistence
**Responsibilities:**
- Update session position/size on drag/resize
- Persist changes to session state
- Emit events for external consumers

#### P8-T8.4: Styling
```css
.ai-chat-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;  /* Allow click-through to page */
}

.ai-chat-panel > * {
  pointer-events: auto;  /* Re-enable clicks for children */
}
```

---

### Phase 9: Demo Page Integration (P9) - 3 tasks
**Dependencies:** All phases
**Location:** `src/app/demo/ai-chat-panel/`

#### P9-T9.1: Demo Page Component
**Output:**
- `demo-ai-chat-panel.component.ts`
- `demo-ai-chat-panel.component.html`
- `demo-ai-chat-panel.component.css`

**Interface:**
```typescript
@Component({ ... })
export class DemoAiChatPanelComponent {
  readonly apiEndpoint = signal('/api/chat');
  readonly messageHistory = signal<ChatMessage[]>([]);

  handleMessageSend(message: ChatMessage): void {
    this.messageHistory.update(messages => [...messages, message]);
    this.simulateAIResponse(message);
  }

  handleSessionChange(sessionId: string): void {
    console.log('Session changed to:', sessionId);
  }

  handlePanelToggle(isVisible: boolean): void {
    console.log('Panel toggled:', isVisible);
  }

  private simulateAIResponse(userMessage: ChatMessage): void;
}
```

**Template:**
```html
<div class="demo-container">
  <header class="demo-header">
    <h1>AI Chat Panel Demo</h1>
    <p>Multiple sessions with always-visible input and session tabs</p>
  </header>

  <main class="demo-content">
    <section class="instructions">
      <h2>Features</h2>
      <ul>
        <li>✅ Session tabs always visible at bottom</li>
        <li>✅ Input box always ready</li>
        <li>✅ Click session tab to switch sessions</li>
        <li>✅ Click active tab to toggle messages card</li>
        <li>✅ Drag messages card by top handle</li>
        <li>✅ Resize messages card from bottom-right</li>
        <li>✅ Per-session position and size memory</li>
        <li>✅ localStorage persistence</li>
      </ul>
    </section>

    <app-ai-chat-panel
      [apiEndpoint]="apiEndpoint()"
      (messageSend)="handleMessageSend($event)"
      (sessionChange)="handleSessionChange($event)"
      (panelToggle)="handlePanelToggle($event)"
    />
  </main>
</div>
```

#### P9-T9.2: Demo Page Routing
**Update:** `src/app/app.routes.ts`
```typescript
{
  path: 'demo/ai-chat-panel',
  loadComponent: () => import('./demo/ai-chat-panel/demo-ai-chat-panel.component')
    .then(m => m.DemoAiChatPanelComponent)
}
```

#### P9-T9.3: Demo Page Styling
Use mineral & time design tokens (refer to CLAUDE.md)

---

## 🎯 Continue Execution Plan

### Recommended Order:

1. **Start with P7 (Drag & Resize Directives)**
   - High independence, can work in parallel with P6
   - 3 tasks: Drag directive, Resize directive, Constants
   - Foundation for interactive features

2. **Then P6 (Chat Messages Card)**
   - Depends on P5 (complete)
   - 3 tasks: Component, Scroll behavior, Styling
   - Core display component

3. **Then P8 (Root Orchestrator)**
   - Depends on P4, P5, P6, P7
   - 4 tasks: Component, Init, Persistence, Styling
   - Integrates all components

4. **Finally P9 (Demo Page)**
   - Depends on all phases
   - 3 tasks: Component, Routing, Styling
   - Demonstrates full functionality

---

## 🛠️ Workflow to Follow

### For Each Task:

1. **Use `superpowers:subagent-driven-development` skill**
   - Read the skill instructions first
   - Follow the process: implement → spec review → code review

2. **Dispatch Implementer Subagent**
   - Use Task tool with `general-purpose` subagent
   - Provide full task description from this document
   - Include context about dependencies
   - Request: tests, commit, self-review

3. **Dispatch Spec Compliance Reviewer**
   - Use Task tool with `general-purpose` subagent
   - Verify implementation matches requirements
   - Check for missing or extra features

4. **Dispatch Code Quality Reviewer**
   - Use `superpowers:code-reviewer` skill
   - Review git diff for issues
   - Categorize by severity (Critical/Important/Minor)

5. **Fix Issues If Found**
   - Dispatch implementer to fix
   - Re-review if needed
   - Only mark complete when approved

6. **Update Todo List**
   - Use TodoWrite tool to track progress
   - Mark tasks as completed

---

## 📦 Technical Stack

- **Framework:** Angular 20+
- **State Management:** Angular Signals (computed, effect, inject)
- **Testing:** Vitest + Angular Test Bed
- **Styling:** Tailwind CSS v4 with CSS variables
- **Design System:** "矿物与时光" (Mineral & Time) - Chinese rock mineral theme
- **TypeScript:** Strict mode enabled
- **Build:** Angular CLI

---

## 🎨 Design System Reference

### Color Theme (Light Mode)
- `--primary`: 石绿 Malachite `oklch(0.48 0.07 195)`
- `--background`: 绢黄 Aged Silk `oklch(0.91 0.015 85)`
- `--foreground`: 深灰 `oklch(0.28 0.03 185)`
- `--card`: 浅绢黄 `oklch(0.94 0.015 85)`
- `--muted`: 柔和背景 `oklch(0.92 0.02 85)`

### Sizing
- `--spacing-xs`: 0.125rem (2px)
- `--spacing-sm`: 0.25rem (4px)
- `--spacing-md`: 0.5rem (8px)
- `--spacing-lg`: 0.75rem (12px)
- `--spacing-xl`: 1rem (16px)

- `--radius-sm`: 3px
- `--radius-md`: 4px
- `--radius-lg`: 5px
- `--radius-xl`: 6px

### Typography
- **Font:** Figtree (@fontsource/figtree)
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Principle:** Ultra compact, lightweight (400-500), avoid 600+

---

## 📝 Key Implementation Patterns

### Component Pattern
```typescript
@Component({
  selector: 'app-xxx',
  standalone: true,
  imports: [CommonModule, ...],
  templateUrl: './xxx.component.html',
  styleUrl: './xxx.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XxxComponent {
  @Input({ required: true })
  inputSignal!: Signal<Type>;

  @Output()
  readonly outputEvent = new EventEmitter<Type>();

  readonly computed = computed(() => {
    const value = this.inputSignal();
    // Compute derived state
    return result;
  });
}
```

### Service Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class XxxService {
  private state = signal(initialState);
  readonly state = this.state.asReadonly();

  readonly computed = computed(() => {
    // Derived state
  });

  constructor() {
    effect(() => {
      // Auto-sync or side effects
    });
  }
}
```

### Testing Pattern
```typescript
describe('XxxComponent', () => {
  let component: XxxComponent;
  let fixture: ComponentFixture<XxxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XxxComponent],
      // Add providers, mocks, etc.
    }).compileComponents();

    fixture = TestBed.createComponent(XxxComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

---

## 🔍 Important Notes

1. **Always use CSS variables** - No hardcoded colors, spacing, or radii
2. **Follow Angular Signals patterns** - Use computed(), effect(), inject()
3. **Write comprehensive tests** - Follow the example set by previous tasks
4. **Use standalone components** - Angular 20+ pattern
5. **Commit frequently** - Each task should have its own commit
6. **Follow YAGNI** - Only build what's specified, avoid over-engineering
7. **Use the TodoWrite tool** - Track progress throughout

---

## 📂 File Structure Reference

```
src/app/shared/
├── models/
│   ├── chat-message.interface.ts ✅
│   ├── session-data.interface.ts ✅
│   ├── panel-state.interface.ts ✅
│   └── ai-chat-panel.interface.ts ✅
├── services/
│   ├── session-state.service.ts ✅
│   └── session-storage.service.ts ✅
├── utils/
│   └── id-generator.util.ts ✅
├── ui/
│   ├── session-tabs-bar/ ✅
│   ├── chat-input/ ✅
│   ├── chat-messages-card/ ⏳ (P6 - next)
│   └── ai-chat-panel/ ⏳ (P8)
├── directives/
│   ├── drag-handle.directive.ts ⏳ (P7)
│   └── resize-handle.directive.ts ⏳ (P7)
└── constants/
    └── constraints.const.ts ⏳ (P7)

src/app/demo/
└── ai-chat-panel/ ⏳ (P9)
```

---

## 🚀 Start Here

To continue the implementation:

1. **Invoke the skill:**
   ```
   Use skill: superpowers:subagent-driven-development
   ```

2. **Start with P7-T7.1 (DragHandleDirective):**
   - It has high independence
   - Can be worked in parallel with P6
   - Provides foundation for P8 integration

3. **Follow the workflow** for each task as described above

4. **Track progress** with TodoWrite tool

Good luck! The foundation is solid (51.9% complete). Continue the excellent work! 🎉
