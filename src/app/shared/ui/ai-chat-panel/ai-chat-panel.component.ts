import { Component, Input, Output, EventEmitter, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessagesCardComponent } from '../chat-messages-card';
import { SessionTabsBarComponent } from '../session-tabs-bar';
import { ChatInputComponent } from '../chat-input';
import { ChatMessage, PanelPosition, PanelSize, SessionData } from '../../models';
import { SessionStateService, SessionStorageService } from '../../services';

/**
 * AI Chat Panel Root Component
 *
 * This is the orchestrator component that integrates all child components and provides
 * the main API for using the AI chat panel. It manages state through SessionStateService
 * and coordinates interactions between SessionTabsBar, ChatInput, and ChatMessagesCard.
 *
 * Key Features:
 * - Multi-session support with automatic draft preservation
 * - Drag-and-drop panel positioning
 * - Resizable chat messages card
 * - Session switching and management
 * - Message sending and receiving
 * - Panel visibility toggle (compact/expanded modes)
 *
 * Architecture:
 * - Standalone component (Angular 20+ pattern)
 * - Uses dependency injection with inject()
 * - Orchestrates child components via inputs/outputs
 * - Delegates state management to SessionStateService
 * - Emits events for external consumers
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <spark-ai-chat-panel
 *       [apiEndpoint]="'https://api.example.com/chat'"
 *       (messageSend)="handleMessageSend($event)"
 *       (sessionChange)="handleSessionChange($event)"
 *       (panelToggle)="handlePanelToggle($event)"
 *     />
 *   *   `
 * })
 * export class HostComponent {
 *   handleMessageSend(message: ChatMessage): void {
 *     // Send message to API
 *   }
 *
 *   handleSessionChange(sessionId: string): void {
 *     // React to session change
 *   }
 *
 *   handlePanelToggle(isVisible: boolean): void {
 *     // React to panel toggle
 *   }
 * }
 * ```
 *
 * @Phase 8 - Task 8.1: Component Definition
 * @Phase 8 - Task 8.2: Initialization Logic (localStorage loading, default session creation)
 * @Phase 8 - Task 8.3: Position & Size Persistence (via SessionStateService effect)
 * @Phase 8 - Task 8.4: Styling (mineral & time theme)
 */
@Component({
  selector: 'spark-ai-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessagesCardComponent,
    SessionTabsBarComponent,
    ChatInputComponent,
  ],
  templateUrl: './ai-chat-panel.component.html',
  styleUrls: ['./ai-chat-panel.component.css'],
})
export class AiChatPanelComponent implements OnInit {
  /**
   * Optional API endpoint for sending messages.
   *
   * When provided, the component will automatically send messages to this endpoint.
   * When not provided, parent component must handle messageSend event manually.
   *
   * @example
   * ```typescript
   * [apiEndpoint]="'https://api.example.com/v1/chat'"
   * ```
   */
  @Input()
  apiEndpoint?: string;

  /**
   * Event emitted when a message is sent.
   *
   * Emits the ChatMessage object that was sent. Parent components can use this
   * to handle message sending manually (when apiEndpoint is not provided) or
   * to track message sending for analytics.
   *
   * @example
   * ```typescript
   * (messageSend)="handleMessageSend($event)"
   *
   * handleMessageSend(message: ChatMessage): void {
   *   console.log('Message sent:', message.content);
   * }
   * ```
   */
  @Output()
  readonly messageSend = new EventEmitter<ChatMessage>();

  /**
   * Event emitted when the active session changes.
   *
   * Emits the new active session ID. Useful for tracking session changes
   * or updating external state based on the current session.
   *
   * @example
   * ```typescript
   * (sessionChange)="handleSessionChange($event)"
   *
   * handleSessionChange(sessionId: string): void {
   *   console.log('Session changed to:', sessionId);
   * }
   * ```
   */
  @Output()
  readonly sessionChange = new EventEmitter<string>();

  /**
   * Event emitted when the panel visibility is toggled.
   *
   * Emits true when panel becomes visible, false when panel is hidden.
   * Useful for tracking UI state or adjusting external components.
   *
   * @example
   * ```typescript
   * (panelToggle)="handlePanelToggle($event)"
   *
   * handlePanelToggle(isVisible: boolean): void {
   *   console.log('Panel visibility:', isVisible);
   * }
   * ```
   */
  @Output()
  readonly panelToggle = new EventEmitter<boolean>();

  /**
   * Session state management service.
   *
   * Provides reactive signals for all session data and methods for
   * session management operations. This service handles all state
   * persistence and draft preservation automatically.
   *
   * @readonly
   */
  readonly sessionState = inject(SessionStateService);

  /**
   * Session storage service for loading and persisting sessions.
   *
   * @readonly
   */
  private readonly storage = inject(SessionStorageService);

  /**
   * Signal containing the map of all sessions.
   *
   * Passed through to SessionTabsBar component for display.
   *
   * @readonly
   */
  readonly sessions = this.sessionState.sessions;

  /**
   * Signal containing the ID of the currently active session.
   *
   * Passed through to SessionTabsBar component for highlighting.
   *
   * @readonly
   */
  readonly activeSessionId = this.sessionState.activeSessionId;

  /**
   * Signal controlling the visibility of the messages panel.
   *
   * Passed through to ChatMessagesCard component.
   *
   * @readonly
   */
  readonly isMessagesVisible = this.sessionState.isMessagesVisible;

  /**
   * Computed signal that returns the active session object.
   *
   * Used to access position and size for ChatMessagesCard.
   *
   * @readonly
   */
  readonly activeSession = this.sessionState.activeSession;

  /**
   * Computed signal that returns the active session's position.
   *
   * Returns default position if no active session exists.
   *
   * @readonly
   */
  readonly activeSessionPosition = computed<PanelPosition>(() => {
    const session = this.activeSession();
    return session?.position ?? { x: 0, y: 0 };
  });

  /**
   * Computed signal that returns the active session's size.
   *
   * Returns default size if no active session exists.
   *
   * @readonly
   */
  readonly activeSessionSize = computed<PanelSize>(() => {
    const session = this.activeSession();
    return session?.size ?? { width: 400, height: 600 };
  });

  /**
   * Component initialization hook.
   *
   * Phase 8 Task 8.2: Initialization logic for loading sessions from storage
   *
   * This method:
   * 1. Loads sessions from localStorage via SessionStorageService
   * 2. If no sessions exist, creates a default session
   * 3. Loads active session ID and messages visibility from storage
   * 4. Sets up storage sync effect for persistence (handled by SessionStateService)
   */
  ngOnInit(): void {
    this.initializeSessions();
    this.initializeActiveSession();
    this.initializeMessagesVisibility();
  }

  /**
   * Loads sessions from localStorage or creates a default session.
   *
   * @private
   */
  private initializeSessions(): void {
    const storedSessions = this.storage.loadSessions();

    if (storedSessions && storedSessions.size > 0) {
      // Load existing sessions from storage
      (this.sessionState.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(storedSessions);
    } else {
      // Create a default session if none exist
      const defaultSessionId = this.sessionState.createSession('New Chat');
      // Set the new session as active
      (this.sessionState.activeSessionId as unknown as ReturnType<typeof signal<string>>).set(defaultSessionId);
    }
  }

  /**
   * Loads the active session ID from localStorage.
   *
   * @private
   */
  private initializeActiveSession(): void {
    const storedActiveId = this.storage.loadActiveSessionId();

    if (storedActiveId) {
      // Verify the session still exists
      const sessions = this.sessionState.sessions();
      if (sessions.has(storedActiveId)) {
        (this.sessionState.activeSessionId as unknown as ReturnType<typeof signal<string>>).set(storedActiveId);
      }
    }
  }

  /**
   * Loads the messages visibility state from localStorage.
   *
   * @private
   */
  private initializeMessagesVisibility(): void {
    const storedVisibility = this.storage.loadMessagesVisibility();

    if (storedVisibility !== null) {
      (this.sessionState.isMessagesVisible as unknown as ReturnType<typeof signal<boolean>>).set(storedVisibility);
    }
  }

  /**
   * Sends the current message from the input field.
   *
   * This method:
   * 1. Gets the current input value from the active session
   * 2. Creates a new ChatMessage object
   * 3. Adds the message to the active session
   * 4. Clears the input field
   * 5. Emits the messageSend event for parent components
   *
   * If apiEndpoint is provided, future phases will add automatic API calls.
   *
   * @example
   * ```typescript
   * // User types "Hello, how can you help?" and presses Enter
   * // sendMessage() is called:
   * // 1. Creates message: { id: 'msg-123', role: 'user', content: 'Hello, how can you help?', timestamp: Date.now() }
   * // 2. Adds to active session
   * // 3. Clears input field
   * // 4. Emits messageSend event
   * ```
   */
  sendMessage(): void {
    const inputValue = this.sessionState.activeInputValue();
    const sessionId = this.activeSessionId();

    if (!sessionId || !inputValue.trim()) {
      return;
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    // Add message to the active session
    this.sessionState.addMessage(sessionId, message);

    // Clear the input field by updating the session's inputValue
    this.sessionState.updateInputValue('');

    // Emit event for parent components
    this.messageSend.emit(message);

    // Future: If apiEndpoint is provided, send to API
    // This will be implemented in a future phase
  }

  /**
   * Switches to a different session.
   *
   * This method delegates to SessionStateService.switchSession(), which handles:
   * - Preserving the current session's input draft
   * - Switching to the new session
   * - Loading the new session's draft
   *
   * After switching, this method emits the sessionChange event for parent components.
   *
   * @param sessionId - The ID of the session to switch to
   *
   * @example
   * ```typescript
   * // User clicks on a different session tab
   * switchSession('sess-456');
   * // Current session draft is preserved
   * // New session draft is loaded
   * // sessionChange event is emitted
   * ```
   */
  switchSession(sessionId: string): void {
    this.sessionState.switchSession(sessionId);

    // Emit event for parent components
    this.sessionChange.emit(sessionId);
  }

  /**
   * Toggles the visibility of the messages panel.
   *
   * This method delegates to SessionStateService.toggleMessagesVisibility(),
   * which switches between:
   * - Visible mode: Shows full chat history
   * - Compact mode: Hides messages, shows only input
   *
   * After toggling, this method emits the panelToggle event for parent components.
   *
   * @example
   * ```typescript
   * // User clicks the active session tab to toggle panel
   * toggleMessagesVisibility();
   * // Panel visibility changes
   * // panelToggle event is emitted
   * ```
   */
  toggleMessagesVisibility(): void {
    const newVisibility = !this.isMessagesVisible();
    this.sessionState.toggleMessagesVisibility();

    // Emit event for parent components
    this.panelToggle.emit(newVisibility);
  }

  /**
   * Updates the position of the active session's panel.
   *
   * Called when ChatMessagesCard emits a positionChange event during drag operations.
   * This method updates the session state, which triggers the storage sync effect
   * in SessionStateService to persist changes to localStorage (debounced 500ms).
   *
   * Phase 8 Task 8.3: Position persistence (handled by SessionStateService effect)
   *
   * @param position - The new position to set
   *
   * @private
   */
  updatePosition(position: PanelPosition): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    const session = this.activeSession();
    if (!session) {
      return;
    }

    // Update session with new position
    const sessions = this.sessions();
    const updatedSessions = new Map(sessions);
    updatedSessions.set(sessionId, {
      ...session,
      position,
      lastUpdated: Date.now(),
    });

    // Update the sessions signal
    (this.sessionState.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(updatedSessions);
  }

  /**
   * Creates a new chat session.
   *
   * This method creates a new session with a default name and switches to it.
   * The new session is automatically set as the active session.
   *
   * @example
   * ```typescript
   * // User clicks "New Chat" button
   * createNewSession();
   * // A new session is created with default name "New Chat"
   * // The new session becomes active
   * // sessionChange event is emitted
   * ```
   */
  createNewSession(): void {
    const newSessionId = this.sessionState.createSession();

    // Switch to the new session
    this.switchSession(newSessionId);
  }

  /**
   * Updates the size of the active session's panel.
   *
   * Called when ChatMessagesCard emits a sizeChange event during resize operations.
   * This method updates the session state, which triggers the storage sync effect
   * in SessionStateService to persist changes to localStorage (debounced 500ms).
   *
   * Phase 8 Task 8.3: Size persistence (handled by SessionStateService effect)
   *
   * @param size - The new size to set
   *
   * @private
   */
  updateSize(size: PanelSize): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    const session = this.activeSession();
    if (!session) {
      return;
    }

    // Update session with new size
    const sessions = this.sessions();
    const updatedSessions = new Map(sessions);
    updatedSessions.set(sessionId, {
      ...session,
      size,
      lastUpdated: Date.now(),
    });

    // Update the sessions signal
    (this.sessionState.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(updatedSessions);
  }
}
