import { EventEmitter } from '@angular/core';
import { ChatMessage } from './chat-message.interface';

/**
 * Configuration inputs for the AiChatPanel component.
 *
 * These properties define the public API for parent components to configure
 * the AI chat panel. All inputs are optional, allowing the panel to operate
 * with sensible defaults.
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * <ai-chat-panel />
 *
 * // With custom API endpoint
 * <ai-chat-panel [apiEndpoint]="'https://api.example.com/chat'" />
 *
 * // With initial sessions loaded from storage
 * <ai-chat-panel [initialSessions]="serializedSessions" />
 *
 * // In a parent component
 * @Component({
 *   selector: 'app-parent',
 *   template: `
 *     <ai-chat-panel
 *       [initialSessions]="savedSessions"
 *       [apiEndpoint]="apiUrl">
 *     </ai-chat-panel>
 *   `,
 * })
 * export class ParentComponent {
 *   savedSessions = JSON.stringify(sessionData);
 *   apiUrl = 'https://api.example.com/chat';
 * }
 * ```
 */
export interface AiChatPanelInputs {
  /**
   * Optional serialized session data for initializing the chat panel.
   *
   * When provided, this should be a JSON string representing an array of
   * SessionData objects. The panel will deserialize and load these sessions
   * on initialization, enabling state restoration across page refreshes
   * or application restarts.
   *
   * The serialized data should follow the SessionData interface structure
   * from the domain model. If invalid JSON is provided, the panel will
   * fall back to an empty state.
   *
   * @example
   * ```typescript
   * // Serialize sessions for storage
   * const sessionsArray = Array.from(state.sessions.values());
   * const serialized = JSON.stringify(sessionsArray);
   * localStorage.setItem('chat-sessions', serialized);
   *
   * // Restore sessions on load
   * const saved = localStorage.getItem('chat-sessions');
   * <ai-chat-panel [initialSessions]="saved" />
   * ```
   */
  initialSessions?: string;

  /**
   * Optional API endpoint for AI chat message processing.
   *
   * When provided, all user messages will be sent to this endpoint for
   * AI processing. The endpoint should accept POST requests with message
   * data and return AI responses in the expected format.
   *
   * If not provided, the panel will operate in demo mode with simulated
   * responses, useful for development and testing.
   *
   * The expected API contract:
   * - Method: POST
   * - Headers: { 'Content-Type': 'application/json' }
   * - Body: { messages: ChatMessage[], sessionId: string }
   * - Response: { content: string, timestamp: number }
   *
   * @example
   * ```typescript
   * // Configure with production endpoint
   * <ai-chat-panel [apiEndpoint]="'https://api.example.com/v1/chat'" />
   *
   * // Configure with local development server
   * <ai-chat-panel [apiEndpoint]="'http://localhost:3000/api/chat'" />
   *
   * // Demo mode (no API)
   * <ai-chat-panel />
   * ```
   */
  apiEndpoint?: string;
}

/**
 * Event outputs emitted by the AiChatPanel component.
 *
 * These outputs enable parent components to react to and handle key events
 * within the chat panel, such as message sending, session changes, and UI
 * state toggles. This allows for integration with broader application features
 * like analytics, logging, persistence, and UI synchronization.
 *
 * @example
 * ```typescript
 * <ai-chat-panel
 *   (messageSend)="handleMessageSend($event)"
 *   (sessionChange)="handleSessionChange($event)"
 *   (panelToggle)="handlePanelToggle($event)">
 * </ai-chat-panel>
 *
 * // In parent component
 * export class ParentComponent {
 *   handleMessageSend(message: ChatMessage) {
 *     console.log('User sent:', message.content);
 *     this.analytics.track('chat_message_sent', { messageId: message.id });
 *   }
 *
 *   handleSessionChange(sessionId: string) {
 *     console.log('Switched to session:', sessionId);
 *     this.analytics.track('chat_session_changed', { sessionId });
 *   }
 *
 *   handlePanelToggle(isVisible: boolean) {
 *     console.log('Panel visibility:', isVisible);
 *     this.analytics.track('chat_panel_toggled', { isVisible });
 *   }
 * }
 * ```
 */
export interface AiChatPanelOutputs {
  /**
   * Emitted when the user sends a message.
   *
   * This event fires immediately when the user submits a message, before
   * any API call is made. It provides the complete ChatMessage object,
   * including the generated message ID, content, and timestamp.
   *
   * Use cases:
   * - Analytics tracking of user engagement
   * - Logging message history to external services
   * - Triggering side effects in the parent application
   * - Custom message preprocessing or validation
   *
   * The emitted ChatMessage includes all message properties:
   * - id: Auto-generated unique identifier
   * - role: Always 'user' for sent messages
   * - content: The message text
   * - timestamp: When the message was sent
   * - actions: Optional action buttons for the message
   *
   * @example
   * ```typescript
   * (messageSend)="onMessageSend($event)"
   *
   * onMessageSend(message: ChatMessage) {
   *   // Track in analytics
   *   this.analytics.track('message_sent', {
   *     sessionId: this.currentSession,
   *     messageLength: message.content.length,
   *   });
   *
   *   // Log to external service
   *   this.logger.log('User message', message);
   *
   *   // Update application state
   *   this.appState.lastActivity = message.timestamp;
   * }
   * ```
   */
  messageSend: EventEmitter<ChatMessage>;

  /**
   * Emitted when the active session changes.
   *
   * This event fires whenever the user switches between chat sessions,
   * whether through the session selector, session creation, or session
   * deletion. It provides the ID of the newly active session.
   *
   * Use cases:
   * - Analytics tracking of session usage
   * - Persisting the active session to storage
   * - Syncing session state across multiple components
   * - Updating parent application context based on session
   *
   * The emitted string is the session ID of the new active session.
   * This ID can be used to lookup the full SessionData from the
   * internal state if needed.
   *
   * Note: This event does not emit when messages are added to the
   * current session, only when the active session ID changes.
   *
   * @example
   * ```typescript
   * (sessionChange)="onSessionChange($event)"
   *
   * onSessionChange(sessionId: string) {
   *   // Update parent component state
   *   this.currentSessionId = sessionId;
   *
   *   // Persist to localStorage
   *   localStorage.setItem('active-session', sessionId);
   *
   *   // Track in analytics
   *   this.analytics.track('session_changed', { sessionId });
   *
   *   // Update related UI components
   *   this.relatedComponent.loadContext(sessionId);
   * }
   * ```
   */
  sessionChange: EventEmitter<string>;

  /**
   * Emitted when the messages card visibility is toggled.
   *
   * This event fires whenever the user expands or collapses the chat
   * messages card, switching between the full panel view and the
   * minimal trigger button view. It provides the new visibility state.
   *
   * The value is true when the messages card becomes visible (expanded)
   * and false when it becomes hidden (collapsed).
   *
   * Use cases:
   * - Analytics tracking of UI interactions
   * - Syncing visibility state with parent application
   * - Triggering layout adjustments in parent components
   * - Persisting UI state preferences
   *
   * @example
   * ```typescript
   * (panelToggle)="onPanelToggle($event)"
   *
   * onPanelToggle(isVisible: boolean) {
   *   // Track user preference
   *   this.analytics.track('panel_toggled', { isVisible });
   *
   *   // Persist UI state
   *   localStorage.setItem('panel-visible', String(isVisible));
   *
   *   // Adjust parent component layout
   *   if (isVisible) {
   *     this.sidebar.mode = 'push';
   *   } else {
   *     this.sidebar.mode = 'over';
   *   }
   *
   *   // Update related UI elements
   *   this.toolbar.updateLayout(isVisible);
   * }
   * ```
   */
  panelToggle: EventEmitter<boolean>;
}
