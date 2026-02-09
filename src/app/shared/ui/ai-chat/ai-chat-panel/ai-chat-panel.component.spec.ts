import { TestBed } from '@angular/core/testing';
import { AiChatPanelComponent } from './ai-chat-panel.component';
import { AiChatStateService } from '../services';
import { signal } from '@angular/core';
import { SessionData } from '@app/shared/models';

describe('AiChatPanelComponent', () => {
  it('should create', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display active session name', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    const sessionData: SessionData = {
      id: 'test-1',
      name: 'Test Session',
      messages: [],
      inputValue: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      mode: 'docked',
      lastUpdated: Date.now(),
    };

    const sessionSignal = signal<SessionData | null>(sessionData);
    fixture.componentRef.setInput('activeSession', sessionSignal as any);
    fixture.detectChanges();

    expect(fixture.componentInstance.sessionName()).toBe('Test Session');
  });

  it('should prefer preview width over panel width', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    const sessionData: SessionData = {
      id: 'test-1',
      name: 'Test Session',
      messages: [],
      inputValue: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      mode: 'docked',
      lastUpdated: Date.now(),
    };

    const sessionSignal = signal<SessionData | null>(sessionData);
    fixture.componentRef.setInput('activeSession', sessionSignal as any);
    fixture.componentRef.setInput('panelWidth', 500);
    fixture.componentRef.setInput('previewWidth', 640);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(aside.style.width).toBe('640px');

    fixture.componentRef.setInput('previewWidth', null);
    fixture.detectChanges();

    expect(aside.style.width).toBe('500px');
  });

  it('should render user and assistant messages with correct components', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AiChatPanelComponent],
      providers: [AiChatStateService],
    }).createComponent(AiChatPanelComponent);

    const sessionData: SessionData = {
      id: 'test-2',
      name: 'Messages',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
        {
          id: 'm2',
          role: 'assistant',
          content: 'Hi there',
          timestamp: Date.now(),
        },
      ],
      inputValue: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      mode: 'docked',
      lastUpdated: Date.now(),
    };

    const sessionSignal = signal<SessionData | null>(sessionData);
    fixture.componentRef.setInput('activeSession', sessionSignal as any);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ai-message-bubble')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-streaming-markdown')).toBeTruthy();
  });
});
