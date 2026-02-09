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
import { SessionChatContainerComponent } from '@app/shared/ui/ai-chat';
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
