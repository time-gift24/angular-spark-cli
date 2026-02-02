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
});
