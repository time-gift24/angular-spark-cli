import { SessionData, PanelPosition, PanelSize } from './session-data.interface';
import { ChatMessage } from './chat-message.interface';

describe('SessionDataInterface', () => {
  describe('PanelPosition', () => {
    it('should create a valid position', () => {
      const position: PanelPosition = {
        x: 100,
        y: 50,
      };

      expect(position.x).toBe(100);
      expect(position.y).toBe(50);
    });

    it('should support zero coordinates', () => {
      const position: PanelPosition = {
        x: 0,
        y: 0,
      };

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it('should support negative coordinates', () => {
      const position: PanelPosition = {
        x: -10,
        y: -20,
      };

      expect(position.x).toBe(-10);
      expect(position.y).toBe(-20);
    });

    it('should support large coordinates', () => {
      const position: PanelPosition = {
        x: 1920,
        y: 1080,
      };

      expect(position.x).toBe(1920);
      expect(position.y).toBe(1080);
    });
  });

  describe('PanelSize', () => {
    it('should create a valid size', () => {
      const size: PanelSize = {
        width: 400,
        height: 600,
      };

      expect(size.width).toBe(400);
      expect(size.height).toBe(600);
    });

    it('should support minimum dimensions', () => {
      const size: PanelSize = {
        width: 1,
        height: 1,
      };

      expect(size.width).toBe(1);
      expect(size.height).toBe(1);
    });

    it('should support large dimensions', () => {
      const size: PanelSize = {
        width: 3840,
        height: 2160,
      };

      expect(size.width).toBe(3840);
      expect(size.height).toBe(2160);
    });
  });

  describe('SessionData', () => {
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: Date.now(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: Date.now(),
      },
    ];

    it('should create a valid session with all required properties', () => {
      const session: SessionData = {
        id: 'sess-1',
        name: 'Test Session',
        messages: mockMessages,
        inputValue: '',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      expect(session.id).toBe('sess-1');
      expect(session.name).toBe('Test Session');
      expect(session.messages).toEqual(mockMessages);
      expect(session.inputValue).toBe('');
      expect(session.position.x).toBe(100);
      expect(session.position.y).toBe(50);
      expect(session.size.width).toBe(400);
      expect(session.size.height).toBe(600);
      expect(session.lastUpdated).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve draft input value', () => {
      const session: SessionData = {
        id: 'sess-2',
        name: 'Session with Draft',
        messages: mockMessages,
        inputValue: 'What about the timeline?',
        position: { x: 200, y: 100 },
        size: { width: 500, height: 700 },
        lastUpdated: Date.now(),
      };

      expect(session.inputValue).toBe('What about the timeline?');
    });

    it('should handle empty message array', () => {
      const session: SessionData = {
        id: 'sess-3',
        name: 'New Empty Session',
        messages: [],
        inputValue: '',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      expect(session.messages).toEqual([]);
      expect(session.messages.length).toBe(0);
    });

    it('should support custom panel positions', () => {
      const session: SessionData = {
        id: 'sess-4',
        name: 'Custom Position Session',
        messages: mockMessages,
        inputValue: '',
        position: { x: 500, y: 300 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      expect(session.position.x).toBe(500);
      expect(session.position.y).toBe(300);
    });

    it('should support custom panel sizes', () => {
      const session: SessionData = {
        id: 'sess-5',
        name: 'Custom Size Session',
        messages: mockMessages,
        inputValue: '',
        position: { x: 100, y: 50 },
        size: { width: 800, height: 900 },
        lastUpdated: Date.now(),
      };

      expect(session.size.width).toBe(800);
      expect(session.size.height).toBe(900);
    });

    it('should track last updated timestamp', () => {
      const now = Date.now();
      const session: SessionData = {
        id: 'sess-6',
        name: 'Timestamp Test',
        messages: mockMessages,
        inputValue: '',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
        lastUpdated: now,
      };

      expect(session.lastUpdated).toBe(now);
    });

    it('should support sessions with multiple messages', () => {
      const manyMessages: ChatMessage[] = [
        ...mockMessages,
        {
          id: 'msg-3',
          role: 'user',
          content: 'Can you help me with TypeScript?',
          timestamp: Date.now(),
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Of course! TypeScript is a typed superset of JavaScript...',
          timestamp: Date.now(),
        },
      ];

      const session: SessionData = {
        id: 'sess-7',
        name: 'Long Conversation',
        messages: manyMessages,
        inputValue: '',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      expect(session.messages.length).toBe(4);
      expect(session.messages[0].role).toBe('user');
      expect(session.messages[1].role).toBe('assistant');
    });

    it('should preserve draft when switching sessions', () => {
      // Simulate session switching scenario
      const session1: SessionData = {
        id: 'sess-8',
        name: 'Session 1',
        messages: mockMessages,
        inputValue: 'Draft message in session 1',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      const session2: SessionData = {
        id: 'sess-9',
        name: 'Session 2',
        messages: [],
        inputValue: 'Different draft in session 2',
        position: { x: 500, y: 100 },
        size: { width: 450, height: 650 },
        lastUpdated: Date.now(),
      };

      // Verify both drafts are preserved independently
      expect(session1.inputValue).toBe('Draft message in session 1');
      expect(session2.inputValue).toBe('Different draft in session 2');
      expect(session1.id).not.toBe(session2.id);
    });

    it('should maintain per-session layout memory', () => {
      const sessions: SessionData[] = [
        {
          id: 'sess-10',
          name: 'Session A',
          messages: mockMessages,
          inputValue: '',
          position: { x: 100, y: 50 },
          size: { width: 400, height: 600 },
          lastUpdated: Date.now(),
        },
        {
          id: 'sess-11',
          name: 'Session B',
          messages: mockMessages,
          inputValue: '',
          position: { x: 600, y: 200 },
          size: { width: 500, height: 700 },
          lastUpdated: Date.now(),
        },
        {
          id: 'sess-12',
          name: 'Session C',
          messages: mockMessages,
          inputValue: '',
          position: { x: 200, y: 400 },
          size: { width: 350, height: 500 },
          lastUpdated: Date.now(),
        },
      ];

      // Verify each session has unique layout
      expect(sessions[0].position.x).toBe(100);
      expect(sessions[1].position.x).toBe(600);
      expect(sessions[2].position.x).toBe(200);

      expect(sessions[0].size.width).toBe(400);
      expect(sessions[1].size.width).toBe(500);
      expect(sessions[2].size.width).toBe(350);
    });

    it('should support special characters in session name', () => {
      const session: SessionData = {
        id: 'sess-13',
        name: 'Session with 特殊字符 & émojis 🎨',
        messages: mockMessages,
        inputValue: '',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 600 },
        lastUpdated: Date.now(),
      };

      expect(session.name).toBe('Session with 特殊字符 & émojis 🎨');
    });
  });
});
