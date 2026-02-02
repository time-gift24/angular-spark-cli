import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSessionChatPageComponent } from './multi-session-chat-page.component';
import { SessionData, SessionStatus, SessionColor } from '@app/shared/models';

describe('MultiSessionChatPageComponent', () => {
  let component: MultiSessionChatPageComponent;
  let fixture: ComponentFixture<MultiSessionChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSessionChatPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSessionChatPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default docked session', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const sessions = component.sessions();
    expect(sessions.size).toBe(1);

    const firstSession = Array.from(sessions.values())[0];
    expect(firstSession.mode).toBe('docked');
    expect(firstSession.name).toBe('New Chat');
  });

  it('should detect active session mode correctly', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const activeMode = component.activeMode();
    expect(activeMode).toBe('docked');
  });

  it('should show docked area when active session is docked', () => {
    component.ngOnInit();
    component.isOpen.set(true);
    fixture.detectChanges();

    const shouldShow = component.shouldShowDocked();
    expect(shouldShow).toBe(true);
  });

  it('should not show floating renderer when active session is docked', () => {
    component.ngOnInit();
    component.isOpen.set(true);
    fixture.detectChanges();

    const shouldShow = component.shouldShowFloating();
    expect(shouldShow).toBe(false);
  });

  it('should switch active session', () => {
    component.ngOnInit();

    const sessionId2 = 'session-2';
    const session2: SessionData = {
      id: sessionId2,
      name: 'Chat 2',
      messages: [],
      inputValue: '',
      mode: 'floating',
      position: { x: 200, y: 200 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: 'idle',
      color: 'default'
    };

    component.sessionsInternal.update(map => new Map(map).set(sessionId2, session2));
    component.onSessionSelect(sessionId2);
    fixture.detectChanges();

    expect(component.activeSessionId()).toBe(sessionId2);
    expect(component.activeMode()).toBe('floating');
    expect(component.shouldShowDocked()).toBe(false);
    expect(component.shouldShowFloating()).toBe(true);
  });
});
