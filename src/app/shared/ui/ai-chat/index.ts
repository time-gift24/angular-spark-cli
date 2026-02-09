/**
 * AI Chat Components - Public API
 * Mineral & Time Theme - Angular 20+
 */

// Sub-components
export { StatusBadgesComponent } from './status-badges/status-badges.component';
export type { StatusBadge } from './status-badges/status-badges.component';
export { ChatInputComponent } from './chat-input/chat-input.component';
export { SessionToggleComponent } from './session-toggle-button/session-toggle-button.component';
export { SessionTabsBarComponent } from './session-tabs-bar/session-tabs-bar.component';
export { SessionChatContainerComponent } from './session-chat-container/session-chat-container.component';

export type {
  ChatMessage,
  MessageRole,
  MessageAction,
  BadgeType,
} from './types/chat.types';

// Re-export StatusBadgeType as alias
import type { StatusBadge } from './status-badges/status-badges.component';
export type { StatusBadge as StatusBadgeType };
