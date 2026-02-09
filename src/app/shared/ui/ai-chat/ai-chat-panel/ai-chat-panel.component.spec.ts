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
});
