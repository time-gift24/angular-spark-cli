import { Component, signal, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionChatContainerComponent } from './session-chat-container.component';
import { SessionData } from '@app/shared/models';

describe('SessionChatContainerComponent', () => {
  let component: SessionChatContainerComponent;
  let fixture: ComponentFixture<SessionChatContainerComponent>;

  const mockSessions = new Map<string, SessionData>();
  const mockActiveSessionId = 'session-1';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionChatContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionChatContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have sessions input', () => {
    component.sessions = signal(mockSessions);
    fixture.detectChanges();

    expect(component.sessions).toBeDefined();
  });

  it('should have activeSessionId input', () => {
    component.activeSessionId = signal(mockActiveSessionId);
    fixture.detectChanges();

    expect(component.activeSessionId).toBeDefined();
  });

  it('should have isOpen input', () => {
    component.isOpen = signal(true);
    fixture.detectChanges();

    expect(component.isOpen).toBeDefined();
  });

  it('should have inputValue input', () => {
    component.inputValue = signal('test input');
    fixture.detectChanges();

    expect(component.inputValue).toBeDefined();
  });

  it('should have placeholder input with default value', () => {
    expect(component.placeholder).toBeDefined();
    expect(component.placeholder).toBe('Ask AI anything...');
  });

  it('should have disabled input with default value', () => {
    expect(component.disabled).toBeDefined();
    expect(component.disabled).toBe(false);
  });

  it('should have newChat output', () => {
    expect(component.newChat).toBeDefined();
    expect(component.newChat).toBeInstanceOf(EventEmitter);
  });

  it('should have sessionSelect output', () => {
    expect(component.sessionSelect).toBeDefined();
    expect(component.sessionSelect).toBeInstanceOf(EventEmitter);
  });

  it('should have sessionToggle output', () => {
    expect(component.sessionToggle).toBeDefined();
    expect(component.sessionToggle).toBeInstanceOf(EventEmitter);
  });

  it('should have send output', () => {
    expect(component.send).toBeDefined();
    expect(component.send).toBeInstanceOf(EventEmitter);
  });

  it('should have inputValueChange output', () => {
    expect(component.inputValueChange).toBeDefined();
    expect(component.inputValueChange).toBeInstanceOf(EventEmitter);
  });

  describe('Event Forwarding', () => {
    beforeEach(() => {
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal('');
      fixture.detectChanges();
    });

    it('should forward newChat event', () => {
      spyOn(component.newChat, 'emit');

      component.onNewChat();

      expect(component.newChat.emit).toHaveBeenCalledWith();
    });

    it('should forward sessionSelect event with sessionId', () => {
      spyOn(component.sessionSelect, 'emit');
      const testSessionId = 'session-42';

      component.onSessionSelect(testSessionId);

      expect(component.sessionSelect.emit).toHaveBeenCalledWith(testSessionId);
    });

    it('should forward sessionToggle event', () => {
      spyOn(component.sessionToggle, 'emit');

      component.onSessionToggle();

      expect(component.sessionToggle.emit).toHaveBeenCalledWith();
    });

    it('should forward send event with message', () => {
      spyOn(component.send, 'emit');
      const testMessage = 'Hello, AI!';

      component.onSend(testMessage);

      expect(component.send.emit).toHaveBeenCalledWith(testMessage);
    });

    it('should forward inputValueChange event with value', () => {
      spyOn(component.inputValueChange, 'emit');
      const testValue = 'test input';

      component.onInputChange(testValue);

      expect(component.inputValueChange.emit).toHaveBeenCalledWith(testValue);
    });
  });

  describe('Integration', () => {
    it('should complete full event flow for new chat', () => {
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal('');

      const newChatSpy = jasmine.createSpyObj('emit', ['emit']);
      component.newChat = newChatSpy as any;

      fixture.detectChanges();

      // Simulate child component emitting event
      component.onNewChat();

      expect(newChatSpy.emit).toHaveBeenCalled();
    });

    it('should complete full event flow for sending message', () => {
      const testMessage = 'Test message';
      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal(testMessage);

      const sendSpy = jasmine.createSpyObj('emit', ['emit']);
      component.send = sendSpy as any;

      fixture.detectChanges();

      component.onSend(testMessage);

      expect(sendSpy.emit).toHaveBeenCalledWith(testMessage);
    });

    it('should support two-way binding for inputValue', () => {
      const initialValue = '';
      const newValue = 'new value';

      component.sessions = signal(new Map());
      component.activeSessionId = signal('session-1');
      component.isOpen = signal(true);
      component.inputValue = signal(initialValue);

      const valueChangeSpy = jasmine.createSpyObj('emit', ['emit']);
      component.inputValueChange = valueChangeSpy as any;

      fixture.detectChanges();

      component.onInputChange(newValue);

      expect(component.inputValueChange.emit).toHaveBeenCalledWith(newValue);
    });
  });
});
