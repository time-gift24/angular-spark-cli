import { ChatMessage, MessageAction, ChatMessageRole } from './chat-message.interface';

describe('ChatMessageInterface', () => {
  describe('ChatMessage', () => {
    it('should create a valid user message', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: Date.now(),
      };

      expect(message.id).toBe('msg-1');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, AI!');
      expect(message.timestamp).toBeLessThanOrEqual(Date.now());
      expect(message.actions).toBeUndefined();
    });

    it('should create a valid assistant message with actions', () => {
      const copyAction: MessageAction = {
        id: 'copy',
        label: 'Copy to clipboard',
        icon: 'lucide_copy',
        callback: () => {},
      };

      const message: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Here is your answer!',
        timestamp: Date.now(),
        actions: [copyAction],
      };

      expect(message.id).toBe('msg-2');
      expect(message.role).toBe('assistant');
      expect(message.actions).toBeDefined();
      expect(message.actions?.length).toBe(1);
      expect(message.actions?.[0].id).toBe('copy');
    });

    it('should create a valid system message', () => {
      const message: ChatMessage = {
        id: 'msg-3',
        role: 'system',
        content: 'An error occurred',
        timestamp: Date.now(),
      };

      expect(message.role).toBe('system');
    });

    it('should support multiple actions', () => {
      const actions: MessageAction[] = [
        {
          id: 'copy',
          label: 'Copy',
          icon: 'lucide_copy',
          callback: () => {},
        },
        {
          id: 'regenerate',
          label: 'Regenerate',
          icon: 'lucide_refresh-cw',
          callback: () => {},
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'lucide_trash',
          callback: () => {},
        },
      ];

      const message: ChatMessage = {
        id: 'msg-4',
        role: 'assistant',
        content: 'Response with multiple actions',
        timestamp: Date.now(),
        actions,
      };

      expect(message.actions?.length).toBe(3);
    });

    it('should allow actions without icons', () => {
      const actionWithoutIcon: MessageAction = {
        id: 'custom-action',
        label: 'Custom Action',
        callback: () => {},
      };

      const message: ChatMessage = {
        id: 'msg-5',
        role: 'user',
        content: 'Message with text-only action',
        timestamp: Date.now(),
        actions: [actionWithoutIcon],
      };

      expect(message.actions?.[0].icon).toBeUndefined();
    });
  });

  describe('MessageAction', () => {
    it('should create a valid action with all properties', () => {
      let callbackExecuted = false;

      const action: MessageAction = {
        id: 'test-action',
        label: 'Test Action',
        icon: 'lucide_test',
        callback: () => {
          callbackExecuted = true;
        },
      };

      expect(action.id).toBe('test-action');
      expect(action.label).toBe('Test Action');
      expect(action.icon).toBe('lucide_test');
      expect(typeof action.callback).toBe('function');

      action.callback();
      expect(callbackExecuted).toBe(true);
    });

    it('should create a valid action without icon', () => {
      const action: MessageAction = {
        id: 'text-only',
        label: 'Text Only Action',
        callback: () => {},
      };

      expect(action.icon).toBeUndefined();
      expect(action.label).toBe('Text Only Action');
    });
  });

  describe('ChatMessageRole type', () => {
    it('should accept valid role values', () => {
      const userRole: ChatMessageRole = 'user';
      const assistantRole: ChatMessageRole = 'assistant';
      const systemRole: ChatMessageRole = 'system';

      expect(userRole).toBe('user');
      expect(assistantRole).toBe('assistant');
      expect(systemRole).toBe('system');
    });
  });
});
