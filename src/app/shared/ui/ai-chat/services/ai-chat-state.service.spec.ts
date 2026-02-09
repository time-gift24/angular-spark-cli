import { TestBed } from '@angular/core/testing';
import { AiChatStateService } from './ai-chat-state.service';

describe('AiChatStateService', () => {
  let service: AiChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiChatStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with panel closed', () => {
    expect(service.panelOpen()).toBe(false);
  });

  it('should initialize with default panel width', () => {
    expect(service.panelWidth()).toBe(500);
  });

  it('should toggle panel open state', () => {
    service.togglePanel();
    expect(service.panelOpen()).toBe(true);
    service.togglePanel();
    expect(service.panelOpen()).toBe(false);
  });

  it('should open and close panel', () => {
    service.openPanel();
    expect(service.panelOpen()).toBe(true);
    service.closePanel();
    expect(service.panelOpen()).toBe(false);
  });

  it('should clamp panel width between min and max', () => {
    service.setPanelWidth(200);
    expect(service.panelWidth()).toBe(300); // min

    service.setPanelWidth(1000);
    expect(service.panelWidth()).toBe(800); // max

    service.setPanelWidth(500);
    expect(service.panelWidth()).toBe(500); // within range
  });

  it('should track user scroll state', () => {
    expect(service.userScrolled()).toBe(false);
    service.setUserScrolled(true);
    expect(service.userScrolled()).toBe(true);
  });

  it('should track new messages indicator', () => {
    expect(service.hasNewMessages()).toBe(false);
    service.setHasNewMessages(true);
    expect(service.hasNewMessages()).toBe(true);
  });

  it('should compute main content style based on panel state', () => {
    service.closePanel();
    expect(service.mainContentStyle()['flex-basis']).toBe('100%');

    service.openPanel();
    service.setPanelWidth(600);
    expect(service.mainContentStyle()['flex-basis']).toBe('calc(100% - 600px)');
  });

  it('should compute panel style based on panel state', () => {
    service.closePanel();
    expect(service.panelStyle().transform).toBe('translateX(100%)');

    service.openPanel();
    expect(service.panelStyle().transform).toBe('translateX(0)');
  });
});
