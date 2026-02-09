/**
 * AI Chat Type Definitions
 * Mineral & Time Theme - Angular 20+
 */

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message interface
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  actions?: MessageAction[];
}

/**
 * Message action button (in AI responses)
 */
export interface MessageAction {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

/**
 * Badge type for status indicators
 */
export type BadgeType = 'thinking' | 'typing' | 'done' | 'error';

/**
 * Badge data
 */
export interface StatusBadge {
  id: string;
  type: BadgeType;
  text?: string;
}
