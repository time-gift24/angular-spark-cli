import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { AiChatPanelComponent } from './ai-chat-panel.component';
import { SessionStateService } from '../../services';
import { ChatMessage, SessionData, PanelPosition, PanelSize } from '../../models';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

describe('AiChatPanelComponent', () => {
  let component: AiChatPanelComponent;
  let fixture: ComponentFixture<AiChatPanelComponent>;
  let mockSessionStateService: SessionStateService;

  const mockPosition: PanelPosition = { x: 100, y: 50 };
  const mockSize: PanelSize = { width: 400, height: 600 };
  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, how can you help?',
      timestamp: Date.now(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'I can help you with various tasks.',
      timestamp: Date.now(),
    },
  ];

  const mockSession: SessionData = {
    id: 'sess-1',
    name: 'Test Session',
    messages: mockMessages,
    inputValue: 'Test input',
    position: mockPosition,
    size: mockSize,
    lastUpdated: Date.now(),
  };

  beforeEach(async () => {
    // Create mock service with Signals
    mockSessionStateService = {
      sessions: signal(new Map([['sess-1', mockSession]])),
      activeSessionId: signal('sess-1'),
      isMessagesVisible: signal(true),
      activeSession: computed(() => mockSession),
      activeMessages: computed(() => mockMessages),
      activeInputValue: computed(() => mockSession.inputValue),
      canSendMessage: computed(() => mockSession.inputValue.trim().length > 0),
      switchSession: vi.fn(),
      toggleMessagesVisibility: vi.fn(),
      updateInputValue: vi.fn(),
      addMessage: vi.fn(),
    } as unknown as SessionStateService;

    await TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [
        { provide: SessionStateService, useValue: mockSessionStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatPanelComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.apiEndpoint).toBeUndefined();
      expect(component.sessions()).toEqual(expect.any(Map));
      expect(component.activeSessionId()).toBe('sess-1');
      expect(component.isMessagesVisible()).toBe(true);
    });

    it('should expose session state signals as readonly', () => {
      expect(component.sessions).toBeDefined();
      expect(component.activeSessionId).toBeDefined();
      expect(component.isMessagesVisible).toBeDefined();
      expect(component.activeSession).toBeDefined();
    });

    it('should have event emitters', () => {
      expect(component.messageSend).toBeDefined();
      expect(component.sessionChange).toBeDefined();
      expect(component.panelToggle).toBeDefined();
    });
  });

  describe('@Input() apiEndpoint', () => {
    it('should accept apiEndpoint input', () => {
      const testEndpoint = 'https://api.example.com/chat';
      component.apiEndpoint = testEndpoint;
      expect(component.apiEndpoint).toBe(testEndpoint);
    });

    it('should be optional', () => {
      expect(component.apiEndpoint).toBeUndefined();
    });
  });

  describe('Signal Inputs from SessionStateService', () => {
    it('should expose sessions signal from SessionStateService', () => {
      const sessions = component.sessions();
      expect(sessions instanceof Map).toBe(true);
      expect(sessions.size).toBe(1);
      expect(sessions.get('sess-1')).toEqual(mockSession);
    });

    it('should expose activeSessionId signal from SessionStateService', () => {
      expect(component.activeSessionId()).toBe('sess-1');
    });

    it('should expose isMessagesVisible signal from SessionStateService', () => {
      expect(component.isMessagesVisible()).toBe(true);
    });

    it('should expose activeSession computed signal from SessionStateService', () => {
      const activeSession = component.activeSession();
      expect(activeSession).toEqual(mockSession);
    });
  });

  describe('@Output() Event Emitters', () => {
    it('should emit messageSend event when message is sent', () => {
      const emitSpy = vi.spyOn(component.messageSend, 'emit');
      const testMessage: ChatMessage = {
        id: 'msg-123',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
      };

      component.messageSend.emit(testMessage);
      expect(emitSpy).toHaveBeenCalledWith(testMessage);
    });

    it('should emit sessionChange event when session changes', () => {
      const emitSpy = vi.spyOn(component.sessionChange, 'emit');
      component.sessionChange.emit('sess-2');
      expect(emitSpy).toHaveBeenCalledWith('sess-2');
    });

    it('should emit panelToggle event when visibility toggles', () => {
      const emitSpy = vi.spyOn(component.panelToggle, 'emit');
      component.panelToggle.emit(false);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('ngOnInit()', () => {
    it('should call ngOnInit without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should be called on component initialization', () => {
      const ngOnInitSpy = vi.spyOn(component, 'ngOnInit');
      fixture.detectChanges();
      expect(ngOnInitSpy).toHaveBeenCalled();
    });

    it('should initialize sessions from localStorage if available', () => {
      const loadSessionsSpy = vi.spyOn(component['storage'], 'loadSessions');
      const storedSessions = new Map([['sess-1', mockSession]]);
      loadSessionsSpy.mockReturnValue(storedSessions);

      component.ngOnInit();

      expect(loadSessionsSpy).toHaveBeenCalled();
    });

    it('should create default session if no sessions exist in localStorage', () => {
      const loadSessionsSpy = vi.spyOn(component['storage'], 'loadSessions');
      loadSessionsSpy.mockReturnValue(null);

      const createSessionSpy = vi.spyOn(mockSessionStateService, 'createSession');

      component.ngOnInit();

      expect(createSessionSpy).toHaveBeenCalledWith('New Chat');
    });

    it('should load active session ID from localStorage', () => {
      const loadActiveIdSpy = vi.spyOn(component['storage'], 'loadActiveSessionId');
      loadActiveIdSpy.mockReturnValue('sess-1');

      component.ngOnInit();

      expect(loadActiveIdSpy).toHaveBeenCalled();
    });

    it('should load messages visibility from localStorage', () => {
      const loadVisibilitySpy = vi.spyOn(component['storage'], 'loadMessagesVisibility');
      loadVisibilitySpy.mockReturnValue(true);

      component.ngOnInit();

      expect(loadVisibilitySpy).toHaveBeenCalled();
    });
  });

  describe('sendMessage()', () => {
    it('should create a message and add it to the session', () => {
      component.sendMessage();

      expect(mockSessionStateService.addMessage).toHaveBeenCalledWith(
        'sess-1',
        expect.objectContaining({
          id: expect.stringMatching(/^msg-\d+$/),
          role: 'user',
          content: mockSession.inputValue,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should clear the input field after sending', () => {
      component.sendMessage();
      expect(mockSessionStateService.updateInputValue).toHaveBeenCalledWith('');
    });

    it('should emit messageSend event with the message', () => {
      const emitSpy = vi.spyOn(component.messageSend, 'emit');
      component.sendMessage();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^msg-\d+$/),
          role: 'user',
          content: mockSession.inputValue,
        })
      );
    });

    it('should not send message if input is empty', () => {
      // Create a new mock service with empty input
      const emptyInputMockService = {
        ...mockSessionStateService,
        activeInputValue: computed(() => ''),
        canSendMessage: computed(() => false),
      } as unknown as SessionStateService;

      // Replace the service in the component
      Object.defineProperty(component, 'sessionState', {
        value: emptyInputMockService,
        writable: false,
      });

      const emitSpy = vi.spyOn(component.messageSend, 'emit');

      component.sendMessage();

      expect(emptyInputMockService.addMessage).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not send message if input is whitespace only', () => {
      // Create a new mock service with whitespace input
      const whitespaceInputMockService = {
        ...mockSessionStateService,
        activeInputValue: computed(() => '   '),
        canSendMessage: computed(() => false),
      } as unknown as SessionStateService;

      // Replace the service in the component
      Object.defineProperty(component, 'sessionState', {
        value: whitespaceInputMockService,
        writable: false,
      });

      const emitSpy = vi.spyOn(component.messageSend, 'emit');

      component.sendMessage();

      expect(whitespaceInputMockService.addMessage).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not send message if no active session', () => {
      // Create a new mock service with no active session
      const noActiveSessionMockService = {
        ...mockSessionStateService,
        activeSessionId: signal(''),
        activeSession: computed(() => undefined),
      } as unknown as SessionStateService;

      // Replace the service in the component
      Object.defineProperty(component, 'sessionState', {
        value: noActiveSessionMockService,
        writable: false,
      });

      const emitSpy = vi.spyOn(component.messageSend, 'emit');

      component.sendMessage();

      expect(noActiveSessionMockService.addMessage).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('switchSession(sessionId)', () => {
    it('should call SessionStateService.switchSession with the session ID', () => {
      component.switchSession('sess-2');
      expect(mockSessionStateService.switchSession).toHaveBeenCalledWith('sess-2');
    });

    it('should emit sessionChange event with the session ID', () => {
      const emitSpy = vi.spyOn(component.sessionChange, 'emit');
      component.switchSession('sess-2');

      expect(emitSpy).toHaveBeenCalledWith('sess-2');
    });

    it('should emit sessionChange after switching session', () => {
      const callOrder: string[] = [];
      mockSessionStateService.switchSession = vi.fn(() => {
        callOrder.push('switch');
      });
      const emitSpy = vi.spyOn(component.sessionChange, 'emit').mockImplementation(() => {
        callOrder.push('emit');
      });

      component.switchSession('sess-2');

      expect(callOrder).toEqual(['switch', 'emit']);
    });
  });

  describe('toggleMessagesVisibility()', () => {
    it('should call SessionStateService.toggleMessagesVisibility', () => {
      component.toggleMessagesVisibility();
      expect(mockSessionStateService.toggleMessagesVisibility).toHaveBeenCalled();
    });

    it('should emit panelToggle event with new visibility state', () => {
      const visibleMockService = {
        ...mockSessionStateService,
        isMessagesVisible: signal(true),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: visibleMockService,
        writable: false,
      });

      const emitSpy = vi.spyOn(component.panelToggle, 'emit');

      component.toggleMessagesVisibility();

      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should emit true when toggling from hidden to visible', () => {
      const hiddenMockService = {
        ...mockSessionStateService,
        isMessagesVisible: signal(false),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: hiddenMockService,
        writable: false,
      });

      const emitSpy = vi.spyOn(component.panelToggle, 'emit');

      component.toggleMessagesVisibility();

      expect(emitSpy).toHaveBeenCalledWith(true);
    });

    it('should emit panelToggle after toggling visibility', () => {
      const callOrder: string[] = [];
      mockSessionStateService.toggleMessagesVisibility = vi.fn(() => {
        callOrder.push('toggle');
      });
      const emitSpy = vi.spyOn(component.panelToggle, 'emit').mockImplementation(() => {
        callOrder.push('emit');
      });

      component.toggleMessagesVisibility();

      expect(callOrder).toEqual(['toggle', 'emit']);
    });
  });

  describe('updatePosition(position)', () => {
    it('should update the active session position in the sessions map', () => {
      const newPosition: PanelPosition = { x: 200, y: 100 };

      component.updatePosition(newPosition);

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.position).toEqual(newPosition);
    });

    it('should update lastUpdated timestamp when position changes', () => {
      const newPosition: PanelPosition = { x: 200, y: 100 };
      const originalTimestamp = mockSession.lastUpdated;

      // Wait to ensure timestamp difference
      setTimeout(() => {
        component.updatePosition(newPosition);

        const sessions = component.sessions();
        const updatedSession = sessions.get('sess-1');

        expect(updatedSession?.lastUpdated).toBeGreaterThan(originalTimestamp);
      }, 10);
    });

    it('should not update if no active session', () => {
      const noActiveSessionMockService = {
        ...mockSessionStateService,
        activeSessionId: signal(''),
        activeSession: computed(() => undefined),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: noActiveSessionMockService,
        writable: false,
      });

      const originalSessions = component.sessions();

      component.updatePosition({ x: 200, y: 100 });

      expect(component.sessions()).toEqual(originalSessions);
    });

    it('should preserve other session properties when updating position', () => {
      const newPosition: PanelPosition = { x: 200, y: 100 };

      component.updatePosition(newPosition);

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.id).toBe(mockSession.id);
      expect(updatedSession?.name).toBe(mockSession.name);
      expect(updatedSession?.messages).toEqual(mockSession.messages);
      expect(updatedSession?.inputValue).toBe(mockSession.inputValue);
      expect(updatedSession?.size).toEqual(mockSession.size);
    });
  });

  describe('updateSize(size)', () => {
    it('should update the active session size in the sessions map', () => {
      const newSize: PanelSize = { width: 500, height: 700 };

      component.updateSize(newSize);

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.size).toEqual(newSize);
    });

    it('should update lastUpdated timestamp when size changes', () => {
      const newSize: PanelSize = { width: 500, height: 700 };
      const originalTimestamp = mockSession.lastUpdated;

      // Wait to ensure timestamp difference
      setTimeout(() => {
        component.updateSize(newSize);

        const sessions = component.sessions();
        const updatedSession = sessions.get('sess-1');

        expect(updatedSession?.lastUpdated).toBeGreaterThan(originalTimestamp);
      }, 10);
    });

    it('should not update if no active session', () => {
      const noActiveSessionMockService = {
        ...mockSessionStateService,
        activeSessionId: signal(''),
        activeSession: computed(() => undefined),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: noActiveSessionMockService,
        writable: false,
      });

      const originalSessions = component.sessions();

      component.updateSize({ width: 500, height: 700 });

      expect(component.sessions()).toEqual(originalSessions);
    });

    it('should preserve other session properties when updating size', () => {
      const newSize: PanelSize = { width: 500, height: 700 };

      component.updateSize(newSize);

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.id).toBe(mockSession.id);
      expect(updatedSession?.name).toBe(mockSession.name);
      expect(updatedSession?.messages).toEqual(mockSession.messages);
      expect(updatedSession?.inputValue).toBe(mockSession.inputValue);
      expect(updatedSession?.position).toEqual(mockSession.position);
    });
  });

  describe('createNewSession()', () => {
    it('should create a new session using sessionState', () => {
      const createSessionSpy = vi.fn().mockReturnValue('new-sess-id');
      mockSessionStateService.createSession = createSessionSpy;

      Object.defineProperty(component, 'sessionState', {
        value: mockSessionStateService,
        writable: false,
      });

      component.createNewSession();

      expect(createSessionSpy).toHaveBeenCalled();
    });

    it('should switch to the newly created session', () => {
      const newSessionId = 'new-sess-123';
      const createSessionSpy = vi.fn().mockReturnValue(newSessionId);
      const switchSessionSpy = vi.fn();

      mockSessionStateService.createSession = createSessionSpy;
      component.switchSession = switchSessionSpy;

      component.createNewSession();

      expect(createSessionSpy).toHaveBeenCalled();
      expect(switchSessionSpy).toHaveBeenCalledWith(newSessionId);
    });

    it('should emit sessionChange event when creating new session', () => {
      const newSessionId = 'new-sess-456';
      const createSessionSpy = vi.fn().mockReturnValue(newSessionId);
      const switchSessionSpy = vi.fn();
      const emitSpy = vi.spyOn(component.sessionChange, 'emit');

      mockSessionStateService.createSession = createSessionSpy;
      component.switchSession = switchSessionSpy;

      component.createNewSession();

      expect(emitSpy).toHaveBeenCalledWith(newSessionId);
    });
  });

  describe('Child Component Integration', () => {
    it('should render ChatMessagesCard component', () => {
      const element = fixture.nativeElement;
      fixture.detectChanges();

      const chatMessagesCard = element.querySelector('app-chat-messages-card');
      expect(chatMessagesCard).toBeTruthy();
    });

    it('should render SessionTabsBar component', () => {
      const element = fixture.nativeElement;
      fixture.detectChanges();

      const sessionTabsBar = element.querySelector('spark-session-tabs-bar');
      expect(sessionTabsBar).toBeTruthy();
    });

    it('should render ChatInput component', () => {
      const element = fixture.nativeElement;
      fixture.detectChanges();

      const chatInput = element.querySelector('app-chat-input');
      expect(chatInput).toBeTruthy();
    });
  });

  describe('Integration with SessionStateService', () => {
    it('should delegate state management to SessionStateService', () => {
      expect(component.sessions).toBe(mockSessionStateService.sessions);
      expect(component.activeSessionId).toBe(mockSessionStateService.activeSessionId);
      expect(component.isMessagesVisible).toBe(mockSessionStateService.isMessagesVisible);
      expect(component.activeSession).toBe(mockSessionStateService.activeSession);
    });

    it('should use SessionStateService methods for operations', () => {
      component.switchSession('sess-2');
      expect(mockSessionStateService.switchSession).toHaveBeenCalledWith('sess-2');

      component.toggleMessagesVisibility();
      expect(mockSessionStateService.toggleMessagesVisibility).toHaveBeenCalled();

      component.sendMessage();
      expect(mockSessionStateService.addMessage).toHaveBeenCalled();
      expect(mockSessionStateService.updateInputValue).toHaveBeenCalledWith('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid position updates', () => {
      const positions: PanelPosition[] = [
        { x: 100, y: 50 },
        { x: 150, y: 75 },
        { x: 200, y: 100 },
      ];

      positions.forEach((pos) => {
        component.updatePosition(pos);
      });

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.position).toEqual(positions[2]);
    });

    it('should handle multiple rapid size updates', () => {
      const sizes: PanelSize[] = [
        { width: 400, height: 600 },
        { width: 450, height: 650 },
        { width: 500, height: 700 },
      ];

      sizes.forEach((size) => {
        component.updateSize(size);
      });

      const sessions = component.sessions();
      const updatedSession = sessions.get('sess-1');

      expect(updatedSession?.size).toEqual(sizes[2]);
    });

    it('should handle session with empty messages array', () => {
      const emptySession: SessionData = {
        ...mockSession,
        messages: [],
      };

      const emptyMessagesMockService = {
        ...mockSessionStateService,
        activeSession: computed(() => emptySession),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: emptyMessagesMockService,
        writable: false,
      });

      expect(component.activeSession()?.messages).toEqual([]);
      expect(component.activeSession()?.messages.length).toBe(0);
    });

    it('should handle session with empty input value', () => {
      const emptyInputSession: SessionData = {
        ...mockSession,
        inputValue: '',
      };

      const emptyInputMockService = {
        ...mockSessionStateService,
        activeSession: computed(() => emptyInputSession),
        activeInputValue: computed(() => ''),
        canSendMessage: computed(() => false),
      } as unknown as SessionStateService;

      Object.defineProperty(component, 'sessionState', {
        value: emptyInputMockService,
        writable: false,
      });

      expect(component.activeSession()?.inputValue).toBe('');
      expect(emptyInputMockService.canSendMessage()).toBe(false);
    });
  });
});
