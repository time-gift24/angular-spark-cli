# AI Chat Panel Component

A unified AI chat interface with session management for Angular 20+ applications. Part of the Mineral & Time design system.

## Features

- **Multi-Session Management**: Create, switch, rename, and close multiple chat sessions
- **Session Persistence**: All sessions automatically saved to localStorage
- **AI Status Indicators**: Visual feedback for thinking, typing, done, and error states
- **Modern UI**: Liquid-glass effect with Mineral & Time theme
- **Collapsible Panel**: Toggle visibility and collapse message area
- **Floating Toggle Button**: Quick access to open/close the panel
- **Message Actions**: Copy, regenerate, and other actions on AI responses
- **Responsive Design**: Adapts to different screen sizes

## Installation

The component is standalone and ready to use:

```typescript
import { AiChatPanelComponent } from '@app/shared/ui/ai-chat';
```

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { AiChatPanelComponent } from '@app/shared/ui/ai-chat';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [AiChatPanelComponent],
  template: `
    <ai-chat-panel />
  `
})
export class YourComponent {}
```

### Demo Page

Visit `/demo/ai-chat-panel` to see the component in action with full documentation and examples.

## Component Architecture

The AI Chat Panel is composed of several sub-components:

- **SessionTabsBarComponent**: Manages session tabs
- **ChatInputComponent**: Modern pill-style input with file/image/voice buttons
- **ChatMessagesCardComponent**: Displays chat messages with drag/resize support
- **StatusBadgesComponent**: Shows AI status indicators
- **SessionToggleComponent**: Floating toggle button

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
  lastUpdated: number;
  status: SessionStatus;
  color: SessionColor;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  actions?: MessageAction[];
}
```

## State Management

The component uses Angular Signals for reactive state management:

- `isOpen`: Panel visibility
- `isMessagesVisible`: Message area collapsibility
- `sessions`: Map of all sessions
- `activeSessionId`: Current active session
- `inputValue`: Current input text
- `currentBadge`: AI status badge

## Storage

All data is automatically persisted to localStorage:

- `ai-chat-sessions`: All session data
- `ai-chat-active-session`: Current active session ID
- `ai-chat-panel-state`: Panel open/collapsed state

## Customization

### Styling

The component uses CSS variables from the Mineral & Time theme:

```css
--background
--foreground
--primary
--muted
--border
--radius-lg
```

### Theme

The component supports both light and dark modes automatically.

## Interactions

### User Actions

- **Click toggle button**: Open/close panel
- **Click session tab**: Switch to that session
- **Click active tab**: Collapse/expand message area
- **Click new chat**: Create new session
- **Right-click tab**: Context menu (rename, color, close)

### Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in input

## API Integration

To integrate with a real AI API, modify the `simulateAIResponse()` method:

```typescript
private async simulateAIResponse(userMessage: string): Promise<void> {
  this.currentBadge.set({
    id: `badge-${Date.now()}-thinking`,
    type: 'thinking',
    text: 'Thinking...',
  });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: userMessage }),
    });

    const aiResponse = await response.json();

    const aiMessage: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: aiResponse.message,
      timestamp: Date.now(),
    };

    this.addMessage(aiMessage);
    this.currentBadge.set(null);
  } catch (error) {
    // Handle error
  }
}
```

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest

## Dependencies

- Angular 20+
- TypeScript 5.9+
- No external UI library dependencies

## License

Part of the Angular Spark CLI project.
