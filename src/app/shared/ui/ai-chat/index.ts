/**
 * AI Chat Components - Public API
 * Mineral & Time Theme - Angular 20+
 */

// Main Panel Component
export { AiChatPanelComponent } from './ai-chat-panel/ai-chat-panel.component';

// Sub-components
export { ChatMessagesCardComponent } from './chat-messages-card/chat-messages-card.component';
export { StatusBadgesComponent } from './status-badges/status-badges.component';
export type { StatusBadge } from './status-badges/status-badges.component';
export { ChatInputComponent } from './chat-input/chat-input.component';
export { SessionToggleComponent } from './session-toggle-button/session-toggle-button.component';

// Directives
export { DragHandleDirective } from './directives/drag-handle.directive';
export { ResizeHandleDirective } from './directives/resize-handle.directive';

// Services
export { AiChatStorageService } from './services/ai-chat-storage.service';

export type {
  ChatMessage,
  MessageRole,
  MessageAction,
  BadgeType,
  PanelPosition,
  PanelSize,
  AiChatPanelPreferences,
} from './types/chat.types';

// Re-export StatusBadgeType as alias
import type { StatusBadge } from './status-badges/status-badges.component';
export type { StatusBadge as StatusBadgeType };

export {
  DEFAULT_PANEL_POSITION,
  DEFAULT_PANEL_SIZE,
  MIN_PANEL_SIZE,
  MAX_PANEL_SIZE,
  AI_CHAT_STORAGE_KEY,
} from './types/chat.types';
