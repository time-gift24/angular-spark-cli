import { PanelState } from './panel-state.interface';
import { SessionData } from './session-data.interface';
import { ChatMessage } from './chat-message.interface';

describe('PanelStateInterface', () => {
  const createMockSession = (id: string, name: string): SessionData => ({
    id,
    name,
    messages: [
      {
        id: `msg-${id}-1`,
        role: 'user',
        content: `Message from ${name}`,
        timestamp: Date.now(),
      },
    ],
    inputValue: '',
    position: { x: 100, y: 50 },
    size: { width: 400, height: 600 },
    lastUpdated: Date.now(),
  });

  describe('PanelState structure', () => {
    it('should create a valid panel state with all required properties', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      expect(state.sessions).toBeInstanceOf(Map);
      expect(state.activeSessionId).toBe('sess-1');
      expect(state.isMessagesVisible).toBe(true);
    });

    it('should support empty sessions map', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: false,
      };

      expect(state.sessions.size).toBe(0);
      expect(state.activeSessionId).toBe('');
      expect(state.isMessagesVisible).toBe(false);
    });

    it('should support multiple sessions in the map', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));
      sessions.set('sess-3', createMockSession('sess-3', 'Session 3'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-2',
        isMessagesVisible: true,
      };

      expect(state.sessions.size).toBe(3);
      expect(state.sessions.get('sess-1')?.name).toBe('Session 1');
      expect(state.sessions.get('sess-2')?.name).toBe('Session 2');
      expect(state.sessions.get('sess-3')?.name).toBe('Session 3');
    });
  });

  describe('sessions Map', () => {
    it('should support O(1) lookup by session ID', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      const session = state.sessions.get('sess-1');
      expect(session).toBeDefined();
      expect(session?.id).toBe('sess-1');
      expect(session?.name).toBe('Session 1');
    });

    it('should return undefined for non-existent session ID', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      const session = state.sessions.get('non-existent');
      expect(session).toBeUndefined();
    });

    it('should maintain insertion order', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'First'));
      sessions.set('sess-2', createMockSession('sess-2', 'Second'));
      sessions.set('sess-3', createMockSession('sess-3', 'Third'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      const keys = Array.from(state.sessions.keys());
      expect(keys).toEqual(['sess-1', 'sess-2', 'sess-3']);
    });

    it('should support adding new sessions dynamically', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: true,
      };

      expect(state.sessions.size).toBe(0);

      state.sessions.set('sess-1', createMockSession('sess-1', 'New Session'));
      expect(state.sessions.size).toBe(1);
      expect(state.sessions.get('sess-1')?.name).toBe('New Session');
    });

    it('should support deleting sessions', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      expect(state.sessions.size).toBe(2);

      state.sessions.delete('sess-1');
      expect(state.sessions.size).toBe(1);
      expect(state.sessions.get('sess-1')).toBeUndefined();
      expect(state.sessions.get('sess-2')).toBeDefined();
    });

    it('should support checking if session exists', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      expect(state.sessions.has('sess-1')).toBe(true);
      expect(state.sessions.has('sess-999')).toBe(false);
    });

    it('should support iterating over all sessions', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      const names: string[] = [];
      for (const [id, session] of state.sessions) {
        names.push(session.name);
      }

      expect(names).toEqual(['Session 1', 'Session 2']);
    });

    it('should support clearing all sessions', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      expect(state.sessions.size).toBe(2);

      state.sessions.clear();
      expect(state.sessions.size).toBe(0);
    });
  });

  describe('activeSessionId', () => {
    it('should track the currently active session', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-2',
        isMessagesVisible: true,
      };

      expect(state.activeSessionId).toBe('sess-2');
      expect(state.sessions.get(state.activeSessionId)?.name).toBe('Session 2');
    });

    it('should support switching active session', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      expect(state.activeSessionId).toBe('sess-1');

      state.activeSessionId = 'sess-2';
      expect(state.activeSessionId).toBe('sess-2');
    });

    it('should support empty string as activeSessionId when no sessions', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: false,
      };

      expect(state.activeSessionId).toBe('');
      expect(state.sessions.get(state.activeSessionId)).toBeUndefined();
    });

    it('should handle special characters in session ID', () => {
      const sessions = new Map<string, SessionData>();
      const specialId = 'sess-with-special-chars-123';
      sessions.set(specialId, createMockSession(specialId, 'Special Session'));

      const state: PanelState = {
        sessions,
        activeSessionId: specialId,
        isMessagesVisible: true,
      };

      expect(state.activeSessionId).toBe(specialId);
      expect(state.sessions.get(specialId)).toBeDefined();
    });
  });

  describe('isMessagesVisible', () => {
    it('should support showing messages card', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: true,
      };

      expect(state.isMessagesVisible).toBe(true);
    });

    it('should support hiding messages card', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: false,
      };

      expect(state.isMessagesVisible).toBe(false);
    });

    it('should support toggling visibility', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: true,
      };

      expect(state.isMessagesVisible).toBe(true);

      state.isMessagesVisible = false;
      expect(state.isMessagesVisible).toBe(false);

      state.isMessagesVisible = true;
      expect(state.isMessagesVisible).toBe(true);
    });

    it('should maintain visibility independent of session state', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      // Add new session
      state.sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));
      expect(state.isMessagesVisible).toBe(true);

      // Switch active session
      state.activeSessionId = 'sess-2';
      expect(state.isMessagesVisible).toBe(true);

      // Toggle visibility
      state.isMessagesVisible = false;
      expect(state.isMessagesVisible).toBe(false);

      // Verify sessions unaffected
      expect(state.sessions.size).toBe(2);
      expect(state.activeSessionId).toBe('sess-2');
    });
  });

  describe('Integration scenarios', () => {
    it('should manage complete panel lifecycle', () => {
      // Initial state: no sessions, messages hidden
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: false,
      };

      expect(state.sessions.size).toBe(0);
      expect(state.isMessagesVisible).toBe(false);

      // User creates first session and shows panel
      const session1 = createMockSession('sess-1', 'My Chat');
      state.sessions.set('sess-1', session1);
      state.activeSessionId = 'sess-1';
      state.isMessagesVisible = true;

      expect(state.sessions.size).toBe(1);
      expect(state.activeSessionId).toBe('sess-1');
      expect(state.isMessagesVisible).toBe(true);

      // User creates second session and switches to it
      const session2 = createMockSession('sess-2', 'Work Chat');
      state.sessions.set('sess-2', session2);
      state.activeSessionId = 'sess-2';

      expect(state.sessions.size).toBe(2);
      expect(state.activeSessionId).toBe('sess-2');
      expect(state.isMessagesVisible).toBe(true);

      // User hides panel
      state.isMessagesVisible = false;

      expect(state.isMessagesVisible).toBe(false);
      expect(state.sessions.size).toBe(2); // Sessions preserved
      expect(state.activeSessionId).toBe('sess-2'); // Active session preserved
    });

    it('should handle session deletion with active session update', () => {
      const sessions = new Map<string, SessionData>();
      sessions.set('sess-1', createMockSession('sess-1', 'Session 1'));
      sessions.set('sess-2', createMockSession('sess-2', 'Session 2'));
      sessions.set('sess-3', createMockSession('sess-3', 'Session 3'));

      const state: PanelState = {
        sessions,
        activeSessionId: 'sess-2',
        isMessagesVisible: true,
      };

      // Delete active session
      state.sessions.delete('sess-2');
      state.activeSessionId = 'sess-1'; // Switch to another session

      expect(state.sessions.size).toBe(2);
      expect(state.activeSessionId).toBe('sess-1');
      expect(state.sessions.has('sess-2')).toBe(false);
    });

    it('should support per-session draft preservation', () => {
      const session1: SessionData = {
        ...createMockSession('sess-1', 'Session 1'),
        inputValue: 'Draft in session 1',
      };

      const session2: SessionData = {
        ...createMockSession('sess-2', 'Session 2'),
        inputValue: 'Draft in session 2',
      };

      const state: PanelState = {
        sessions: new Map([
          ['sess-1', session1],
          ['sess-2', session2],
        ]),
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      // Verify drafts preserved
      expect(state.sessions.get('sess-1')?.inputValue).toBe('Draft in session 1');
      expect(state.sessions.get('sess-2')?.inputValue).toBe('Draft in session 2');

      // Switch active session
      state.activeSessionId = 'sess-2';

      // Verify both drafts still preserved
      expect(state.sessions.get('sess-1')?.inputValue).toBe('Draft in session 1');
      expect(state.sessions.get('sess-2')?.inputValue).toBe('Draft in session 2');
    });

    it('should support per-session layout memory', () => {
      const session1: SessionData = {
        ...createMockSession('sess-1', 'Session 1'),
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
      };

      const session2: SessionData = {
        ...createMockSession('sess-2', 'Session 2'),
        position: { x: 500, y: 200 },
        size: { width: 500, height: 700 },
      };

      const state: PanelState = {
        sessions: new Map([
          ['sess-1', session1],
          ['sess-2', session2],
        ]),
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      // Verify layout memory
      expect(state.sessions.get('sess-1')?.position).toEqual({ x: 100, y: 50 });
      expect(state.sessions.get('sess-2')?.position).toEqual({ x: 500, y: 200 });
    });
  });

  describe('Type safety', () => {
    it('should enforce Map type for sessions', () => {
      const state: PanelState = {
        sessions: new Map<string, SessionData>(),
        activeSessionId: '',
        isMessagesVisible: false,
      };

      // This should type-check correctly
      const sessionMap: Map<string, SessionData> = state.sessions;
      expect(sessionMap).toBeInstanceOf(Map);
    });

    it('should enforce string type for activeSessionId', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: 'sess-1',
        isMessagesVisible: true,
      };

      const sessionId: string = state.activeSessionId;
      expect(typeof sessionId).toBe('string');
    });

    it('should enforce boolean type for isMessagesVisible', () => {
      const state: PanelState = {
        sessions: new Map(),
        activeSessionId: '',
        isMessagesVisible: true,
      };

      const visible: boolean = state.isMessagesVisible;
      expect(typeof visible).toBe('boolean');
    });
  });
});
