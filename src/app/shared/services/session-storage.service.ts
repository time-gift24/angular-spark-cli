import { Injectable } from '@angular/core';
import { SessionData } from '../models';

/**
 * localStorage keys for AI chat panel persistence.
 *
 * These keys are used to store different aspects of the application state:
 * - Sessions: Map of all sessions with their messages, drafts, and layout
 * - Active session ID: Tracks which session is currently displayed
 * - Messages visibility: Controls whether the messages card is shown
 */
const STORAGE_KEYS = {
  SESSIONS: 'ai-chat-panel-preferences',
  ACTIVE_SESSION_ID: 'ai-chat-panel-active-session-id',
  MESSAGES_VISIBILITY: 'ai-chat-panel-messages-visibility',
} as const;

/**
 * Service for persisting AI chat panel state to localStorage.
 *
 * This service handles all localStorage operations for the AI chat panel,
 * including serialization/deserialization of complex data structures and
 * graceful handling of privacy mode (when localStorage is unavailable).
 *
 * Key responsibilities:
 * - **Session Persistence**: Save/load Map<string, SessionData> to/from localStorage
 * - **State Tracking**: Track active session ID and messages visibility
 * - **Privacy Mode**: Gracefully handle localStorage unavailability
 * - **Data Serialization**: Convert Maps to/from JSON for localStorage storage
 *
 * Privacy Mode Handling:
 * When localStorage is unavailable (e.g., browser privacy mode, incognito),
 * all operations gracefully fail without throwing errors. Load operations
 * return null, and save operations silently fail.
 *
 * @example
 * ```typescript
 * constructor(private storage: SessionStorageService) {
 *   // Load saved state on initialization
 *   const sessions = this.storage.loadSessions();
 *   if (sessions) {
 *     this.initializeState(sessions);
 *   }
 * }
 *
 * // Save state when sessions change
 * onSessionsChanged(sessions: Map<string, SessionData>) {
 *   this.storage.saveSessions(sessions);
 * }
 *
 * // Clear all stored data
 * clearAllData() {
 *   this.storage.clearAll();
 * }
 * ```
 *
 * @Phase 3.1 - Session storage implementation
 */
@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  private readonly STORAGE_KEY = STORAGE_KEYS.SESSIONS;
  private readonly ACTIVE_SESSION_ID_KEY = STORAGE_KEYS.ACTIVE_SESSION_ID;
  private readonly MESSAGES_VISIBILITY_KEY = STORAGE_KEYS.MESSAGES_VISIBILITY;

  /**
   * Loads all sessions from localStorage.
   *
   * Deserializes the stored JSON array back into a Map<string, SessionData>.
   * Returns null if:
   * - No sessions are stored
   * - Stored data is corrupted or invalid
   * - localStorage is unavailable
   *
   * @returns Map of sessions, or null if no sessions exist or on error
   *
   * @example
   * ```typescript
   * const sessions = this.storage.loadSessions();
   * if (sessions) {
   *   console.log(`Loaded ${sessions.size} sessions`);
   *   sessions.forEach((session, id) => {
   *     console.log(`${id}: ${session.name}`);
   *   });
   * } else {
   *   console.log('No saved sessions found');
   * }
   * ```
   */
  loadSessions(): Map<string, SessionData> | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);

      if (!stored) {
        return null;
      }

      // Deserialize JSON array to Map
      const entries = JSON.parse(stored);
      return new Map(entries);
    } catch {
      // Gracefully handle localStorage errors (privacy mode, quota exceeded, etc.)
      return null;
    }
  }

  /**
   * Saves all sessions to localStorage.
   *
   * Serializes the Map<string, SessionData> to JSON for storage.
   * Silently fails if localStorage is unavailable.
   *
   * @param sessions - Map of sessions to save
   *
   * @example
   * ```typescript
   * const sessions = new Map([
   *   ['sess-1', { id: 'sess-1', name: 'Chat 1', ... }]
   * ]);
   * this.storage.saveSessions(sessions);
   * ```
   */
  saveSessions(sessions: Map<string, SessionData>): void {
    try {
      // Serialize Map to JSON array
      const serialized = JSON.stringify(Array.from(sessions.entries()));
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch {
      // Gracefully handle localStorage errors (privacy mode, quota exceeded, etc.)
      // Silently fail - state will not persist across sessions
    }
  }

  /**
   * Loads the active session ID from localStorage.
   *
   * Returns null if:
   * - No active session ID is stored
   * - Stored value is empty
   * - localStorage is unavailable
   *
   * @returns Active session ID, or null if not set or on error
   *
   * @example
   * ```typescript
   * const activeId = this.storage.loadActiveSessionId();
   * if (activeId) {
   *   this.switchToSession(activeId);
   * }
   * ```
   */
  loadActiveSessionId(): string | null {
    try {
      const stored = localStorage.getItem(this.ACTIVE_SESSION_ID_KEY);

      if (!stored || stored === '') {
        return null;
      }

      return stored;
    } catch {
      // Gracefully handle localStorage errors
      return null;
    }
  }

  /**
   * Saves the active session ID to localStorage.
   *
   * Silently fails if localStorage is unavailable.
   *
   * @param sessionId - The active session ID to save
   *
   * @example
   * ```typescript
   * this.storage.saveActiveSessionId('sess-123');
   * ```
   */
  saveActiveSessionId(sessionId: string): void {
    try {
      localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, sessionId);
    } catch {
      // Gracefully handle localStorage errors
    }
  }

  /**
   * Loads the messages visibility state from localStorage.
   *
   * Returns null if:
   * - No visibility state is stored
   * - Stored value is invalid
   * - localStorage is unavailable
   *
   * @returns true if messages are visible, false if hidden, or null if not set
   *
   * @example
   * ```typescript
   * const isVisible = this.storage.loadMessagesVisibility();
   * if (isVisible !== null) {
   *   this.showMessages(isVisible);
   * }
   * ```
   */
  loadMessagesVisibility(): boolean | null {
    try {
      const stored = localStorage.getItem(this.MESSAGES_VISIBILITY_KEY);

      if (!stored || stored === '') {
        return null;
      }

      // Parse boolean from string
      return stored === 'true';
    } catch {
      // Gracefully handle localStorage errors
      return null;
    }
  }

  /**
   * Saves the messages visibility state to localStorage.
   *
   * Silently fails if localStorage is unavailable.
   *
   * @param visible - true to show messages, false to hide
   *
   * @example
   * ```typescript
   * this.storage.saveMessagesVisibility(true);  // Show messages
   * this.storage.saveMessagesVisibility(false); // Hide messages
   * ```
   */
  saveMessagesVisibility(visible: boolean): void {
    try {
      localStorage.setItem(this.MESSAGES_VISIBILITY_KEY, String(visible));
    } catch {
      // Gracefully handle localStorage errors
    }
  }

  /**
   * Clears all stored AI chat panel data from localStorage.
   *
   * Removes:
   * - All sessions
   * - Active session ID
   * - Messages visibility state
   *
   * Silently fails if localStorage is unavailable.
   *
   * @example
   * ```typescript
   * // User wants to clear all chat data
   * if (confirm('Clear all chat history?')) {
   *   this.storage.clearAll();
   * }
   * ```
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ACTIVE_SESSION_ID_KEY);
      localStorage.removeItem(this.MESSAGES_VISIBILITY_KEY);
    } catch {
      // Gracefully handle localStorage errors
    }
  }

  /**
   * Checks if localStorage is available for use.
   *
   * This method tests localStorage availability by attempting a write
   * and read operation. Returns true if localStorage is functional,
   * false otherwise.
   *
   * Note: This is a basic availability check. Some browsers may allow
   * reads but fail on writes (e.g., when quota is exceeded). The service
   * handles these cases gracefully in all storage methods.
   *
   * @returns true if localStorage is available, false otherwise
   *
   * @example
   * ```typescript
   * if (this.storage.isAvailable()) {
   *   console.log('State will persist across sessions');
   * } else {
   *   console.warn('Privacy mode detected - state will not persist');
   * }
   * ```
   */
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
