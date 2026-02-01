/**
 * Utility class for generating unique identifiers.
 *
 * This utility provides methods to generate unique IDs for sessions and messages
 * in the AI chat panel system. IDs are timestamp-based for sortability and include
 * a random component for uniqueness.
 *
 * Format: {prefix}-{timestamp}-{random}
 * - prefix: Entity type identifier (sess, msg)
 * - timestamp: Unix timestamp in milliseconds for sortability
 * - random: Random string for collision avoidance
 *
 * @example
 * ```typescript
 * const sessionId = IdGenerator.generateSessionId();
 * // Returns: 'sess-1738300800000-abc123xyz'
 *
 * const messageId = IdGenerator.generateMessageId();
 * // Returns: 'msg-1738300800000-def456uvw'
 * ```
 */
export class IdGenerator {
  /**
   * Prefix for session IDs.
   */
  private static readonly SESSION_PREFIX = 'sess';

  /**
   * Prefix for message IDs.
   */
  private static readonly MESSAGE_PREFIX = 'msg';

  /**
   * Length of the random component in generated IDs.
   */
  private static readonly RANDOM_LENGTH = 9;

  /**
   * Generates a unique session ID.
   *
   * The ID format is: {prefix}-{timestamp}-{random}
   * - prefix: 'sess' to identify this as a session
   * - timestamp: Current Unix timestamp in milliseconds (for sortability)
   * - random: 9-character random string (for uniqueness)
   *
   * The timestamp component ensures IDs can be sorted chronologically.
   * The random component reduces collision probability when multiple IDs
   * are generated in the same millisecond.
   *
   * @returns A unique session ID string
   *
   * @example
   * ```typescript
   * const sessionId = IdGenerator.generateSessionId();
   * console.log(sessionId); // 'sess-1738300800000-abc123xyz'
   * ```
   */
  static generateSessionId(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString();
    return `${this.SESSION_PREFIX}-${timestamp}-${random}`;
  }

  /**
   * Generates a unique message ID.
   *
   * The ID format is: {prefix}-{timestamp}-{random}
   * - prefix: 'msg' to identify this as a message
   * - timestamp: Current Unix timestamp in milliseconds (for sortability)
   * - random: 9-character random string (for uniqueness)
   *
   * The timestamp component ensures IDs can be sorted chronologically.
   * The random component reduces collision probability when multiple IDs
   * are generated in the same millisecond.
   *
   * @returns A unique message ID string
   *
   * @example
   * ```typescript
   * const messageId = IdGenerator.generateMessageId();
   * console.log(messageId); // 'msg-1738300800000-def456uvw'
   * ```
   */
  static generateMessageId(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString();
    return `${this.MESSAGE_PREFIX}-${timestamp}-${random}`;
  }

  /**
   * Generates a random alphanumeric string.
   *
   * Uses Math.random() converted to base-36 (0-9, a-z) to create
   * a random string component for IDs.
   *
   * Handles the edge case where Math.random() returns 0 by ensuring
   * the string always has the correct length through padding if needed.
   *
   * Note: Math.random() is not cryptographically secure, but is acceptable
   * for this use case as these IDs are for session management, not security.
   *
   * @private
   * @returns A random string of exactly 9 characters
   */
  private static generateRandomString(): string {
    // Generate random string using base-36 encoding
    let random = Math.random().toString(36).substring(2);

    // Handle edge case: if Math.random() returns 0, pad with zeros
    // This ensures we always get exactly RANDOM_LENGTH characters
    while (random.length < this.RANDOM_LENGTH) {
      random += Math.random().toString(36).substring(2);
    }

    return random.substring(0, this.RANDOM_LENGTH);
  }

  /**
   * Checks if an ID already exists in the given set.
   *
   * This method provides collision detection for ID generation. It is designed
   * to be used by SessionStateService (Phase 2.1) when creating new sessions to
   * ensure no duplicate session IDs are created.
   *
   * Current Usage:
   * - Not currently called by generateSessionId() or generateMessageId()
   * - The timestamp + random combination makes collisions extremely unlikely
   * - Will be integrated in Phase 2.1 when SessionStateService is implemented
   *
   * Design Rationale:
   * - The optional existingIds parameter allows flexibility
   * - Returns false when no Set is provided (no collision checking needed yet)
   * - Will be called with SessionStateService's sessions Map keys in Phase 2.1
   *
   * @param id - The ID to check for collisions
   * @param existingIds - Optional set of existing IDs to check against.
   *                      When omitted, returns false (no collision)
   * @returns true if the ID exists in the set (collision detected), false otherwise
   *
   * @example
   * ```typescript
   * // Example usage in Phase 2.1 (SessionStateService):
   * const existingSessionIds = new Set([
   *   'sess-1738300800000-abc123xyz',
   *   'sess-1738300801000-def456uvw'
   * ]);
   *
   * const newId = IdGenerator.generateSessionId();
   * const hasCollision = IdGenerator['checkCollision'](newId, existingSessionIds);
   *
   * if (hasCollision) {
   *   // Regenerate ID with different timestamp
   * }
   * ```
   *
   * @private
   */
  private static checkCollision(id: string, existingIds?: Set<string>): boolean {
    if (!existingIds) {
      return false;
    }
    return existingIds.has(id);
  }
}
