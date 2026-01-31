import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ChatMessagesCardComponent } from './chat-messages-card.component';
import { By } from '@angular/platform-browser';
import { ChatMessage, PanelPosition, PanelSize } from '../../models';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

@Component({
  standalone: true,
  imports: [ChatMessagesCardComponent],
  template: `
    <app-chat-messages-card
      [messages]="messages"
      [isVisible]="isVisible"
      [position]="position"
      [size]="size"
      (positionChange)="onPositionChange($event)"
      (sizeChange)="onSizeChange($event)"
    />
  `,
})
class TestHostComponent {
  messages = signal<ChatMessage[]>([]);
  isVisible = signal(false);
  position = signal<PanelPosition>({ x: 100, y: 50 });
  size = signal<PanelSize>({ width: 400, height: 600 });

  positionChangeEvents: PanelPosition[] = [];
  sizeChangeEvents: PanelSize[] = [];

  onPositionChange(event: PanelPosition): void {
    this.positionChangeEvents.push(event);
  }

  onSizeChange(event: PanelSize): void {
    this.sizeChangeEvents.push(event);
  }
}

describe('ChatMessagesCardComponent', () => {
  let component: ChatMessagesCardComponent;
  let fixture: ComponentFixture<ChatMessagesCardComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, AI!',
      timestamp: Date.now() - 1000,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: Date.now(),
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessagesCardComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatMessagesCardComponent);
    component = fixture.componentInstance;

    // Setup test host with required inputs
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with required inputs', () => {
      component.messages = signal([]);
      component.isVisible = signal(false);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      expect(component.messages()).toEqual([]);
      expect(component.isVisible()).toBe(false);
      expect(component.position()).toEqual({ x: 0, y: 0 });
      expect(component.size()).toEqual({ width: 400, height: 600 });
    });

    it('should have messageListRef viewChild', () => {
      component.messages = signal([]);
      component.isVisible = signal(true);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      expect(component.messageListRef).toBeDefined();
    });
  });

  describe('Signal Inputs', () => {
    it('should receive messages as Signal', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      expect(cardComponent.messages()).toHaveLength(2);
      expect(cardComponent.messages()[0].content).toBe('Hello, AI!');
    });

    it('should receive isVisible as Signal', () => {
      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      expect(cardComponent.isVisible()).toBe(true);
    });

    it('should receive position as Signal', () => {
      const testPosition: PanelPosition = { x: 200, y: 150 };
      hostComponent.position.set(testPosition);
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      expect(cardComponent.position()).toEqual(testPosition);
    });

    it('should receive size as Signal', () => {
      const testSize: PanelSize = { width: 500, height: 700 };
      hostComponent.size.set(testSize);
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      expect(cardComponent.size()).toEqual(testSize);
    });

    it('should react to Signal updates', () => {
      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      let messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();

      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);
    });
  });

  describe('EventEmitter Outputs', () => {
    it('should emit positionChange events', () => {
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      const newPosition: PanelPosition = { x: 300, y: 200 };

      cardComponent.positionChange.emit(newPosition);

      expect(hostComponent.positionChangeEvents).toHaveLength(1);
      expect(hostComponent.positionChangeEvents[0]).toEqual(newPosition);
    });

    it('should emit sizeChange events', () => {
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;
      const newSize: PanelSize = { width: 600, height: 800 };

      cardComponent.sizeChange.emit(newSize);

      expect(hostComponent.sizeChangeEvents).toHaveLength(1);
      expect(hostComponent.sizeChangeEvents[0]).toEqual(newSize);
    });

    it('should emit multiple positionChange events', () => {
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;

      cardComponent.positionChange.emit({ x: 100, y: 100 });
      cardComponent.positionChange.emit({ x: 150, y: 150 });
      cardComponent.positionChange.emit({ x: 200, y: 200 });

      expect(hostComponent.positionChangeEvents).toHaveLength(3);
      expect(hostComponent.positionChangeEvents[0]).toEqual({ x: 100, y: 100 });
      expect(hostComponent.positionChangeEvents[1]).toEqual({ x: 150, y: 150 });
      expect(hostComponent.positionChangeEvents[2]).toEqual({ x: 200, y: 200 });
    });

    it('should emit multiple sizeChange events', () => {
      hostFixture.detectChanges();

      const cardComponent = hostFixture.debugElement.children[0].componentInstance;

      cardComponent.sizeChange.emit({ width: 400, height: 500 });
      cardComponent.sizeChange.emit({ width: 450, height: 550 });
      cardComponent.sizeChange.emit({ width: 500, height: 600 });

      expect(hostComponent.sizeChangeEvents).toHaveLength(3);
      expect(hostComponent.sizeChangeEvents[0]).toEqual({ width: 400, height: 500 });
      expect(hostComponent.sizeChangeEvents[1]).toEqual({ width: 450, height: 550 });
      expect(hostComponent.sizeChangeEvents[2]).toEqual({ width: 500, height: 600 });
    });
  });

  describe('Template Rendering', () => {
    it('should render messages-card container', () => {
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard).toBeTruthy();
    });

    it('should render drag-handle', () => {
      hostFixture.detectChanges();

      const dragHandle = hostFixture.debugElement.query(By.css('.drag-handle'));
      expect(dragHandle).toBeTruthy();
    });

    it('should render drag-icon', () => {
      hostFixture.detectChanges();

      const dragIcon = hostFixture.debugElement.query(By.css('.drag-icon'));
      expect(dragIcon).toBeTruthy();
      expect(dragIcon.nativeElement.textContent).toBe('≡ ≡ ≡');
    });

    it('should render message-list', () => {
      hostFixture.detectChanges();

      const messageList = hostFixture.debugElement.query(By.css('.message-list'));
      expect(messageList).toBeTruthy();
    });

    it('should render resize-handle', () => {
      hostFixture.detectChanges();

      const resizeHandle = hostFixture.debugElement.query(By.css('.resize-handle'));
      expect(resizeHandle).toBeTruthy();
    });

    it('should apply visible class when isVisible is true', () => {
      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);
    });

    it('should not apply visible class when isVisible is false', () => {
      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();
    });

    it('should apply position styles', () => {
      hostComponent.position.set({ x: 100, y: 200 });
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.nativeElement.style.left).toBe('100px');
      expect(messagesCard.nativeElement.style.top).toBe('200px');
    });

    it('should apply size styles', () => {
      hostComponent.size.set({ width: 500, height: 700 });
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.nativeElement.style.width).toBe('500px');
      expect(messagesCard.nativeElement.style.height).toBe('700px');
    });
  });

  describe('Message Rendering with @for Loop', () => {
    it('should render no messages when array is empty', () => {
      hostComponent.messages.set([]);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages).toHaveLength(0);

      const emptyState = hostFixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No messages yet');
    });

    it('should render single message', () => {
      hostComponent.messages.set([mockMessages[0]]);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages).toHaveLength(1);
      expect(messages[0].nativeElement.textContent).toContain('Hello, AI!');
    });

    it('should render multiple messages', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages).toHaveLength(2);
      expect(messages[0].nativeElement.textContent).toContain('Hello, AI!');
      expect(messages[1].nativeElement.textContent).toContain('Hello! How can I help you today?');
    });

    it('should track messages by id', () => {
      const initialMessages = [...mockMessages];
      hostComponent.messages.set(initialMessages);
      hostFixture.detectChanges();

      const messagesBefore = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messagesBefore).toHaveLength(2);

      // Update messages (simulating adding a new message)
      const updatedMessages = [
        ...initialMessages,
        {
          id: 'msg-3',
          role: 'user',
          content: 'Can you help me?',
          timestamp: Date.now(),
        },
      ];
      hostComponent.messages.set(updatedMessages);
      hostFixture.detectChanges();

      const messagesAfter = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messagesAfter).toHaveLength(3);
    });

    it('should apply role classes to messages', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages[0].classes['role-user']).toBe(true);
      expect(messages[1].classes['role-assistant']).toBe(true);
    });

    it('should render message content', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const messageContents = hostFixture.debugElement.queryAll(By.css('.message-content'));
      expect(messageContents).toHaveLength(2);
      expect(messageContents[0].nativeElement.textContent).toBe('Hello, AI!');
      expect(messageContents[1].nativeElement.textContent).toBe('Hello! How can I help you today?');
    });

    it('should render message timestamps', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const timestamps = hostFixture.debugElement.queryAll(By.css('.message-timestamp'));
      expect(timestamps).toHaveLength(2);
      expect(timestamps[0].nativeElement.textContent).toBeTruthy();
      expect(timestamps[1].nativeElement.textContent).toBeTruthy();
    });

    it('should render system messages with role-system class', () => {
      const systemMessage: ChatMessage = {
        id: 'msg-sys',
        role: 'system',
        content: 'System notification',
        timestamp: Date.now(),
      };

      hostComponent.messages.set([systemMessage]);
      hostFixture.detectChanges();

      const message = hostFixture.debugElement.query(By.css('.message'));
      expect(message.classes['role-system']).toBe(true);
    });

    it('should handle large message arrays', () => {
      const largeMessages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now() + i * 1000,
      }));

      hostComponent.messages.set(largeMessages);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages).toHaveLength(100);
    });
  });

  describe('Directive Integration', () => {
    it('should apply DragHandleDirective to drag-handle', () => {
      hostFixture.detectChanges();

      const dragHandle = hostFixture.debugElement.query(By.css('[appDragHandle]'));
      expect(dragHandle).toBeTruthy();
    });

    it('should bind position signal to DragHandleDirective', () => {
      const testPosition = { x: 150, y: 100 };
      hostComponent.position.set(testPosition);
      hostFixture.detectChanges();

      const dragHandle = hostFixture.debugElement.query(By.css('[appDragHandle]'));
      expect(dragHandle.attributes['appDragHandle']).toBeDefined();
    });

    it('should bind size signal to ResizeHandleDirective', () => {
      const testSize = { width: 450, height: 650 };
      hostComponent.size.set(testSize);
      hostFixture.detectChanges();

      const resizeHandle = hostFixture.debugElement.query(By.css('[appResizeHandle]'));
      expect(resizeHandle.attributes['appResizeHandle']).toBeDefined();
    });

    it('should apply ResizeHandleDirective to resize-handle', () => {
      hostFixture.detectChanges();

      const resizeHandle = hostFixture.debugElement.query(By.css('[appResizeHandle]'));
      expect(resizeHandle).toBeTruthy();
    });
  });

  describe('scrollToBottom Method', () => {
    it('should be defined', () => {
      expect(component.scrollToBottom).toBeDefined();
    });

    it('should call smoothScrollToBottom when messageListRef exists', () => {
      component.messages = signal([]);
      component.isVisible = signal(true);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      const smoothScrollSpy = vi.spyOn(component as any, 'smoothScrollToBottom');
      component.scrollToBottom();

      expect(smoothScrollSpy).toHaveBeenCalledWith(
        component.messageListRef().nativeElement
      );
    });

    it('should update scrollTop to scrollHeight', () => {
      component.messages = signal([]);
      component.isVisible = signal(true);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      const messageListEl = component.messageListRef().nativeElement;
      messageListEl.scrollHeight = 1000;

      component.scrollToBottom();

      expect(messageListEl.scrollTop).toBe(1000);
    });

    it('should handle scrollHeight changes', () => {
      component.messages = signal([]);
      component.isVisible = signal(true);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      const messageListEl = component.messageListRef().nativeElement;

      // First scroll
      messageListEl.scrollHeight = 500;
      component.scrollToBottom();
      expect(messageListEl.scrollTop).toBe(500);

      // Second scroll with increased content
      messageListEl.scrollHeight = 1500;
      component.scrollToBottom();
      expect(messageListEl.scrollTop).toBe(1500);
    });

    it('should not throw error when messageListRef is null', () => {
      component.messages = signal([]);
      component.isVisible = signal(false);
      component.position = signal({ x: 0, y: 0 });
      component.size = signal({ width: 400, height: 600 });

      fixture.detectChanges();

      expect(() => component.scrollToBottom()).not.toThrow();
    });
  });

  describe('smoothScrollToBottom Private Method', () => {
    it('should set element.scrollTop to element.scrollHeight', () => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 1000,
      } as unknown as HTMLDivElement;

      component['smoothScrollToBottom'](mockElement);

      expect(mockElement.scrollTop).toBe(1000);
    });

    it('should handle zero scrollHeight', () => {
      const mockElement = {
        scrollTop: 100,
        scrollHeight: 0,
      } as unknown as HTMLDivElement;

      component['smoothScrollToBottom'](mockElement);

      expect(mockElement.scrollTop).toBe(0);
    });

    it('should handle large scrollHeight values', () => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 100000,
      } as unknown as HTMLDivElement;

      component['smoothScrollToBottom'](mockElement);

      expect(mockElement.scrollTop).toBe(100000);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should have messages-card class', () => {
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard).toBeTruthy();
    });

    it('should have drag-handle class', () => {
      hostFixture.detectChanges();

      const dragHandle = hostFixture.debugElement.query(By.css('.drag-handle'));
      expect(dragHandle).toBeTruthy();
    });

    it('should have message-list class', () => {
      hostFixture.detectChanges();

      const messageList = hostFixture.debugElement.query(By.css('.message-list'));
      expect(messageList).toBeTruthy();
    });

    it('should have resize-handle class', () => {
      hostFixture.detectChanges();

      const resizeHandle = hostFixture.debugElement.query(By.css('.resize-handle'));
      expect(resizeHandle).toBeTruthy();
    });

    it('should apply message class to each message', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const messages = hostFixture.debugElement.queryAll(By.css('.message'));
      expect(messages).toHaveLength(2);
      expect(messages[0].classes['message']).toBe(true);
      expect(messages[1].classes['message']).toBe(true);
    });

    it('should apply message-content class to content div', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const messageContents = hostFixture.debugElement.queryAll(By.css('.message-content'));
      expect(messageContents).toHaveLength(2);
    });

    it('should apply message-timestamp class to timestamp div', () => {
      hostComponent.messages.set(mockMessages);
      hostFixture.detectChanges();

      const timestamps = hostFixture.debugElement.queryAll(By.css('.message-timestamp'));
      expect(timestamps).toHaveLength(2);
    });
  });

  describe('Visibility Toggle', () => {
    it('should start invisible when isVisible signal is false', () => {
      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      const messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();
    });

    it('should become visible when isVisible signal changes to true', () => {
      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      let messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();

      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);
    });

    it('should become invisible when isVisible signal changes to false', () => {
      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      let messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);

      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();
    });

    it('should toggle visibility multiple times', () => {
      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      let messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);

      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();

      hostComponent.isVisible.set(true);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBe(true);

      hostComponent.isVisible.set(false);
      hostFixture.detectChanges();

      messagesCard = hostFixture.debugElement.query(By.css('.messages-card'));
      expect(messagesCard.classes['visible']).toBeUndefined();
    });
  });
});
