import { IdGenerator } from './id-generator.util';

describe('IdGenerator', () => {
  describe('generateSessionId', () => {
    it('should generate a session ID with correct format', () => {
      const sessionId = IdGenerator.generateSessionId();

      // Format: sess-{timestamp}-{random}
      const formatRegex = /^sess-\d{13}-[a-z0-9]{9}$/;
      expect(sessionId).toMatch(formatRegex);
    });

    it('should start with "sess-" prefix', () => {
      const sessionId = IdGenerator.generateSessionId();
      expect(sessionId).toMatch(/^sess-/);
    });

    it('should include a valid timestamp component', () => {
      const sessionId = IdGenerator.generateSessionId();
      const parts = sessionId.split('-');
      const timestamp = parseInt(parts[1], 10);

      // Timestamp should be a valid Unix timestamp in milliseconds
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());

      // Should be 13 digits (millisecond precision)
      expect(parts[1]).toHaveLength(13);
    });

    it('should include a random component', () => {
      const sessionId = IdGenerator.generateSessionId();
      const parts = sessionId.split('-');

      // Random part should be 9 characters
      expect(parts[2]).toHaveLength(9);

      // Should be alphanumeric (lowercase)
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = IdGenerator.generateSessionId();
      const id2 = IdGenerator.generateSessionId();

      expect(id1).not.toBe(id2);
    });

    it('should generate multiple unique IDs in quick succession', () => {
      const ids = new Set<string>();

      // Generate 100 IDs rapidly
      for (let i = 0; i < 100; i++) {
        ids.add(IdGenerator.generateSessionId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });

    it('should generate IDs that are chronologically sortable', async () => {
      // Delay to ensure different timestamps
      const id1 = IdGenerator.generateSessionId();

      // Small delay to ensure timestamp increment
      await new Promise((resolve) => setTimeout(resolve, 2));

      const id2 = IdGenerator.generateSessionId();

      const timestamp1 = parseInt(id1.split('-')[1], 10);
      const timestamp2 = parseInt(id2.split('-')[1], 10);

      expect(timestamp2).toBeGreaterThan(timestamp1);
    });
  });

  describe('generateMessageId', () => {
    it('should generate a message ID with correct format', () => {
      const messageId = IdGenerator.generateMessageId();

      // Format: msg-{timestamp}-{random}
      const formatRegex = /^msg-\d{13}-[a-z0-9]{9}$/;
      expect(messageId).toMatch(formatRegex);
    });

    it('should start with "msg-" prefix', () => {
      const messageId = IdGenerator.generateMessageId();
      expect(messageId).toMatch(/^msg-/);
    });

    it('should include a valid timestamp component', () => {
      const messageId = IdGenerator.generateMessageId();
      const parts = messageId.split('-');
      const timestamp = parseInt(parts[1], 10);

      // Timestamp should be a valid Unix timestamp in milliseconds
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());

      // Should be 13 digits (millisecond precision)
      expect(parts[1]).toHaveLength(13);
    });

    it('should include a random component', () => {
      const messageId = IdGenerator.generateMessageId();
      const parts = messageId.split('-');

      // Random part should be 9 characters
      expect(parts[2]).toHaveLength(9);

      // Should be alphanumeric (lowercase)
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = IdGenerator.generateMessageId();
      const id2 = IdGenerator.generateMessageId();

      expect(id1).not.toBe(id2);
    });

    it('should generate multiple unique IDs in quick succession', () => {
      const ids = new Set<string>();

      // Generate 100 IDs rapidly
      for (let i = 0; i < 100; i++) {
        ids.add(IdGenerator.generateMessageId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });

    it('should generate IDs that are chronologically sortable', async () => {
      // Delay to ensure different timestamps
      const id1 = IdGenerator.generateMessageId();

      // Small delay to ensure timestamp increment
      await new Promise((resolve) => setTimeout(resolve, 2));

      const id2 = IdGenerator.generateMessageId();

      const timestamp1 = parseInt(id1.split('-')[1], 10);
      const timestamp2 = parseInt(id2.split('-')[1], 10);

      expect(timestamp2).toBeGreaterThan(timestamp1);
    });
  });

  describe('ID Differentiation', () => {
    it('should distinguish between session and message IDs', () => {
      const sessionId = IdGenerator.generateSessionId();
      const messageId = IdGenerator.generateMessageId();

      expect(sessionId).toMatch(/^sess-/);
      expect(messageId).toMatch(/^msg-/);

      expect(sessionId).not.toMatch(/^msg-/);
      expect(messageId).not.toMatch(/^sess-/);
    });

    it('should allow coexistence of session and message IDs', () => {
      const allIds = new Set<string>();

      // Generate mix of session and message IDs
      for (let i = 0; i < 50; i++) {
        allIds.add(IdGenerator.generateSessionId());
        allIds.add(IdGenerator.generateMessageId());
      }

      // All IDs should be unique regardless of type
      expect(allIds.size).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid ID generation without collisions', () => {
      const ids = new Set<string>();

      // Generate IDs as fast as possible
      for (let i = 0; i < 1000; i++) {
        ids.add(IdGenerator.generateSessionId());
      }

      // Should have 1000 unique IDs despite potential same-millisecond generation
      expect(ids.size).toBe(1000);
    });

    it('should handle edge case where Math.random() returns very small values', () => {
      // Test that we always get 9-character random strings
      // even when Math.random() returns values close to 0
      const ids: string[] = [];

      // Generate many IDs to increase chance of hitting edge cases
      for (let i = 0; i < 100; i++) {
        ids.push(IdGenerator.generateSessionId());
        ids.push(IdGenerator.generateMessageId());
      }

      // All IDs should have exactly 9 characters in the random part
      ids.forEach((id) => {
        const parts = id.split('-');
        expect(parts[2]).toHaveLength(9);
        expect(parts[2]).toMatch(/^[a-z0-9]{9}$/);
      });
    });

    it('should generate valid IDs at system time boundaries', () => {
      // Generate IDs around a timestamp change
      const ids: string[] = [];

      for (let i = 0; i < 10; i++) {
        ids.push(IdGenerator.generateSessionId());
        ids.push(IdGenerator.generateMessageId());
      }

      // All should be valid format
      ids.forEach((id) => {
        if (id.startsWith('sess-')) {
          expect(id).toMatch(/^sess-\d{13}-[a-z0-9]{9}$/);
        } else if (id.startsWith('msg-')) {
          expect(id).toMatch(/^msg-\d{13}-[a-z0-9]{9}$/);
        }
      });
    });

    it('should handle high-volume generation', () => {
      const sessionIds = new Set<string>();
      const messageIds = new Set<string>();

      // Generate 500 of each type
      for (let i = 0; i < 500; i++) {
        sessionIds.add(IdGenerator.generateSessionId());
        messageIds.add(IdGenerator.generateMessageId());
      }

      expect(sessionIds.size).toBe(500);
      expect(messageIds.size).toBe(500);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support typical chat session workflow', () => {
      // Simulate creating a new session
      const sessionId = IdGenerator.generateSessionId();

      // Simulate adding messages to that session
      const message1 = IdGenerator.generateMessageId();
      const message2 = IdGenerator.generateMessageId();
      const message3 = IdGenerator.generateMessageId();

      // All IDs should be unique
      const allIds = new Set([sessionId, message1, message2, message3]);
      expect(allIds.size).toBe(4);

      // Session and message IDs should be distinguishable
      expect(sessionId.startsWith('sess-')).toBe(true);
      expect(message1.startsWith('msg-')).toBe(true);
      expect(message2.startsWith('msg-')).toBe(true);
      expect(message3.startsWith('msg-')).toBe(true);
    });

    it('should demonstrate collision detection usage for Phase 2.1', () => {
      // This test demonstrates how checkCollision will be used in Phase 2.1
      // when SessionStateService is implemented
      const existingIds = new Set<string>([
        'sess-1738300800000-abc123xyz',
        'sess-1738300801000-def456uvw',
        'msg-1738300802000-ghi789rst',
      ]);

      // Access the private method using bracket notation for testing
      const checkCollision = IdGenerator['checkCollision'] as (
        id: string,
        existingIds?: Set<string>,
      ) => boolean;

      // Test existing ID - should detect collision
      const existingId = 'sess-1738300800000-abc123xyz';
      expect(checkCollision(existingId, existingIds)).toBe(true);

      // Test new ID - should not detect collision
      const newId = 'sess-1738300803000-jkl012mno';
      expect(checkCollision(newId, existingIds)).toBe(false);

      // Test with no existingIds set - should return false (no collision)
      expect(checkCollision(newId)).toBe(false);
    });

    it('should support multiple concurrent sessions', () => {
      const sessions = new Map<string, string[]>();

      // Create 5 sessions with messages each
      for (let i = 0; i < 5; i++) {
        const sessionId = IdGenerator.generateSessionId();
        const messages: string[] = [];

        // Each session gets 3 messages
        for (let j = 0; j < 3; j++) {
          messages.push(IdGenerator.generateMessageId());
        }

        sessions.set(sessionId, messages);
      }

      // Verify all session IDs are unique
      const sessionIds = Array.from(sessions.keys());
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(5);

      // Verify all message IDs across all sessions are unique
      const allMessages = sessionIds.flatMap((id) => sessions.get(id)!);
      const uniqueMessageIds = new Set(allMessages);
      expect(uniqueMessageIds.size).toBe(15); // 5 sessions * 3 messages

      // Verify no overlap between session and message IDs
      const allIds = new Set([...sessionIds, ...allMessages]);
      expect(allIds.size).toBe(20); // 5 + 15
    });
  });
});
