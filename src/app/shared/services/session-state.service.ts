import { Injectable, signal, computed, Signal, effect, inject } from '@angular/core';
import { SessionData, ChatMessage, PanelPosition, PanelSize, SessionStatus } from '../models';
import { IdGenerator } from '../utils';
import { SessionStorageService } from './session-storage.service';

/**
 * Default panel position when creating a new session.
 *
 * TODO: Will be replaced by PANEL_CONSTRAINTS.DEFAULT_POSITION in Phase 7
 */
const DEFAULT_POSITION: PanelPosition = { x: 0, y: 0 };

/**
 * Default panel size when creating a new session.
 *
 * TODO: Will be replaced by PANEL_CONSTRAINTS.DEFAULT_SIZE in Phase 7
 */
const DEFAULT_SIZE: PanelSize = { width: 600, height: 400 };

/**
 * Default name for new sessions.
 */
const DEFAULT_SESSION_NAME = 'New Chat';

/**
 * Central state management service for AI chat panel sessions.
 *
 * This service manages all session state using Angular Signals, providing:
 * - Multi-session support with draft preservation
 * - Computed signals for reactive state derivation
 * - Session CRUD operations
 * - Active session management
 *
 * Key Features:
 * - **Draft Preservation**: Each session maintains its own input draft (inputValue)
 * - **Session Switching**: When switching sessions, current draft is saved and new session's draft is restored
 * - **Signal-Based**: All state is reactive using Angular Signals for optimal performance
 * - **Immutable Updates**: State mutations create new Map instances to ensure signal reactivity
 *
 * Session Switching Flow:
 * 1. Current session's draft is preserved in its inputValue field
 * 2. activeSessionId signal is updated
 * 3. Computed signals automatically react to new active session
 * 4. New session's draft is loaded from its inputValue field
 *
 * @example
 * ```typescript
 * constructor(private sessionState: SessionStateService) {
 *   // Access active session data reactively
 *   effect(() => {
 *     const activeSession = this.sessionState.activeSession();
 *     console.log('Active session:', activeSession?.name);
 *   });
 * }
 *
 * // Switch to a different session (draft is automatically preserved)
 * this.sessionState.switchSession('sess-123');
 *
 * // Create a new session
 * const newSessionId = this.sessionState.createSession('My Project');
 *
 * // Add a message to the active session
 * this.sessionState.addMessage('sess-123', {
 *   id: 'msg-456',
 *   role: 'user',
 *   content: 'Hello',
 *   timestamp: Date.now()
 * });
 * ```
 *
 * @Phase 2.1 - Core state management implementation
 * @Phase 3.2 - Storage sync effect integration
 */
@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private readonly storage = inject(SessionStorageService);

  /**
   * Map of all sessions, keyed by session ID.
   *
   * This is the core state signal. All session data is stored here.
   * When updating this signal, always create a new Map instance to
   * ensure proper signal reactivity.
   *
   * @readonly
   */
  readonly sessions: Signal<Map<string, SessionData>> = signal(new Map());

  /**
   * The ID of the currently active session.
   *
   * When this signal changes, all computed signals (activeSession,
   * activeMessages, activeInputValue) automatically update to reflect
   * the new active session.
   *
   * @readonly
   */
  readonly activeSessionId: Signal<string> = signal('');

  /**
   * Visibility state of the messages panel.
   *
   * - true: Messages panel is visible
   * - false: Messages panel is hidden (compact mode)
   *
   * @readonly
   */
  readonly isMessagesVisible: Signal<boolean> = signal(true);

  /**
   * Computed signal that returns the active session object.
   *
   * Automatically updates when activeSessionId or sessions change.
   * Returns undefined if no active session is set or if the active
   * session ID doesn't exist in the sessions map.
   *
   * @readonly
   */
  readonly activeSession: Signal<SessionData | undefined> = computed(() => {
    const sessionId = this.activeSessionId();
    const sessionMap = this.sessions();

    return sessionMap.get(sessionId);
  });

  /**
   * Computed signal that returns messages from the active session.
   *
   * Automatically updates when the active session changes or when
   * messages are added to the active session.
   *
   * Returns empty array if no active session exists.
   *
   * @readonly
   */
  readonly activeMessages: Signal<ChatMessage[]> = computed(() => {
    const session = this.activeSession();
    return session?.messages ?? [];
  });

  /**
   * Computed signal that returns the input draft from the active session.
   *
   * This is the key to draft preservation. Each session stores its own
   * inputValue draft. When switching sessions, this computed signal
   * automatically returns the new session's draft.
   *
   * Returns empty string if no active session exists.
   *
   * @readonly
   */
  readonly activeInputValue: Signal<string> = computed(() => {
    const session = this.activeSession();
    return session?.inputValue ?? '';
  });

  /**
   * Computed signal that indicates whether the current input can be sent.
   *
   * Returns true if the active input value has non-whitespace content.
   * Returns false if input is empty, whitespace-only, or no active session exists.
   *
   * @readonly
   */
  readonly canSendMessage: Signal<boolean> = computed(() => {
    const inputValue = this.activeInputValue();
    return inputValue.trim().length > 0;
  });

  /**
   * Debounce timer for storage sync operations.
   *
   * Prevents excessive localStorage writes by batching rapid state changes.
   * Uses 500ms delay to balance between responsiveness and performance.
   *
   * @private
   */
  private storageSyncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Previous values for change detection.
   *
   * Tracks previous state to avoid redundant localStorage writes when values haven't actually changed.
   *
   * @private
   */
  private prevSessions = new Map<string, SessionData>();
  private prevActiveSessionId = '';
  private prevIsMessagesVisible = true;

  constructor() {
    this.setupStorageSyncEffect();
  }

  /**
   * Sets up automatic synchronization of state changes to localStorage.
   *
   * This effect watches all state signals and persists changes to localStorage
   * with debouncing to prevent excessive writes. The debouncing ensures that
   * rapid state changes (like typing in the input field) don't cause a
   * localStorage write on every keystroke.
   *
   * Debouncing Strategy:
   * - 500ms delay balances responsiveness and performance
   * - Each state change resets the timer
   * - Only the final state after changes stop is written to storage
   *
   * Change Detection:
   * - Tracks previous values to avoid redundant writes
   * - Only writes when actual changes occur
   * - Prevents unnecessary localStorage operations
   *
   * Synchronized Data:
   * - sessions: Complete session map with all data
   * - activeSessionId: Currently active session
   * - isMessagesVisible: Messages panel visibility state
   *
   * @example
   * ```typescript
   * // User types in input field
   * this.updateInputValue('H');  // Timer starts
   * this.updateInputValue('He'); // Timer resets
   * this.updateInputValue('Hel'); // Timer resets
   * this.updateInputValue('Hell'); // Timer resets
   * this.updateInputValue('Hello'); // Timer resets
   * // 500ms later: Single localStorage write occurs
   * ```
   *
   * @private
   */
  private setupStorageSyncEffect(): void {
    effect(() => {
      // Read all signals to establish tracking
      const sessions = this.sessions();
      const activeSessionId = this.activeSessionId();
      const isMessagesVisible = this.isMessagesVisible();

      // Clear any pending timer
      if (this.storageSyncTimer !== null) {
        clearTimeout(this.storageSyncTimer);
      }

      // Set up debounced save
      this.storageSyncTimer = setTimeout(() => {
        this.saveToStorage(sessions, activeSessionId, isMessagesVisible);
      }, 500);
    });
  }

  /**
   * Saves state to localStorage if values have changed.
   *
   * Compares current state with previous values to avoid redundant writes.
   * Only writes when actual changes are detected, reducing unnecessary
   * localStorage operations.
   *
   * @param sessions - Current sessions map
   * @param activeSessionId - Current active session ID
   * @param isMessagesVisible - Current messages visibility state
   *
   * @private
   */
  private saveToStorage(
    sessions: Map<string, SessionData>,
    activeSessionId: string,
    isMessagesVisible: boolean,
  ): void {
    // Check if sessions map has changed (size or content)
    const sessionsChanged =
      sessions.size !== this.prevSessions.size ||
      Array.from(sessions.entries()).some(([id, session]) => {
        const prevSession = this.prevSessions.get(id);
        if (!prevSession) return true;

        // Compare session data (check lastUpdated for changes)
        return session.lastUpdated !== prevSession.lastUpdated;
      });

    if (sessionsChanged) {
      this.storage.saveSessions(sessions);
      this.prevSessions = new Map(sessions);
    }

    // Check if activeSessionId has changed
    if (activeSessionId !== this.prevActiveSessionId) {
      this.storage.saveActiveSessionId(activeSessionId);
      this.prevActiveSessionId = activeSessionId;
    }

    // Check if isMessagesVisible has changed
    if (isMessagesVisible !== this.prevIsMessagesVisible) {
      this.storage.saveMessagesVisibility(isMessagesVisible);
      this.prevIsMessagesVisible = isMessagesVisible;
    }
  }

  /**
   * Switches to a different session with automatic draft preservation.
   *
   * Draft Preservation Flow:
   * 1. Save current active session's inputValue draft
   * 2. Update activeSessionId to the new session
   * 3. Computed signals automatically react and load the new session's draft
   *
   * If the target session doesn't exist, this method does nothing.
   *
   * @param sessionId - The ID of the session to switch to
   *
   * @example
   * ```typescript
   * // Current session has draft "Hello, can you help?"
   * // We want to switch to another session
   *
   * // Draft is automatically preserved
   * this.sessionState.switchSession('sess-456');
   *
   * // The new session's draft is automatically loaded
   * console.log(this.sessionState.activeInputValue()); // New session's draft
   * ```
   */
  switchSession(sessionId: string): void {
    const sessionMap = this.sessions();

    // Validate that the target session exists
    if (!sessionMap.has(sessionId)) {
      return;
    }

    // If there's an active session, preserve its draft before switching
    const currentActiveId = this.activeSessionId();
    if (currentActiveId) {
      const currentSession = sessionMap.get(currentActiveId);
      if (currentSession) {
        // Create an updated sessions map with the preserved draft
        const updatedSessions = new Map(sessionMap);
        updatedSessions.set(currentActiveId, {
          ...currentSession,
          inputValue: this.activeInputValue(),
          lastUpdated: Date.now(),
        });

        // Update the sessions signal with the new Map
        (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
          updatedSessions,
        );
      }
    }

    // Switch to the new session
    (this.activeSessionId as unknown as ReturnType<typeof signal<string>>).set(sessionId);
  }

  /**
   * Toggles the visibility of the messages panel.
   *
   * Switches between:
   * - Visible mode: Shows full chat history
   * - Compact mode: Hides messages, shows only input
   *
   * @example
   * ```typescript
   * this.sessionState.toggleMessagesVisibility();
   * ```
   */
  toggleMessagesVisibility(): void {
    const currentVisibility = this.isMessagesVisible();
    (this.isMessagesVisible as unknown as ReturnType<typeof signal<boolean>>).set(
      !currentVisibility,
    );
  }

  /**
   * Updates the input draft for the active session.
   *
   * This method is called as the user types in the input field.
   * The draft is stored in the active session's inputValue field,
   * ensuring it persists when switching sessions.
   *
   * @param value - The new input value to save as a draft
   *
   * @example
   * ```typescript
   * // User types in the input field
   * onInputChange(event: Event) {
   *   const value = (event.target as HTMLInputElement).value;
   *   this.sessionState.updateInputValue(value);
   * }
   * ```
   */
  updateInputValue(value: string): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    const sessionMap = this.sessions();
    const session = sessionMap.get(sessionId);

    if (!session) {
      return;
    }

    // Create an updated sessions map with the new input value
    const updatedSessions = new Map(sessionMap);
    updatedSessions.set(sessionId, {
      ...session,
      inputValue: value,
      lastUpdated: Date.now(),
    });

    // Update the sessions signal with the new Map
    (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
      updatedSessions,
    );
  }

  /**
   * Adds a message to a session.
   *
   * Typically used to add a new message to the active session after
   * the user sends a message or receives an AI response.
   *
   * @param sessionId - The ID of the session to add the message to
   * @param message - The message to add
   *
   * @example
   * ```typescript
   * // Add a user message
   * this.sessionState.addMessage('sess-123', {
   *   id: 'msg-456',
   *   role: 'user',
   *   content: 'Hello, how can you help?',
   *   timestamp: Date.now()
   * });
   *
   * // Add an assistant response
   * this.sessionState.addMessage('sess-123', {
   *   id: 'msg-789',
   *   role: 'assistant',
   *   content: 'I can help you with...',
   *   timestamp: Date.now()
   * });
   * ```
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const sessionMap = this.sessions();
    const session = sessionMap.get(sessionId);

    if (!session) {
      return;
    }

    // Create an updated sessions map with the new message
    const updatedSessions = new Map(sessionMap);
    updatedSessions.set(sessionId, {
      ...session,
      messages: [...session.messages, message],
      lastUpdated: Date.now(),
    });

    // Update the sessions signal with the new Map
    (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
      updatedSessions,
    );
  }

  /**
   * Creates a new session with optional custom name.
   *
   * The new session is initialized with:
   * - Unique ID (generated by IdGenerator)
   * - Provided name or default "New Chat"
   * - Empty messages array
   * - Empty input draft
   * - Default position and size
   * - Current timestamp
   *
   * @param name - Optional custom name for the session. Defaults to "New Chat"
   * @returns The ID of the newly created session
   *
   * @example
   * ```typescript
   * // Create session with default name
   * const sessionId1 = this.sessionState.createSession();
   * console.log(sessionId1); // 'sess-1738300800000-abc123xyz'
   *
   * // Create session with custom name
   * const sessionId2 = this.sessionState.createSession('Project Planning');
   * console.log(sessionId2); // 'sess-1738300801000-def456uvw'
   * ```
   */
  createSession(name?: string): string {
    const sessionId = IdGenerator.generateSessionId();
    const now = Date.now();

    const newSession: SessionData = {
      id: sessionId,
      name: name ?? DEFAULT_SESSION_NAME,
      messages: [],
      inputValue: '',
      position: { ...DEFAULT_POSITION },
      size: { ...DEFAULT_SIZE },
      lastUpdated: now,
      status: SessionStatus.IDLE,
      color: 'default',
      mode: 'docked',
    };

    // Create an updated sessions map with the new session
    const sessionMap = this.sessions();
    const updatedSessions = new Map(sessionMap);
    updatedSessions.set(sessionId, newSession);

    // Update the sessions signal with the new Map
    (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
      updatedSessions,
    );

    return sessionId;
  }

  /**
   * Deletes a session.
   *
   * If the deleted session is the active one, clears the active session ID.
   * If there are other sessions remaining, switches to the most recently
   * updated one (by lastUpdated timestamp).
   *
   * @param sessionId - The ID of the session to delete
   *
   * @example
   * ```typescript
   * // Delete a session
   * this.sessionState.deleteSession('sess-123');
   *
   * // If the deleted session was active, the service will automatically
   * // switch to another session or clear the active session ID
   * ```
   */
  deleteSession(sessionId: string): void {
    const sessionMap = this.sessions();

    // Validate that the session exists
    if (!sessionMap.has(sessionId)) {
      return;
    }

    // Create an updated sessions map without the deleted session
    const updatedSessions = new Map(sessionMap);
    updatedSessions.delete(sessionId);

    // Update the sessions signal with the new Map
    (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
      updatedSessions,
    );

    // If we deleted the active session, handle active session state
    if (this.activeSessionId() === sessionId) {
      if (updatedSessions.size > 0) {
        // Find the most recently updated session to switch to
        const sessionsArray = Array.from(updatedSessions.values());
        const mostRecent = sessionsArray.reduce((latest, current) =>
          current.lastUpdated > latest.lastUpdated ? current : latest,
        );

        (this.activeSessionId as unknown as ReturnType<typeof signal<string>>).set(mostRecent.id);
      } else {
        // No sessions left, clear active session ID
        (this.activeSessionId as unknown as ReturnType<typeof signal<string>>).set('');
      }
    }
  }

  /**
   * Renames a session.
   *
   * Updates the display name of a session while preserving all other
   * session data (messages, draft, position, size, etc.).
   *
   * @param sessionId - The ID of the session to rename
   * @param newName - The new name for the session
   *
   * @example
   * ```typescript
   * // Rename a session
   * this.sessionState.renameSession('sess-123', 'Project Planning Discussion');
   * ```
   */
  renameSession(sessionId: string, newName: string): void {
    const sessionMap = this.sessions();
    const session = sessionMap.get(sessionId);

    if (!session) {
      return;
    }

    // Create an updated sessions map with the new name
    const updatedSessions = new Map(sessionMap);
    updatedSessions.set(sessionId, {
      ...session,
      name: newName,
      lastUpdated: Date.now(),
    });

    // Update the sessions signal with the new Map
    (this.sessions as unknown as ReturnType<typeof signal<Map<string, SessionData>>>).set(
      updatedSessions,
    );
  }
}
