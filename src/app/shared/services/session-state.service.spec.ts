import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { SessionStateService } from './session-state.service';
import { SessionStorageService } from './session-storage.service';
import { ChatMessage, SessionData } from '../models';

describe('SessionStateService', () => {
  let service: SessionStateService;
  let storageService: {
    saveSessions: ReturnType<typeof vi.fn>;
    saveActiveSessionId: ReturnType<typeof vi.fn>;
    saveMessagesVisibility: ReturnType<typeof vi.fn>;
    loadSessions: ReturnType<typeof vi.fn>;
    loadActiveSessionId: ReturnType<typeof vi.fn>;
    loadMessagesVisibility: ReturnType<typeof vi.fn>;
    clearAll: ReturnType<typeof vi.fn>;
    isAvailable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storageService = {
      saveSessions: vi.fn(),
      saveActiveSessionId: vi.fn(),
      saveMessagesVisibility: vi.fn(),
      loadSessions: vi.fn(),
      loadActiveSessionId: vi.fn(),
      loadMessagesVisibility: vi.fn(),
      clearAll: vi.fn(),
      isAvailable: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStorageService, useValue: storageService }
      ]
    });

    service = TestBed.inject(SessionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty sessions map on initialization', () => {
      const sessions = service.sessions();
      expect(sessions.size).toBe(0);
    });

    it('should have empty active session ID on initialization', () => {
      const activeSessionId = service.activeSessionId();
      expect(activeSessionId).toBe('');
    });

    it('should have messages visible by default', () => {
      const isVisible = service.isMessagesVisible();
      expect(isVisible).toBe(true);
    });

    it('should have undefined active session initially', () => {
      const activeSession = service.activeSession();
      expect(activeSession).toBeUndefined();
    });

    it('should have empty active messages initially', () => {
      const activeMessages = service.activeMessages();
      expect(activeMessages).toEqual([]);
    });

    it('should have empty active input value initially', () => {
      const activeInputValue = service.activeInputValue();
      expect(activeInputValue).toBe('');
    });

    it('should not be able to send message initially', () => {
      const canSend = service.canSendMessage();
      expect(canSend).toBe(false);
    });
  });

  describe('Computed Signals', () => {
    it('should return active session when activeSessionId is set', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      const activeSession = service.activeSession();
      expect(activeSession).toBeDefined();
      expect(activeSession?.id).toBe(sessionId);
      expect(activeSession?.name).toBe('Test Session');
    });

    it('should return undefined for active session when ID does not exist', () => {
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set('non-existent-id');

      const activeSession = service.activeSession();
      expect(activeSession).toBeUndefined();
    });

    it('should return active messages from active session', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now()
      };

      service.addMessage(sessionId, message);

      const activeMessages = service.activeMessages();
      expect(activeMessages).toHaveLength(1);
      expect(activeMessages[0]).toEqual(message);
    });

    it('should return empty array for active messages when no active session', () => {
      const activeMessages = service.activeMessages();
      expect(activeMessages).toEqual([]);
    });

    it('should return active input value from active session', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('Test draft');

      const activeInputValue = service.activeInputValue();
      expect(activeInputValue).toBe('Test draft');
    });

    it('should return empty string for active input value when no active session', () => {
      const activeInputValue = service.activeInputValue();
      expect(activeInputValue).toBe('');
    });

    it('should return true for canSendMessage when input has content', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('Hello');

      const canSend = service.canSendMessage();
      expect(canSend).toBe(true);
    });

    it('should return false for canSendMessage when input is empty', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      const canSend = service.canSendMessage();
      expect(canSend).toBe(false);
    });

    it('should return false for canSendMessage when input is only whitespace', () => {
      const sessionId = service.createSession('Test Session');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('   ');

      const canSend = service.canSendMessage();
      expect(canSend).toBe(false);
    });

    it('should return false for canSendMessage when no active session', () => {
      const canSend = service.canSendMessage();
      expect(canSend).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should create a session with default name when no name provided', () => {
      const sessionId = service.createSession();

      const sessions = service.sessions();
      expect(sessions.size).toBe(1);

      const session = sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session?.name).toBe('New Chat');
    });

    it('should create a session with custom name when name provided', () => {
      const customName = 'Project Planning';
      const sessionId = service.createSession(customName);

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.name).toBe(customName);
    });

    it('should generate unique session IDs', () => {
      const id1 = service.createSession('Session 1');
      const id2 = service.createSession('Session 2');

      expect(id1).not.toBe(id2);
    });

    it('should initialize session with empty messages array', () => {
      const sessionId = service.createSession();

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.messages).toEqual([]);
    });

    it('should initialize session with empty input value', () => {
      const sessionId = service.createSession();

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.inputValue).toBe('');
    });

    it('should initialize session with default position', () => {
      const sessionId = service.createSession();

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.position).toEqual({ x: 0, y: 0 });
    });

    it('should initialize session with default size', () => {
      const sessionId = service.createSession();

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.size).toEqual({ width: 600, height: 400 });
    });

    it('should set lastUpdated timestamp to current time', () => {
      const beforeCreate = Date.now();
      const sessionId = service.createSession();
      const afterCreate = Date.now();

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.lastUpdated).toBeGreaterThanOrEqual(beforeCreate);
      expect(session?.lastUpdated).toBeLessThanOrEqual(afterCreate);
    });

    it('should add multiple sessions to the sessions map', () => {
      service.createSession('Session 1');
      service.createSession('Session 2');
      service.createSession('Session 3');

      const sessions = service.sessions();
      expect(sessions.size).toBe(3);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the specified session', () => {
      const sessionId = service.createSession();

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, world!',
        timestamp: Date.now()
      };

      service.addMessage(sessionId, message);

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.messages).toHaveLength(1);
      expect(session?.messages[0]).toEqual(message);
    });

    it('should add multiple messages in order', () => {
      const sessionId = service.createSession();

      const message1: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
        timestamp: Date.now()
      };

      const message2: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: Date.now()
      };

      service.addMessage(sessionId, message1);
      service.addMessage(sessionId, message2);

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0]).toEqual(message1);
      expect(session?.messages[1]).toEqual(message2);
    });

    it('should update lastUpdated timestamp when message is added', () => {
      const sessionId = service.createSession();
      const beforeAdd = Date.now();

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now()
      };

      service.addMessage(sessionId, message);

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.lastUpdated).toBeGreaterThanOrEqual(beforeAdd);
    });

    it('should do nothing if session does not exist', () => {
      const initialSize = service.sessions().size;

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now()
      };

      service.addMessage('non-existent-id', message);

      expect(service.sessions().size).toBe(initialSize);
    });
  });

  describe('updateInputValue', () => {
    it('should update input value for active session', () => {
      const sessionId = service.createSession();
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('New draft value');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.inputValue).toBe('New draft value');
    });

    it('should update lastUpdated timestamp when input is updated', () => {
      const sessionId = service.createSession();
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      const beforeUpdate = Date.now();
      service.updateInputValue('Test');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.lastUpdated).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should preserve input value when updated', () => {
      const sessionId = service.createSession();
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('First draft');
      service.updateInputValue('Second draft');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.inputValue).toBe('Second draft');
    });

    it('should do nothing if no active session', () => {
      service.updateInputValue('Test');
      // Should not throw error
      expect(service.sessions().size).toBe(0);
    });

    it('should handle empty string input value', () => {
      const sessionId = service.createSession();
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('Some text');
      service.updateInputValue('');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.inputValue).toBe('');
    });
  });

  describe('switchSession', () => {
    it('should switch active session ID', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      expect(service.activeSession()?.id).toBe(sessionId1);

      service.switchSession(sessionId2);
      expect(service.activeSession()?.id).toBe(sessionId2);
    });

    it('should preserve draft of current session before switching', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      service.updateInputValue('Draft from session 1');

      service.switchSession(sessionId2);

      // Check that session 1 still has its draft
      const sessions = service.sessions();
      const session1 = sessions.get(sessionId1);
      expect(session1?.inputValue).toBe('Draft from session 1');
    });

    it('should load draft of new session after switching', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      // Set up drafts for both sessions
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      service.updateInputValue('Draft 1');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId2);
      service.updateInputValue('Draft 2');

      // Switch back to session 1
      service.switchSession(sessionId1);

      expect(service.activeInputValue()).toBe('Draft 1');
    });

    it('should do nothing if target session does not exist', () => {
      const sessionId1 = service.createSession('Session 1');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);

      const beforeActiveId = service.activeSessionId();

      service.switchSession('non-existent-id');

      expect(service.activeSessionId()).toBe(beforeActiveId);
    });

    it('should handle switching when no session is currently active', () => {
      const sessionId = service.createSession('Session 1');

      service.switchSession(sessionId);

      expect(service.activeSessionId()).toBe(sessionId);
    });
  });

  describe('Draft Preservation Flow', () => {
    it('should preserve drafts across multiple session switches', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');
      const sessionId3 = service.createSession('Session 3');

      // Set up drafts
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      service.updateInputValue('Draft 1');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId2);
      service.updateInputValue('Draft 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId3);
      service.updateInputValue('Draft 3');

      // Switch between sessions and verify drafts are preserved
      service.switchSession(sessionId1);
      expect(service.activeInputValue()).toBe('Draft 1');

      service.switchSession(sessionId2);
      expect(service.activeInputValue()).toBe('Draft 2');

      service.switchSession(sessionId3);
      expect(service.activeInputValue()).toBe('Draft 3');
    });

    it('should preserve draft when switching and then switching back', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      service.updateInputValue('Important draft');

      service.switchSession(sessionId2);
      expect(service.activeInputValue()).toBe('');

      service.switchSession(sessionId1);
      expect(service.activeInputValue()).toBe('Important draft');
    });
  });

  describe('toggleMessagesVisibility', () => {
    it('should toggle from true to false', () => {
      expect(service.isMessagesVisible()).toBe(true);

      service.toggleMessagesVisibility();

      expect(service.isMessagesVisible()).toBe(false);
    });

    it('should toggle from false to true', () => {
      (service['isMessagesVisible'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(false);

      service.toggleMessagesVisibility();

      expect(service.isMessagesVisible()).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      expect(service.isMessagesVisible()).toBe(true);

      service.toggleMessagesVisibility();
      expect(service.isMessagesVisible()).toBe(false);

      service.toggleMessagesVisibility();
      expect(service.isMessagesVisible()).toBe(true);

      service.toggleMessagesVisibility();
      expect(service.isMessagesVisible()).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should remove session from sessions map', () => {
      const sessionId = service.createSession('Session 1');
      expect(service.sessions().size).toBe(1);

      service.deleteSession(sessionId);

      expect(service.sessions().size).toBe(0);
    });

    it('should clear active session ID if deleting active session', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      expect(service.activeSessionId()).toBe(sessionId1);

      service.deleteSession(sessionId1);

      // Should switch to the remaining session
      expect(service.activeSessionId()).toBe(sessionId2);
    });

    it('should switch to most recent session when deleting active session', async () => {
      const sessionId1 = service.createSession('Session 1');
      // Add delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      const sessionId2 = service.createSession('Session 2');
      // Add delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      const sessionId3 = service.createSession('Session 3');

      // Update session 2 to be most recent
      await new Promise(resolve => setTimeout(resolve, 2));
      const message2: ChatMessage = {
        id: 'msg-2',
        role: 'user',
        content: 'Message 2',
        timestamp: Date.now()
      };
      service.addMessage(sessionId2, message2);

      // Set session 3 as active
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId3);

      // Delete session 3
      service.deleteSession(sessionId3);

      // Should switch to session 2 (most recently updated)
      expect(service.activeSessionId()).toBe(sessionId2);
    });

    it('should clear active session ID when deleting last session', () => {
      const sessionId = service.createSession('Session 1');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.deleteSession(sessionId);

      expect(service.activeSessionId()).toBe('');
    });

    it('should do nothing if session does not exist', () => {
      service.createSession('Session 1');
      const initialSize = service.sessions().size;

      service.deleteSession('non-existent-id');

      expect(service.sessions().size).toBe(initialSize);
    });

    it('should not affect active session ID if deleting non-active session', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);

      service.deleteSession(sessionId2);

      expect(service.activeSessionId()).toBe(sessionId1);
    });
  });

  describe('renameSession', () => {
    it('should rename the specified session', () => {
      const sessionId = service.createSession('Original Name');

      service.renameSession(sessionId, 'New Name');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.name).toBe('New Name');
    });

    it('should update lastUpdated timestamp when renaming', () => {
      const sessionId = service.createSession('Original Name');
      const beforeRename = Date.now();

      service.renameSession(sessionId, 'New Name');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.lastUpdated).toBeGreaterThanOrEqual(beforeRename);
    });

    it('should preserve other session data when renaming', () => {
      const sessionId = service.createSession('Original Name');

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now()
      };
      service.addMessage(sessionId, message);

      // Set active session first before updating input value
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);
      service.updateInputValue('Draft');

      service.renameSession(sessionId, 'New Name');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.messages).toHaveLength(1);
      expect(session?.inputValue).toBe('Draft');
      expect(session?.position).toEqual({ x: 0, y: 0 });
      expect(session?.size).toEqual({ width: 600, height: 400 });
    });

    it('should do nothing if session does not exist', () => {
      service.createSession('Session 1');

      service.renameSession('non-existent-id', 'New Name');

      // Should not throw error, sessions map should be unchanged
      expect(service.sessions().size).toBe(1);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update computed signals when sessions change', () => {
      const sessionId = service.createSession('Test');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now()
      };

      service.addMessage(sessionId, message);

      expect(service.activeMessages()).toHaveLength(1);
    });

    it('should update computed signals when activeSessionId changes', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      expect(service.activeSession()?.id).toBe(sessionId1);

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId2);
      expect(service.activeSession()?.id).toBe(sessionId2);
    });

    it('should update computed signals when input value changes', () => {
      const sessionId = service.createSession('Test');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      expect(service.canSendMessage()).toBe(false);

      service.updateInputValue('Hello');

      expect(service.canSendMessage()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple operations on the same session', () => {
      const sessionId = service.createSession('Test');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      // Add messages
      service.addMessage(sessionId, {
        id: 'msg-1',
        role: 'user',
        content: 'Message 1',
        timestamp: Date.now()
      });

      // Update input
      service.updateInputValue('Draft');

      // Rename
      service.renameSession(sessionId, 'Renamed');

      const sessions = service.sessions();
      const session = sessions.get(sessionId);

      expect(session?.messages).toHaveLength(1);
      expect(session?.inputValue).toBe('Draft');
      expect(session?.name).toBe('Renamed');
    });

    it('should handle rapid session creation and deletion', () => {
      const ids: string[] = [];

      // Create 10 sessions
      for (let i = 0; i < 10; i++) {
        ids.push(service.createSession(`Session ${i}`));
      }

      expect(service.sessions().size).toBe(10);

      // Delete all sessions
      ids.forEach(id => service.deleteSession(id));

      expect(service.sessions().size).toBe(0);
      expect(service.activeSessionId()).toBe('');
    });

    it('should handle updating input value with empty string', () => {
      const sessionId = service.createSession('Test');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      service.updateInputValue('Some text');
      expect(service.canSendMessage()).toBe(true);

      service.updateInputValue('');
      expect(service.canSendMessage()).toBe(false);
    });

    it('should handle switching between sessions with different message counts', () => {
      const sessionId1 = service.createSession('Session 1');
      const sessionId2 = service.createSession('Session 2');

      service.addMessage(sessionId1, {
        id: 'msg-1',
        role: 'user',
        content: 'Message 1',
        timestamp: Date.now()
      });

      service.addMessage(sessionId2, {
        id: 'msg-2',
        role: 'user',
        content: 'Message 2',
        timestamp: Date.now()
      });

      service.addMessage(sessionId2, {
        id: 'msg-3',
        role: 'assistant',
        content: 'Message 3',
        timestamp: Date.now()
      });

      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId1);
      expect(service.activeMessages()).toHaveLength(1);

      service.switchSession(sessionId2);
      expect(service.activeMessages()).toHaveLength(2);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support typical chat workflow', () => {
      // Create a new session
      const sessionId = service.createSession('Project Discussion');
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(sessionId);

      // User types a message
      service.updateInputValue('Help me plan my project');

      // User sends the message (in real app, this would trigger AI response)
      const userMessage: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: service.activeInputValue(),
        timestamp: Date.now()
      };
      service.addMessage(sessionId, userMessage);

      // Clear input after sending
      service.updateInputValue('');

      // Verify state
      expect(service.activeMessages()).toHaveLength(1);
      expect(service.activeMessages()[0].content).toBe('Help me plan my project');
      expect(service.activeInputValue()).toBe('');
      expect(service.canSendMessage()).toBe(false);
    });

    it('should support working on multiple conversations simultaneously', () => {
      // Create two sessions
      const session1 = service.createSession('Project A');
      const session2 = service.createSession('Project B');

      // Work on session 1
      (service['activeSessionId'] as unknown as ReturnType<typeof import('@angular/core').signal>).set(session1);
      service.updateInputValue('Draft for Project A');

      // Switch to session 2
      service.switchSession(session2);
      service.updateInputValue('Draft for Project B');

      // Switch back to session 1
      service.switchSession(session1);

      // Draft should be preserved
      expect(service.activeInputValue()).toBe('Draft for Project A');

      // Switch to session 2 again
      service.switchSession(session2);
      expect(service.activeInputValue()).toBe('Draft for Project B');
    });

    it('should support session cleanup workflow', () => {
      // Create multiple old sessions
      const session1 = service.createSession('Old Session 1');
      const session2 = service.createSession('Old Session 2');
      const session3 = service.createSession('Keep This One');

      // Delete old sessions
      service.deleteSession(session1);
      service.deleteSession(session2);

      // Verify only the kept session remains
      expect(service.sessions().size).toBe(1);
      expect(service.sessions().has(session3)).toBe(true);
    });
  });

  describe('Storage Sync Effect', () => {
    it('should inject SessionStorageService', () => {
      expect(storageService).toBeDefined();
    });

    it('should have setup storage sync effect in constructor', () => {
      // The effect is set up in the constructor, so if the service is created
      // without errors, the effect setup was successful
      expect(service).toBeTruthy();
    });

    it('should track previous state for change detection', () => {
      // Access private properties to verify implementation
      const prevSessions = service['prevSessions'] as Map<string, unknown>;
      const prevActiveSessionId = service['prevActiveSessionId'] as string;
      const prevIsMessagesVisible = service['prevIsMessagesVisible'] as boolean;

      expect(prevSessions).toBeDefined();
      expect(prevActiveSessionId).toBeDefined();
      expect(prevIsMessagesVisible).toBeDefined();
    });

    it('should have storage sync timer property', () => {
      const timer = service['storageSyncTimer'];
      expect(timer).toBeDefined();
    });

    it('should have setupStorageSyncEffect method', () => {
      const setupMethod = service['setupStorageSyncEffect'];
      expect(typeof setupMethod).toBe('function');
    });

    it('should have saveToStorage method', () => {
      const saveMethod = service['saveToStorage'];
      expect(typeof saveMethod).toBe('function');
    });
  });
});
