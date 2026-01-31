import { SessionData } from './session-data.interface';

/**
 * Represents the root state of the AI chat panel application.
 *
 * This interface serves as the single source of truth for the entire chat panel,
 * aggregating all sessions, tracking the active session, and managing UI visibility
 * state. It enables state management services to maintain consistent application
 * state across components.
 *
 * Key features:
 * - Session management: Map of all sessions with O(1) lookup by ID
 * - Active session tracking: Identifies which session is currently displayed
 * - UI state: Controls messages card visibility (toggle state)
 *
 * @example
 * ```typescript
 * const state: PanelState = {
 *   sessions: new Map([
 *     ['sess-1', { id: 'sess-1', name: 'Chat 1', ... }],
 *     ['sess-2', { id: 'sess-2', name: 'Chat 2', ... }],
 *   ]),
 *   activeSessionId: 'sess-1',
 *   isMessagesVisible: true,
 * };
 * ```
 */
export interface PanelState {
  /**
   * Map of all chat sessions keyed by session ID.
   *
   * Using Map provides O(1) lookup performance and maintains insertion order,
   * which is useful for displaying sessions in chronological or custom order.
   *
   * The Map data structure is preferred over a plain object for:
   * - Better type safety with TypeScript
   * - Efficient lookups by session ID
   * - Built-in methods for iteration and manipulation
   * - Ability to use any string as a key (including keys that collide with Object prototypes)
   *
   * @example
   * ```typescript
   * // Lookup a session by ID
   * const session = state.sessions.get('sess-123');
   *
   * // Add a new session
   * state.sessions.set('sess-456', newSession);
   *
   * // Iterate over all sessions
   * for (const [id, session] of state.sessions) {
   *   console.log(`${session.name}: ${session.messages.length} messages`);
   * }
   * ```
   */
  sessions: Map<string, SessionData>;

  /**
   * ID of the currently active session.
   *
   * This identifies which session should be displayed in the chat panel.
   * The active session is the one receiving user input and displaying messages.
   *
   * Invariant: This ID should always exist in the sessions Map.
   * If the active session is deleted, this should be updated to point to
   * another session (or cleared if no sessions remain).
   *
   * @example
   * ```typescript
   * // Get the active session
   * const activeSession = state.sessions.get(state.activeSessionId);
   *
   * // Switch to a different session
   * state.activeSessionId = 'sess-456';
   *
   * // Check if a session is active
   * const isActive = state.activeSessionId === 'sess-123';
   * ```
   */
  activeSessionId: string;

  /**
   * Controls whether the messages card is currently visible.
   *
   * This is a toggle state that allows users to show/hide the chat messages
   * card while keeping the chat trigger available. When false, only the
   * chat trigger button is visible. When true, the full chat panel is displayed.
   *
   * This enables:
   * - Collapsible chat panel for space efficiency
   * - Persistent state across panel hide/show cycles
   * - Smooth transition between collapsed and expanded states
   *
   * @example
   * ```typescript
   * // Show the messages card
   * state.isMessagesVisible = true;
   *
   * // Hide the messages card (collapse to trigger button)
   * state.isMessagesVisible = false;
   *
   * // Toggle visibility
   * state.isMessagesVisible = !state.isMessagesVisible;
   * ```
   */
  isMessagesVisible: boolean;
}
