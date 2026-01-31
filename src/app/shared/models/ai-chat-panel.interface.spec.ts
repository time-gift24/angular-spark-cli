import { EventEmitter } from '@angular/core';
import { AiChatPanelInputs, AiChatPanelOutputs } from './ai-chat-panel.interface';
import { ChatMessage } from './chat-message.interface';

describe('AiChatPanelInterface', () => {
  describe('AiChatPanelInputs', () => {
    it('should create valid inputs with all properties', () => {
      const inputs: AiChatPanelInputs = {
        initialSessions: '[{"id":"sess-1","name":"Test","messages":[],"inputValue":"","position":{"x":0,"y":0},"size":{"width":400,"height":600},"lastUpdated":Date.now()}]',
        apiEndpoint: 'https://api.example.com/chat',
      };

      expect(inputs.initialSessions).toBeDefined();
      expect(inputs.apiEndpoint).toBe('https://api.example.com/chat');
    });

    it('should create valid inputs with only initialSessions', () => {
      const inputs: AiChatPanelInputs = {
        initialSessions: '[]',
      };

      expect(inputs.initialSessions).toBe('[]');
      expect(inputs.apiEndpoint).toBeUndefined();
    });

    it('should create valid inputs with only apiEndpoint', () => {
      const inputs: AiChatPanelInputs = {
        apiEndpoint: 'https://api.example.com/v1/chat',
      };

      expect(inputs.apiEndpoint).toBe('https://api.example.com/v1/chat');
      expect(inputs.initialSessions).toBeUndefined();
    });

    it('should create empty inputs (all optional)', () => {
      const inputs: AiChatPanelInputs = {};

      expect(inputs.initialSessions).toBeUndefined();
      expect(inputs.apiEndpoint).toBeUndefined();
    });

    it('should accept valid JSON for initialSessions', () => {
      const sessionsJson = JSON.stringify([
        {
          id: 'sess-1',
          name: 'Chat 1',
          messages: [],
          inputValue: '',
          position: { x: 100, y: 50 },
          size: { width: 400, height: 600 },
          lastUpdated: Date.now(),
        },
      ]);

      const inputs: AiChatPanelInputs = {
        initialSessions: sessionsJson,
      };

      expect(() => JSON.parse(inputs.initialSessions!)).not.toThrow();
    });

    it('should accept various API endpoint formats', () => {
      const endpoints: string[] = [
        'https://api.example.com/chat',
        'http://localhost:3000/api/chat',
        'https://api.example.com/v1/chat',
        'https://api.example.com/v2/ai-assistant',
      ];

      endpoints.forEach((endpoint) => {
        const inputs: AiChatPanelInputs = { apiEndpoint: endpoint };
        expect(inputs.apiEndpoint).toBe(endpoint);
      });
    });
  });

  describe('AiChatPanelOutputs', () => {
    it('should create valid outputs with all EventEmitters', () => {
      const outputs: AiChatPanelOutputs = {
        messageSend: new EventEmitter<ChatMessage>(),
        sessionChange: new EventEmitter<string>(),
        panelToggle: new EventEmitter<boolean>(),
      };

      expect(outputs.messageSend).toBeInstanceOf(EventEmitter);
      expect(outputs.sessionChange).toBeInstanceOf(EventEmitter);
      expect(outputs.panelToggle).toBeInstanceOf(EventEmitter);
    });

    describe('messageSend output', () => {
      it('should emit ChatMessage objects', () => {
        const messageSend = new EventEmitter<ChatMessage>();
        const emittedMessages: ChatMessage[] = [];

        messageSend.subscribe((message) => {
          emittedMessages.push(message);
        });

        const testMessage: ChatMessage = {
          id: 'msg-1',
          role: 'user',
          content: 'Hello, AI!',
          timestamp: Date.now(),
        };

        messageSend.emit(testMessage);

        expect(emittedMessages.length).toBe(1);
        expect(emittedMessages[0]).toEqual(testMessage);
      });

      it('should emit messages with actions', () => {
        const messageSend = new EventEmitter<ChatMessage>();
        let receivedMessage: ChatMessage | undefined;

        messageSend.subscribe((message) => {
          receivedMessage = message;
        });

        const messageWithActions: ChatMessage = {
          id: 'msg-2',
          role: 'assistant',
          content: 'Here is your answer!',
          timestamp: Date.now(),
          actions: [
            {
              id: 'copy',
              label: 'Copy',
              icon: 'lucide_copy',
              callback: () => {},
            },
          ],
        };

        messageSend.emit(messageWithActions);

        expect(receivedMessage).toBeDefined();
        expect(receivedMessage!.actions).toBeDefined();
        expect(receivedMessage!.actions!.length).toBe(1);
      });

      it('should support multiple subscribers', () => {
        const messageSend = new EventEmitter<ChatMessage>();
        const subscriber1Calls: ChatMessage[] = [];
        const subscriber2Calls: ChatMessage[] = [];

        messageSend.subscribe((message) => subscriber1Calls.push(message));
        messageSend.subscribe((message) => subscriber2Calls.push(message));

        const testMessage: ChatMessage = {
          id: 'msg-3',
          role: 'user',
          content: 'Test message',
          timestamp: Date.now(),
        };

        messageSend.emit(testMessage);

        expect(subscriber1Calls.length).toBe(1);
        expect(subscriber2Calls.length).toBe(1);
        expect(subscriber1Calls[0]).toEqual(subscriber2Calls[0]);
      });
    });

    describe('sessionChange output', () => {
      it('should emit session ID strings', () => {
        const sessionChange = new EventEmitter<string>();
        const emittedIds: string[] = [];

        sessionChange.subscribe((sessionId) => {
          emittedIds.push(sessionId);
        });

        sessionChange.emit('sess-1');
        sessionChange.emit('sess-2');
        sessionChange.emit('sess-3');

        expect(emittedIds.length).toBe(3);
        expect(emittedIds[0]).toBe('sess-1');
        expect(emittedIds[1]).toBe('sess-2');
        expect(emittedIds[2]).toBe('sess-3');
      });

      it('should emit valid session IDs', () => {
        const sessionChange = new EventEmitter<string>();
        let receivedId: string | undefined;

        sessionChange.subscribe((sessionId) => {
          receivedId = sessionId;
        });

        const testSessionId = 'sess-abc123';
        sessionChange.emit(testSessionId);

        expect(receivedId).toBe(testSessionId);
        expect(typeof receivedId).toBe('string');
      });

      it('should support multiple subscribers', () => {
        const sessionChange = new EventEmitter<string>();
        const subscriber1Received: string[] = [];
        const subscriber2Received: string[] = [];

        sessionChange.subscribe((id) => subscriber1Received.push(id));
        sessionChange.subscribe((id) => subscriber2Received.push(id));

        sessionChange.emit('sess-test');

        expect(subscriber1Received.length).toBe(1);
        expect(subscriber2Received.length).toBe(1);
        expect(subscriber1Received[0]).toBe(subscriber2Received[0]);
      });
    });

    describe('panelToggle output', () => {
      it('should emit boolean visibility states', () => {
        const panelToggle = new EventEmitter<boolean>();
        const emittedStates: boolean[] = [];

        panelToggle.subscribe((isVisible) => {
          emittedStates.push(isVisible);
        });

        panelToggle.emit(true);
        panelToggle.emit(false);
        panelToggle.emit(true);

        expect(emittedStates.length).toBe(3);
        expect(emittedStates[0]).toBe(true);
        expect(emittedStates[1]).toBe(false);
        expect(emittedStates[2]).toBe(true);
      });

      it('should emit true when panel becomes visible', () => {
        const panelToggle = new EventEmitter<boolean>();
        let receivedState: boolean | undefined;

        panelToggle.subscribe((isVisible) => {
          receivedState = isVisible;
        });

        panelToggle.emit(true);

        expect(receivedState).toBe(true);
      });

      it('should emit false when panel becomes hidden', () => {
        const panelToggle = new EventEmitter<boolean>();
        let receivedState: boolean | undefined;

        panelToggle.subscribe((isVisible) => {
          receivedState = isVisible;
        });

        panelToggle.emit(false);

        expect(receivedState).toBe(false);
      });

      it('should support multiple subscribers', () => {
        const panelToggle = new EventEmitter<boolean>();
        const subscriber1States: boolean[] = [];
        const subscriber2States: boolean[] = [];

        panelToggle.subscribe((state) => subscriber1States.push(state));
        panelToggle.subscribe((state) => subscriber2States.push(state));

        panelToggle.emit(true);

        expect(subscriber1States.length).toBe(1);
        expect(subscriber2States.length).toBe(1);
        expect(subscriber1States[0]).toBe(subscriber2States[0]);
      });
    });

    describe('integration scenarios', () => {
      it('should handle all outputs in a parent component scenario', () => {
        const outputs: AiChatPanelOutputs = {
          messageSend: new EventEmitter<ChatMessage>(),
          sessionChange: new EventEmitter<string>(),
          panelToggle: new EventEmitter<boolean>(),
        };

        // Simulate parent component subscriptions
        const events: { type: string; data: any }[] = [];

        outputs.messageSend.subscribe((message) => {
          events.push({ type: 'messageSend', data: message });
        });

        outputs.sessionChange.subscribe((sessionId) => {
          events.push({ type: 'sessionChange', data: sessionId });
        });

        outputs.panelToggle.subscribe((isVisible) => {
          events.push({ type: 'panelToggle', data: isVisible });
        });

        // Simulate user interactions
        const testMessage: ChatMessage = {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        };
        outputs.messageSend.emit(testMessage);

        outputs.sessionChange.emit('sess-1');

        outputs.panelToggle.emit(true);

        expect(events.length).toBe(3);
        expect(events[0].type).toBe('messageSend');
        expect(events[1].type).toBe('sessionChange');
        expect(events[2].type).toBe('panelToggle');
      });

      it('should maintain type safety for all outputs', () => {
        const outputs: AiChatPanelOutputs = {
          messageSend: new EventEmitter<ChatMessage>(),
          sessionChange: new EventEmitter<string>(),
          panelToggle: new EventEmitter<boolean>(),
        };

        // TypeScript should enforce correct types
        outputs.messageSend.subscribe((message: ChatMessage) => {
          expect(message.content).toBeDefined();
          expect(message.timestamp).toBeDefined();
        });

        outputs.sessionChange.subscribe((id: string) => {
          expect(typeof id).toBe('string');
        });

        outputs.panelToggle.subscribe((visible: boolean) => {
          expect(typeof visible).toBe('boolean');
        });

        const testMessage: ChatMessage = {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        };

        outputs.messageSend.emit(testMessage);
        outputs.sessionChange.emit('sess-1');
        outputs.panelToggle.emit(true);
      });
    });
  });
});
