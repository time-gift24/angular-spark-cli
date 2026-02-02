import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSessionChatPageComponent } from './multi-session-chat-page.component';
import { SessionData, SessionStatus } from '@app/shared/models';

describe('MultiSessionChatPage Integration', () => {
  let component: MultiSessionChatPageComponent;
  let fixture: ComponentFixture<MultiSessionChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSessionChatPageComponent]
    }).compileComponents();

    // Clear localStorage before each test
    localStorage.clear();

    fixture = TestBed.createComponent(MultiSessionChatPageComponent);
    component = fixture.componentInstance;
  });

  it('should complete full session lifecycle', () => {
    // 1. Initialize
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.sessions().size).toBe(1);

    // 2. Create new session
    component.onNewChat();
    fixture.detectChanges();

    expect(component.sessions().size).toBe(2);

    // 3. Send message
    component.inputValue.set('Hello AI');
    component.onSend('Hello AI');
    fixture.detectChanges();

    const activeSession = component.activeSession();
    expect(activeSession?.messages.length).toBe(1); // User message

    // 4. Wait for AI response
    setTimeout(() => {
      fixture.detectChanges();
      expect(activeSession?.messages.length).toBe(2); // User + AI
    }, 1500);
  });

  it('should switch between docked and floating sessions', () => {
    component.ngOnInit();

    // Create floating session
    const floatingId = 'floating-1';
    const floatingSession: SessionData = {
      id: floatingId,
      name: 'Floating Chat',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 300, y: 200 },
      size: { width: 500, height: 600 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.sessionsInternal.update(map => new Map(map).set(floatingId, floatingSession));

    // Switch to floating session
    component.onSessionSelect(floatingId);
    fixture.detectChanges();

    expect(component.activeMode()).toBe('floating');
    expect(component.shouldShowFloating()).toBe(true);
    expect(component.shouldShowDocked()).toBe(false);

    // Switch back to docked session
    const dockedId = Array.from(component.sessions().keys())[0];
    component.onSessionSelect(dockedId);
    fixture.detectChanges();

    expect(component.activeMode()).toBe('docked');
    expect(component.shouldShowDocked()).toBe(true);
    expect(component.shouldShowFloating()).toBe(false);
  });

  it('should enforce 5-session limit', () => {
    component.ngOnInit();

    // Create 5 sessions
    for (let i = 0; i < 5; i++) {
      component.onNewChat();
    }

    expect(component.sessions().size).toBe(5);

    // Try to create 6th session
    const initialSize = component.sessions().size;
    component.onNewChat();

    // Should still be 5 (least active closed)
    expect(component.sessions().size).toBe(5);
  });

  afterEach(() => {
    localStorage.clear();
  });
});
