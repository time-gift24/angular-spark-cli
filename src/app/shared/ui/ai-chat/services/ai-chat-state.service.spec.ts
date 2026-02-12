import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { AiChatStateService } from './ai-chat-state.service';

describe('AiChatStateService', () => {
  let service: AiChatStateService;

  const KEY_DOCK_WIDTH = 'ai-chat-dock-width';
  const KEY_DOCK_MODE = 'ai-chat-dock-mode';

  beforeEach(() => {
    localStorage.removeItem(KEY_DOCK_WIDTH);
    localStorage.removeItem(KEY_DOCK_MODE);

    TestBed.configureTestingModule({});
    service = TestBed.inject(AiChatStateService);
  });

  afterEach(() => {
    localStorage.removeItem(KEY_DOCK_WIDTH);
    localStorage.removeItem(KEY_DOCK_MODE);
  });

  it('defaults to pinned mode and width 420', () => {
    expect(service.dockMode()).toBe('pinned');
    expect(service.dockWidth()).toBe(420);
    expect(service.panelOpen()).toBe(true);
  });

  it('loads persisted mode and width from localStorage', () => {
    localStorage.setItem(KEY_DOCK_MODE, 'collapsed');
    localStorage.setItem(KEY_DOCK_WIDTH, '500');

    const restored = new AiChatStateService();

    expect(restored.dockMode()).toBe('collapsed');
    expect(restored.dockWidth()).toBe(500);
    expect(restored.panelOpen()).toBe(false);
  });

  it('clamps width to bounds [320, 520]', () => {
    service.setDockWidth(200);
    expect(service.dockWidth()).toBe(320);

    service.setDockWidth(900);
    expect(service.dockWidth()).toBe(520);
  });

  it('toggles dock mode and persists it', () => {
    service.toggleDockMode();
    expect(service.dockMode()).toBe('collapsed');
    expect(localStorage.getItem(KEY_DOCK_MODE)).toBe('collapsed');

    service.toggleDockMode();
    expect(service.dockMode()).toBe('pinned');
    expect(localStorage.getItem(KEY_DOCK_MODE)).toBe('pinned');
  });

  it('keeps compatibility via openPanel/closePanel/togglePanel', () => {
    service.closePanel();
    expect(service.dockMode()).toBe('collapsed');
    expect(service.panelOpen()).toBe(false);

    service.openPanel();
    expect(service.dockMode()).toBe('pinned');
    expect(service.panelOpen()).toBe(true);

    service.togglePanel();
    expect(service.dockMode()).toBe('collapsed');
  });

  it('keeps compatibility via setPanelWidth', () => {
    service.setPanelWidth(510);
    expect(service.dockWidth()).toBe(510);
    expect(localStorage.getItem(KEY_DOCK_WIDTH)).toBe('510');
  });

  it('falls back safely for invalid persisted values', () => {
    localStorage.setItem(KEY_DOCK_WIDTH, 'not-a-number');
    localStorage.setItem(KEY_DOCK_MODE, 'invalid-mode');

    const restored = new AiChatStateService();

    expect(restored.dockWidth()).toBe(420);
    expect(restored.dockMode()).toBe('pinned');
  });
});
