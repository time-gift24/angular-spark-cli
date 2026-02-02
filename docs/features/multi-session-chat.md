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
