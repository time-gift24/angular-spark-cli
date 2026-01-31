import { ChatMessage } from './chat-message.interface';

/**
 * Represents the position of a draggable panel on the screen.
 *
 * Coordinates are relative to the viewport or parent container.
 * Used to persist panel position across sessions.
 */
export interface PanelPosition {
  /**
   * Horizontal position in pixels from the left edge.
   */
  x: number;

  /**
   * Vertical position in pixels from the top edge.
   */
  y: number;
}

/**
 * Represents the size of a resizable panel.
 *
 * Dimensions are in pixels.
 * Used to persist panel size across sessions.
 */
export interface PanelSize {
  /**
   * Width of the panel in pixels.
   */
  width: number;

  /**
   * Height of the panel in pixels.
   */
  height: number;
}

/**
 * Represents a complete chat session in the AI chat panel.
 *
 * A session encapsulates all state related to a single conversation,
 * including messages, draft input, and panel layout. This enables
 * users to maintain multiple concurrent conversations with full
 * state preservation.
 *
 * Key features:
 * - Message history with full ChatMessage objects
 * - Draft state preservation (inputValue) when switching sessions
 * - Per-session layout memory (position and size)
 * - Timestamp-based sorting and tracking
 *
 * @example
 * ```typescript
 * const session: SessionData = {
 *   id: 'sess-123',
 *   name: 'Project Planning Discussion',
 *   messages: [
 *     {
 *       id: 'msg-1',
 *       role: 'user',
 *       content: 'Help me plan my project',
 *       timestamp: Date.now(),
 *     },
 *     {
 *       id: 'msg-2',
 *       role: 'assistant',
 *       content: 'I\'d be happy to help...',
 *       timestamp: Date.now(),
 *     },
 *   ],
 *   inputValue: 'What about the timeline?',  // Preserved draft
 *   position: { x: 100, y: 50 },
 *   size: { width: 400, height: 600 },
 *   lastUpdated: Date.now(),
 * };
 * ```
 */
export interface SessionData {
  /**
   * Unique identifier for this session.
   * Used for tracking and referencing sessions throughout the system.
   */
  id: string;

  /**
   * Human-readable display name for this session.
   * Typically auto-generated from the first user message or user-provided.
   */
  name: string;

  /**
   * Array of all messages in this session's conversation.
   * Maintains chronological order of the dialogue.
   */
  messages: ChatMessage[];

  /**
   * Draft input value preservation.
   *
   * When users switch between sessions, their unfinished input is preserved.
   * This allows users to work on multiple conversations simultaneously without
   * losing their draft responses.
   *
   * Empty string indicates no draft in progress.
   */
  inputValue: string;

  /**
   * Panel position on screen.
   *
   * Enables per-session layout memory. Each session remembers where its
   * chat messages card was positioned, allowing users to arrange multiple
   * sessions in custom layouts.
   */
  position: PanelPosition;

  /**
   * Panel size dimensions.
   *
   * Enables per-session size memory. Each session remembers its chat
   * messages card dimensions, allowing users to customize the viewing
   * experience per conversation.
   */
  size: PanelSize;

  /**
   * Unix timestamp (milliseconds) when this session was last updated.
   *
   * Updated whenever:
   * - A new message is added
   * - The draft input changes
   * - The panel is moved or resized
   *
   * Used for:
   * - Sorting sessions by recency
   * - Displaying "last active" information
   * - Cleanup of stale sessions
   */
  lastUpdated: number;
}
