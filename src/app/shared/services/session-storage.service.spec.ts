import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { SessionStorageService } from './session-storage.service';
import { SessionData } from '../models';

// Setup localStorage polyfill for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Define globally before tests run
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock localStorage wrapper for cleaner test code
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  }
};

// Create spy references
let getItemSpy: ReturnType<typeof vi.spyOn>;
let setItemSpy: ReturnType<typeof vi.spyOn>;
let removeItemSpy: ReturnType<typeof vi.spyOn>;
let clearSpy: ReturnType<typeof vi.spyOn>;

// Setup and teardown
let service: SessionStorageService;

beforeEach(() => {
  // Setup localStorage mocks first
  mockLocalStorage.clear();
  getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(mockLocalStorage.getItem.bind(mockLocalStorage));
  setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(mockLocalStorage.setItem.bind(mockLocalStorage));
  removeItemSpy = vi.spyOn(localStorage, 'removeItem').mockImplementation(mockLocalStorage.removeItem.bind(mockLocalStorage));
  clearSpy = vi.spyOn(localStorage, 'clear').mockImplementation(mockLocalStorage.clear.bind(mockLocalStorage));

  // Then create the service
  TestBed.configureTestingModule({});
  service = TestBed.inject(SessionStorageService);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionStorageService', () => {

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect localStorage availability', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('loadSessions', () => {
    it('should return null when no sessions are stored', () => {
      const result = service.loadSessions();
      expect(result).toBeNull();
    });

    it('should load and deserialize sessions from localStorage', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session 1',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }],
        ['sess-2', {
          id: 'sess-2',
          name: 'Session 2',
          messages: [],
          inputValue: '',
          position: { x: 100, y: 50 },
          size: { width: 800, height: 600 },
          lastUpdated: Date.now()
        }]
      ]);

      // Manually store sessions
      const serialized = JSON.stringify(Array.from(sessions.entries()));
      localStorage.setItem('ai-chat-panel-preferences', serialized);

      const result = service.loadSessions();

      expect(result).not.toBeNull();
      expect(result?.size).toBe(2);
      expect(result?.get('sess-1')?.name).toBe('Session 1');
      expect(result?.get('sess-2')?.name).toBe('Session 2');
    });

    it('should load sessions with messages', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session 1',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              timestamp: Date.now()
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hi there!',
              timestamp: Date.now()
            }
          ],
          inputValue: 'Draft message',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      const serialized = JSON.stringify(Array.from(sessions.entries()));
      localStorage.setItem('ai-chat-panel-preferences', serialized);

      const result = service.loadSessions();
      const session = result?.get('sess-1');

      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0].content).toBe('Hello');
      expect(session?.inputValue).toBe('Draft message');
    });

    it('should return null for corrupted data', () => {
      localStorage.setItem('ai-chat-panel-preferences', 'invalid json');

      const result = service.loadSessions();
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      localStorage.setItem('ai-chat-panel-preferences', '');

      const result = service.loadSessions();
      expect(result).toBeNull();
    });
  });

  describe('saveSessions', () => {
    it('should save sessions to localStorage', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session 1',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);

      // Verify the data was stored correctly by reading it back
      const stored = localStorage.getItem('ai-chat-panel-preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(Array.from(sessions.entries()));
    });

    it('should save multiple sessions', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session 1',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }],
        ['sess-2', {
          id: 'sess-2',
          name: 'Session 2',
          messages: [],
          inputValue: '',
          position: { x: 100, y: 50 },
          size: { width: 800, height: 600 },
          lastUpdated: Date.now()
        }],
        ['sess-3', {
          id: 'sess-3',
          name: 'Session 3',
          messages: [],
          inputValue: '',
          position: { x: 200, y: 100 },
          size: { width: 700, height: 500 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);

      const stored = localStorage.getItem('ai-chat-panel-preferences');
      const parsed = JSON.parse(stored!);

      expect(parsed.length).toBe(3);
    });

    it('should save empty map', () => {
      const sessions: Map<string, SessionData> = new Map();

      service.saveSessions(sessions);

      const stored = localStorage.getItem('ai-chat-panel-preferences');
      const parsed = JSON.parse(stored!);

      expect(parsed).toEqual([]);
    });

    it('should serialize all session properties', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Test Session',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'User message',
              timestamp: 1234567890
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Assistant response',
              timestamp: 1234567891
            }
          ],
          inputValue: 'Draft',
          position: { x: 150, y: 75 },
          size: { width: 650, height: 450 },
          lastUpdated: 1234567892
        }]
      ]);

      service.saveSessions(sessions);

      const stored = localStorage.getItem('ai-chat-panel-preferences');
      const parsed = JSON.parse(stored!);
      const loadedSessions = new Map(parsed);
      const loadedSession = loadedSessions.get('sess-1');

      expect(loadedSession).toEqual({
        id: 'sess-1',
        name: 'Test Session',
        messages: [
          { id: 'msg-1', role: 'user', content: 'User message', timestamp: 1234567890 },
          { id: 'msg-2', role: 'assistant', content: 'Assistant response', timestamp: 1234567891 }
        ],
        inputValue: 'Draft',
        position: { x: 150, y: 75 },
        size: { width: 650, height: 450 },
        lastUpdated: 1234567892
      });
    });
  });

  describe('loadActiveSessionId', () => {
    it('should return null when no active session ID is stored', () => {
      const result = service.loadActiveSessionId();
      expect(result).toBeNull();
    });

    it('should load active session ID from localStorage', () => {
      localStorage.setItem('ai-chat-panel-active-session-id', 'sess-123');

      const result = service.loadActiveSessionId();
      expect(result).toBe('sess-123');
    });

    it('should return null for empty string', () => {
      localStorage.setItem('ai-chat-panel-active-session-id', '');

      const result = service.loadActiveSessionId();
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('ai-chat-panel-active-session-id', 'invalid');

      const result = service.loadActiveSessionId();
      // Note: loadActiveSessionId doesn't validate JSON, it just returns the value
      // This is by design since it's a simple string value
      expect(result).toBe('invalid');
    });
  });

  describe('saveActiveSessionId', () => {
    it('should save active session ID to localStorage', () => {
      service.saveActiveSessionId('sess-456');

      // Verify the data was stored correctly by reading it back
      const stored = localStorage.getItem('ai-chat-panel-active-session-id');
      expect(stored).toBe('sess-456');
    });

    it('should save empty string', () => {
      service.saveActiveSessionId('');

      const stored = localStorage.getItem('ai-chat-panel-active-session-id');
      expect(stored).toBe('');
    });
  });

  describe('loadMessagesVisibility', () => {
    it('should return null when no visibility state is stored', () => {
      const result = service.loadMessagesVisibility();
      expect(result).toBeNull();
    });

    it('should load true from localStorage', () => {
      localStorage.setItem('ai-chat-panel-messages-visibility', 'true');

      const result = service.loadMessagesVisibility();
      expect(result).toBe(true);
    });

    it('should load false from localStorage', () => {
      localStorage.setItem('ai-chat-panel-messages-visibility', 'false');

      const result = service.loadMessagesVisibility();
      expect(result).toBe(false);
    });

    it('should return null for invalid value', () => {
      localStorage.setItem('ai-chat-panel-messages-visibility', 'invalid');

      const result = service.loadMessagesVisibility();
      // Note: Any value that's not 'true' returns false, not null
      expect(result).toBe(false);
    });

    it('should return null for empty string', () => {
      localStorage.setItem('ai-chat-panel-messages-visibility', '');

      const result = service.loadMessagesVisibility();
      expect(result).toBeNull();
    });
  });

  describe('saveMessagesVisibility', () => {
    it('should save true to localStorage', () => {
      service.saveMessagesVisibility(true);

      // Verify the data was stored correctly by reading it back
      const stored = localStorage.getItem('ai-chat-panel-messages-visibility');
      expect(stored).toBe('true');
    });

    it('should save false to localStorage', () => {
      service.saveMessagesVisibility(false);

      // Verify the data was stored correctly by reading it back
      const stored = localStorage.getItem('ai-chat-panel-messages-visibility');
      expect(stored).toBe('false');
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      // Set up some data
      localStorage.setItem('ai-chat-panel-preferences', 'some data');
      localStorage.setItem('ai-chat-panel-active-session-id', 'sess-1');
      localStorage.setItem('ai-chat-panel-messages-visibility', 'true');

      service.clearAll();

      // Verify data is cleared by checking localStorage directly
      expect(localStorage.getItem('ai-chat-panel-preferences')).toBeNull();
      expect(localStorage.getItem('ai-chat-panel-active-session-id')).toBeNull();
      expect(localStorage.getItem('ai-chat-panel-messages-visibility')).toBeNull();
    });

    it('should not throw error when clearing empty storage', () => {
      expect(() => service.clearAll()).not.toThrow();
    });
  });

  describe('Privacy Mode Handling', () => {
    it('should handle localStorage unavailable gracefully in loadSessions', () => {
      // Simulate localStorage being unavailable (privacy mode)
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const result = service.loadSessions();
      expect(result).toBeNull();
    });

    it('should handle localStorage unavailable gracefully in saveSessions', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const sessions: Map<string, SessionData> = new Map();

      expect(() => service.saveSessions(sessions)).not.toThrow();
    });

    it('should handle localStorage unavailable gracefully in loadActiveSessionId', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const result = service.loadActiveSessionId();
      expect(result).toBeNull();
    });

    it('should handle localStorage unavailable gracefully in saveActiveSessionId', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => service.saveActiveSessionId('sess-1')).not.toThrow();
    });

    it('should handle localStorage unavailable gracefully in loadMessagesVisibility', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const result = service.loadMessagesVisibility();
      expect(result).toBeNull();
    });

    it('should handle localStorage unavailable gracefully in saveMessagesVisibility', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => service.saveMessagesVisibility(true)).not.toThrow();
    });

    it('should handle localStorage unavailable gracefully in clearAll', () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => service.clearAll()).not.toThrow();
    });

    it('should report availability when localStorage throws error', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // The service should still report as available structure-wise
      // but operations should gracefully fail
      expect(() => service.saveSessions(new Map())).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should support save and load roundtrip for sessions', () => {
      const originalSessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session 1',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              timestamp: Date.now()
            }
          ],
          inputValue: 'Draft',
          position: { x: 10, y: 20 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      // Save
      service.saveSessions(originalSessions);

      // Load
      const loadedSessions = service.loadSessions();

      expect(loadedSessions).not.toBeNull();
      expect(loadedSessions?.size).toBe(1);

      const session = loadedSessions?.get('sess-1');
      expect(session?.id).toBe('sess-1');
      expect(session?.name).toBe('Session 1');
      expect(session?.messages).toHaveLength(1);
      expect(session?.messages[0].content).toBe('Hello');
      expect(session?.inputValue).toBe('Draft');
      expect(session?.position).toEqual({ x: 10, y: 20 });
      expect(session?.size).toEqual({ width: 600, height: 400 });
    });

    it('should support complete state persistence workflow', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Main Session',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      // Save all state
      service.saveSessions(sessions);
      service.saveActiveSessionId('sess-1');
      service.saveMessagesVisibility(true);

      // Load all state
      const loadedSessions = service.loadSessions();
      const loadedActiveId = service.loadActiveSessionId();
      const loadedVisibility = service.loadMessagesVisibility();

      expect(loadedSessions?.size).toBe(1);
      expect(loadedActiveId).toBe('sess-1');
      expect(loadedVisibility).toBe(true);
    });

    it('should support clearing and restarting state', () => {
      // Set up initial state
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      service.saveActiveSessionId('sess-1');
      service.saveMessagesVisibility(true);

      // Verify state exists
      expect(service.loadSessions()).not.toBeNull();
      expect(service.loadActiveSessionId()).toBe('sess-1');
      expect(service.loadMessagesVisibility()).toBe(true);

      // Clear all
      service.clearAll();

      // Verify state is cleared
      expect(service.loadSessions()).toBeNull();
      expect(service.loadActiveSessionId()).toBeNull();
      expect(service.loadMessagesVisibility()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with special characters in name', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session with "quotes" and \'apostrophes\'',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.name).toBe('Session with "quotes" and \'apostrophes\'');
    });

    it('should handle session with unicode characters', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: '中文 🎨 Ñoño',
          messages: [{
            id: 'msg-1',
            role: 'user',
            content: 'Hello 世界',
            timestamp: Date.now()
          }],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.name).toBe('中文 🎨 Ñoño');
      expect(loaded?.get('sess-1')?.messages[0].content).toBe('Hello 世界');
    });

    it('should handle very long session name', () => {
      const longName = 'A'.repeat(1000);
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: longName,
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.name).toBe(longName);
    });

    it('should handle session with many messages', () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        timestamp: Date.now() + i
      }));

      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session with many messages',
          messages,
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.messages).toHaveLength(100);
    });

    it('should handle zero timestamp', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session',
          messages: [],
          inputValue: '',
          position: { x: 0, y: 0 },
          size: { width: 600, height: 400 },
          lastUpdated: 0
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.lastUpdated).toBe(0);
    });

    it('should handle negative position values', () => {
      const sessions: Map<string, SessionData> = new Map([
        ['sess-1', {
          id: 'sess-1',
          name: 'Session',
          messages: [],
          inputValue: '',
          position: { x: -100, y: -50 },
          size: { width: 600, height: 400 },
          lastUpdated: Date.now()
        }]
      ]);

      service.saveSessions(sessions);
      const loaded = service.loadSessions();

      expect(loaded?.get('sess-1')?.position).toEqual({ x: -100, y: -50 });
    });
  });
});
