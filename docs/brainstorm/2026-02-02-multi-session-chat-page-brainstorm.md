# Multi-Session AI Chat Page - Brainstorm Design

**Date**: 2026-02-02
**Topic**: Multi-Session AI Chat Page with Hybrid Docked/Floating Modes
**Status**: Ready for Implementation

---

## Original Intent

Build a multi-session AI chat page based on SessionChatContainer component with the following requirements:

- **SessionChatContainer**: Positioned at bottom-center of the page
- **Chat Messages**: Default to right-side dock, filling full height
- **Multiple Sessions**: Support switching between different AI conversations
- **Hybrid Modes**: Sessions can be either docked (shared right-side area) or floating (independent position/size)

---

## MVP Scope

### ✅ Must Have (MVP)

1. **Page Layout**
   - SessionChatContainer fixed at bottom-center
   - Shared right-side dock area (full height)
   - Main content area for floating sessions

2. **Session State**
   - Add `mode: 'docked' | 'floating'` to SessionData
   - Default new sessions to `mode: 'docked'`
   - Track `position` and `size` (for floating mode)

3. **Message Display Logic**
   - When active session is `docked` → show in right dock area
   - When active session is `floating` → show at its position/size
   - Only active session's messages visible at a time

4. **Session Switching**
   - Clicking session tabs switches active session
   - Messages area updates to show active session's messages
   - Docked sessions all use the same right-side area

### 🔄 Future/Divergent Ideas (Parking Lot)

- **Floating Session UI Controls**: Drag/resize handles for floating sessions
- **Mode Toggle Button**: UI to switch between docked/floating per session
- **Multi-Session Visibility**: See multiple floating sessions simultaneously
- **Dock Zone Highlighting**: Visual feedback when dragging over dock zone
- **Smooth Animations**: Transitions when switching between docked/floating
- **Persistence**: Save floating positions across page reloads
- **Minimize/Expand**: Collapse floating sessions to tabs
- **Keyboard Shortcuts**: Quick docking/undocking via hotkeys

---

## Architecture

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Main Content Area                                      │
│  (Floating sessions render here when active)            │
│                                                         │
│  ┌─────────────┐                                       │
│  │ Floating    │  (only when active session is         │
│  │ Session     │   mode='floating' and has position)   │
│  │ Messages    │                                       │
│  └─────────────┘                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ┌──────────────┐
                    │ Right Dock   │ ← Full height, fixed
                    │ Area         │
                    │ (Shared by   │   Shows when active
                    │  all docked  │   session is mode='docked'
                    │  sessions)   │
                    └──────────────┘
                    ┌───────────────────────┐
                    │ SessionChatContainer  │ ← Bottom center
                    │ (Tabs + Input)        │   Fixed position
                    └───────────────────────┘
```

### Component Hierarchy

```
MultiSessionChatPage (Smart Component)
  ├─ SessionChatContainer (Dumb, reused)
  │    ├─ SessionTabsBar
  │    └─ ChatInput
  │
  ├─ DockedMessagesArea (New)
  │    └─ ChatMessagesCard (reused)
  │         (Displays active docked session)
  │
  └─ FloatingSessionRenderer (New)
       └─ ChatMessagesCard (reused)
            (Displays active floating session)
```

### Responsibility Split

**MultiSessionChatPage** (Smart Component):
- Manages all session state (`sessions`, `activeSessionId`, `isOpen`, `inputValue`)
- Determines which display mode to use based on `activeSession.mode`
- Routes messages to DockedMessagesArea OR FloatingSessionRenderer
- Handles all session operations (create, switch, toggle mode, etc.)

**DockedMessagesArea** (Dumb Component):
- Pure presentational wrapper for right-side dock
- Receives active session's messages as `@Input`
- Fixed position: `position: fixed; right: 0; top: 0; bottom: [container-height]`

**FloatingSessionRenderer** (Dumb Component):
- Conditional wrapper that only renders when active session is floating
- Applies `position: absolute` with session's x/y coordinates
- Applies session's width/height

**SessionChatContainer** (Existing, reused):
- No changes needed
- Positioned at bottom center via page-level CSS

---

## Data Flow

### State Structure

```typescript
SessionData {
  id: string
  name: string
  messages: ChatMessage[]
  inputValue: string
  mode: 'docked' | 'floating'        // NEW
  position: { x: number; y: number }  // Used when mode='floating'
  size: { width: number; height: number }
  lastUpdated: number
  status: SessionStatus
  color: SessionColor
}

Page State {
  sessions: Map<string, SessionData>
  activeSessionId: string
  isOpen: boolean              // Panel open/closed
  inputValue: string           // Current input value
}
```

### Session Switching Flow

```
User clicks session tab
  ↓
onSessionSelect(sessionId)
  ↓
Save current inputValue → active session
  ↓
Update activeSessionId = sessionId
  ↓
Load inputValue ← new active session
  ↓
Check new active session's mode
  ├─ mode='docked' → Show DockedMessagesArea, hide FloatingSessionRenderer
  └─ mode='floating' → Show FloatingSessionRenderer, hide DockedMessagesArea
  ↓
Scroll messages to bottom
```

### Message Sending Flow

```
User types message + clicks send
  ↓
onSend(message)
  ↓
Create user message object
  ↓
Add to active session's messages array
  ↓
Clear inputValue
  ↓
Trigger AI response (async)
  ↓
Add AI message to active session
  ↓
Scroll to bottom
```

### Mode Toggle Flow (Future, but planned in state)

```
User clicks "dock/float" toggle button
  ↓
onToggleMode(sessionId)
  ↓
Get session by sessionId
  ↓
Update session.mode:
  - 'docked' → 'floating' (set default x/y if none)
  - 'floating' → 'docked'
  ↓
If this is the active session, re-render messages area
  ↓
Save to storage
```

### Conditional Rendering Logic

```typescript
// MultiSessionChatPage computed signals
readonly activeSession = computed(() =>
  this.sessions().get(this.activeSessionId())
)

readonly activeMode = computed(() =>
  this.activeSession()?.mode || 'docked'
)

readonly shouldShowDocked = computed(() =>
  this.isOpen() && this.activeMode() === 'docked'
)

readonly shouldShowFloating = computed(() =>
  this.isOpen() && this.activeMode() === 'floating'
)
```

### Template Binding

```html
<!-- Docked Area (right side) -->
@if (shouldShowDocked()) {
  <app-docked-messages-area
    [messages]="activeSession()?.messages || []"
    [sessionId]="activeSessionId()"
  />
}

<!-- Floating Renderer (absolute positioned) -->
@if (shouldShowFloating()) {
  <app-floating-session-renderer
    [session]="activeSession()"
    [messages]="activeSession()?.messages || []"
  />
}

<!-- Container (bottom center) -->
<app-session-chat-container
  [sessions]="sessions()"
  [activeSessionId]="activeSessionId()"
  [isOpen]="isOpen()"
  [inputValue]="inputValue()"
  (newChat)="onNewChat()"
  (sessionSelect)="onSessionSelect($event)"
  (send)="onSend($event)"
/>
```

---

## Error Logic & Edge Cases

### Edge Case Handling

**1. First Session Creation**
```
Page loads
  ↓
Check sessions.size === 0?
  ├─ Yes → Create default session:
  │         - mode: 'docked'
  │         - name: 'New Chat'
  │         - position: { x: 100, y: 100 } (unused but set)
  │         - size: { width: 400, height: 500 }
  └─ No → Load from storage
```

**2. Switching to Floating Session Without Position**
```
User selects session with mode='floating' but no valid position
  ↓
Check session.position exists && is within viewport?
  ├─ No → Apply default fallback:
  │         - position: { x: 100, y: 100 }
  │         - size: { width: 400, height: 500 }
  └─ Yes → Use stored position
```

**3. Session Switch During AI Response**
```
User switches session while AI is generating response
  ↓
Current approach: AI response completes and adds to original session
  ↓
User doesn't see the response until they switch back
  ↓
Future enhancement: Cancel in-flight request
```

**4. Exceeding Session Limit**
```
User clicks "new chat" when sessions.size >= 5
  ↓
Identify least active session:
  - Sort by lastUpdated (oldest first)
  - OR sort by message count (fewest first)
  ↓
Remove least active session
  ↓
Create new session
  ↓
Notify user: "Closed least active session to make room"
```

**5. Sending Message in Closed Panel**
```
Panel is closed (isOpen = false)
  ↓
User tries to send message
  ↓
Validation: !isOpen → ignore send
  ↓
User must first click active tab to open panel
```

**6. Storage Failure**
```
localStorage quota exceeded / unavailable
  ↓
Try-catch in saveToStorage()
  ↓
Log error: "Failed to save sessions to storage"
  ↓
Continue with in-memory state (degraded experience)
  ↓
Show user toast: "Changes won't be saved (storage error)"
```

**7. Invalid Session ID**
```
User action references non-existent sessionId
  ↓
Guard: this.sessions().get(sessionId)
  ↓
If undefined:
  - Log error: "Session not found: {sessionId}"
  - Ignore action OR reset to first available session
```

**8. Floating Session Off-Screen**
```
Floating session position is outside viewport
  ↓
On render, check boundaries:
  - position.x < 0 → clamp to 0
  - position.y < 0 → clamp to 0
  - position.x + width > viewport → shift left
  - position.y + height > viewport → shift up
  ↓
Auto-correct to visible area
```

### Validation Rules

```typescript
// Session creation validation
function validateNewSession(sessions: Map<string, SessionData>): boolean {
  // Enforce 5-session limit
  if (sessions.size >= 5) {
    console.warn('Cannot create session: limit reached');
    return false;
  }
  return true;
}

// Message send validation
function validateSend(sessionId: string, message: string): boolean {
  if (!sessionId) {
    console.warn('Cannot send: no active session');
    return false;
  }
  if (!message.trim()) {
    console.warn('Cannot send: empty message');
    return false;
  }
  return true;
}

// Position validation
function validatePosition(pos: {x: number, y: number}): {x: number, y: number} {
  const maxX = window.innerWidth - 400; // Min width 400
  const maxY = window.innerHeight - 300; // Min height 300

  return {
    x: Math.max(0, Math.min(pos.x, maxX)),
    y: Math.max(0, Math.min(pos.y, maxY))
  };
}
```

### Error Recovery Strategies

| Error Type | Recovery Strategy | User Feedback |
|------------|-------------------|---------------|
| Storage failure | Continue in-memory | Toast notification |
| Session limit reached | Close least active | Auto-close + log |
| Invalid position | Clamp to viewport | Silent correction |
| Missing session data | Create default | Silent recovery |
| Empty message | Block send | Input validation |

---

## Testing Strategy

### Unit Test Scenarios

**MultiSessionChatPage Component**
```typescript
describe('MultiSessionChatPage', () => {
  // State management
  ✓ Should create default session on init
  ✓ Should load sessions from storage
  ✓ Should switch active session
  ✓ Should preserve input when switching sessions
  ✓ Should enforce 5-session limit on new chat

  // Mode detection
  ✓ Should detect docked mode correctly
  ✓ Should detect floating mode correctly
  ✓ Should show docked area when mode='docked'
  ✓ Should show floating renderer when mode='floating'

  // Message handling
  ✓ Should add user message on send
  ✓ Should clear input after send
  ✓ Should add AI response to messages
  ✓ Should scroll to bottom after new message

  // Storage
  ✓ Should save sessions to storage on change
  ✓ Should save panel state on toggle
  ✓ Should handle storage errors gracefully
})
```

**DockedMessagesArea Component**
```typescript
describe('DockedMessagesArea', () => {
  ✓ Should render received messages
  ✓ Should display session name
  ✓ Should apply correct CSS classes
  ✓ Should emit message action events
  ✓ Should handle empty message list
})
```

**FloatingSessionRenderer Component**
```typescript
describe('FloatingSessionRenderer', () => {
  ✓ Should apply position from session data
  ✓ Should apply size from session data
  ✓ Should render messages
  ✓ Should handle missing position (fallback to default)
  ✓ Should clamp position to viewport bounds
})
```

### Integration Test Scenarios

```typescript
describe('MultiSessionChat Integration', () => {
  // Session lifecycle
  ✓ Should create session → send message → switch → preserve state
  ✓ Should switch between docked and floating sessions
  ✓ Should maintain separate input values per session
  ✓ Should close least active session when limit reached

  // Mode switching
  ✓ Should display docked session in right area
  ✓ Should display floating session at position
  ✓ Should re-render when switching modes

  // Message flow
  ✓ Should send message → receive AI response → save to storage
  ✓ Should show AI response only in active session
  ✓ Should preserve messages when switching sessions
})
```

### E2E Test Scenarios

```typescript
describe('Multi-Session Chat E2E', () => {
  // Basic workflow
  ✓ User opens page → sees default docked session
  ✓ User sends message → sees response in docked area
  ✓ User creates new session → sees it appear in tabs
  ✓ User switches sessions → sees correct messages

  // Mode behavior
  ✓ User sends message in docked mode → sees right-side display
  ✓ User switches to floating session → sees positioned card
  ✓ User switches back to docked → sees right-side display again

  // Session management
  ✓ User creates 5 sessions → sees limit enforced
  ✓ User creates 6th session → least active closes
  ✓ User renames session → sees updated name in tab

  // Persistence
  ✓ User sends messages → refreshes page → sees messages restored
  ✓ User changes session mode → refreshes → mode preserved
  ✓ User closes panel → refreshes → panel state preserved
})
```

### Test Data Fixtures

```typescript
// Mock session data
const mockDockedSession: SessionData = {
  id: 'session-1',
  name: 'Docked Chat',
  mode: 'docked',
  position: { x: 100, y: 100 },
  size: { width: 400, height: 500 },
  messages: [
    { id: 'msg-1', role: 'user', content: 'Hello', timestamp: Date.now() },
    { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
  ],
  inputValue: '',
  lastUpdated: Date.now(),
  status: 'idle',
  color: 'default'
}

const mockFloatingSession: SessionData = {
  ...mockDockedSession,
  id: 'session-2',
  name: 'Floating Chat',
  mode: 'floating'
}
```

---

## Design Decisions

### Why Option 1: Session Mode State?

We chose to add a `mode` property to each session over:
- **Option 2**: Position-based inference (less explicit)
- **Option 3**: Separate dock manager (more complex)

**Benefits**:
- Clear mental model - sessions explicitly declare their mode
- Easy to toggle between docked/floating via UI (future feature)
- Straightforward state logic
- Easy to persist and restore session layouts

---

## Implementation Notes

### Key Files to Create/Modify

**New Components**:
- `src/app/features/multi-session-chat/`
  - `multi-session-chat-page.component.ts`
  - `multi-session-chat-page.component.html`
  - `multi-session-chat-page.component.css`
- `src/app/shared/ui/docked-messages-area/`
  - `docked-messages-area.component.ts`
  - `docked-messages-area.component.html`
  - `docked-messages-area.component.css`
- `src/app/shared/ui/floating-session-renderer/`
  - `floating-session-renderer.component.ts`
  - `floating-session-renderer.component.html`
  - `floating-session-renderer.component.css`

**Modify Existing**:
- `src/app/shared/models/session.interface.ts` - Add `mode` property
- `src/app/app.routes.ts` - Add route for new page

### Design System Integration

- Use existing "矿物与时光" (Mineral & Time) theme colors
- Follow ultra-compact sizing system
- Use Figtree font family
- Apply liquid-glass effects for panels
- Maintain OKLCH color space for consistency

---

## Next Steps

1. ✅ Design complete and documented
2. ⏭️ Create git worktree for isolated development
3. ⏭️ Generate detailed implementation plan
4. ⏭️ Implement components following Angular 20+ patterns
5. ⏭️ Add comprehensive tests
6. ⏭️ Deploy and validate

---

**Design Status**: ✅ Ready for Implementation
