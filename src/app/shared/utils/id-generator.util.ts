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
   * @private
   * @returns A random string of length 9
   */
  private static generateRandomString(): string {
    return Math.random().toString(36).substring(2, 2 + this.RANDOM_LENGTH);
  }

  /**
   * Checks if an ID already exists in the given set.
   *
   * This method is used for collision detection. In the current implementation,
   * it returns false (no collision) as the timestamp + random combination
   * makes collisions extremely unlikely.
   *
   * Future implementations may integrate with SessionStateService's sessions
   * Map to provide actual collision detection when needed.
   *
   * @param id - The ID to check for collisions
   * @param existingIds - Optional set of existing IDs to check against
   * @returns true if the ID exists (collision), false otherwise
   *
   * @example
   * ```typescript
   * const existingIds = new Set(['sess-123', 'msg-456']);
   * const hasCollision = IdGenerator['checkCollision']('sess-123', existingIds);
   * console.log(hasCollision); // true
   * ```
   *
   * @private
   */
  private static checkCollision(
    id: string,
    existingIds?: Set<string>
  ): boolean {
    if (!existingIds) {
      return false;
    }
    return existingIds.has(id);
  }
}
