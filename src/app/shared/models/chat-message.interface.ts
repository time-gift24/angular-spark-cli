/**
 * Represents the role of a message sender in the chat system.
 */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/**
 * Represents a single chat message in the conversation.
 *
 * This is the foundational domain model for all chat messages in the AI chat panel.
 * Each message contains content, metadata, and optional actions that can be performed on it.
 *
 * @example
 * ```typescript
 * const userMessage: ChatMessage = {
 *   id: 'msg-123',
 *   role: 'user',
 *   content: 'Hello, how can you help me?',
 *   timestamp: Date.now(),
 * };
 *
 * const assistantMessage: ChatMessage = {
 *   id: 'msg-456',
 *   role: 'assistant',
 *   content: 'I can help you with...',
 *   timestamp: Date.now(),
 *   actions: [
 *     {
 *       id: 'copy',
 *       label: 'Copy',
 *       icon: 'lucide_copy',
 *       callback: () => copyToClipboard(message.content),
 *     },
 *   ],
 * };
 * ```
 */
export interface ChatMessage {
  /**
   * Unique identifier for the message.
   * Used for tracking and referencing messages throughout the system.
   */
  id: string;

  /**
   * The role of the entity that sent this message.
   * - 'user': Messages sent by the human user
   * - 'assistant': Responses from the AI assistant
   * - 'system': System messages (e.g., error messages, notifications)
   */
  role: ChatMessageRole;

  /**
   * The text content of the message.
   * Supports markdown formatting for assistant messages.
   */
  content: string;

  /**
   * Unix timestamp (milliseconds) when the message was created.
   * Used for display and sorting messages chronologically.
   */
  timestamp: number;

  /**
   * Optional actions that can be performed on this message.
   * Common actions include copy, regenerate, edit, delete, etc.
   */
  actions?: MessageAction[];
}

/**
 * Represents an action that can be performed on a chat message.
 *
 * Actions are typically displayed as buttons or menu items in the message UI.
 * They provide ways for users to interact with messages beyond just reading them.
 *
 * @example
 * ```typescript
 * const copyAction: MessageAction = {
 *   id: 'copy',
 *   label: 'Copy',
 *   icon: 'lucide_copy',
 *   callback: () => {
 *     navigator.clipboard.writeText(content);
 *   },
 * };
 * ```
 */
export interface MessageAction {
  /**
   * Unique identifier for this action type.
   * Used for tracking and preventing duplicate actions.
   */
  id: string;

  /**
   * Human-readable label for the action.
   * Displayed in buttons, tooltips, or menu items.
   */
  label: string;

  /**
   * Optional icon identifier for the action.
   * If provided, should reference an icon from the icon system (e.g., 'lucide_copy').
   */
  icon?: string;

  /**
   * Callback function executed when the action is triggered.
   * This is where the actual action logic is implemented.
   */
  callback: () => void;
}
