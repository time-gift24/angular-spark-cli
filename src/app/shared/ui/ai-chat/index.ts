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

// New components
export { AiChatShellComponent } from './ai-chat-shell';
export { AiChatPanelComponent } from './ai-chat-panel';
export { PanelHeaderComponent } from './panel-header';
export { MessageListComponent } from './message-list';
export { MessageBubbleComponent } from './message-bubble';
export { ResizeHandleComponent } from './resize-handle';
export { DeleteConfirmDialogComponent } from './delete-confirm-dialog';

// Services
export { AiChatStateService } from './services';

// Re-export SessionStateService from shared/services
export { SessionStateService } from '@app/shared/services';

export type {
  ChatMessage,
  MessageRole,
  MessageAction,
  BadgeType,
} from './types/chat.types';

// Re-export StatusBadgeType as alias
import type { StatusBadge } from './status-badges/status-badges.component';
export type { StatusBadge as StatusBadgeType };
