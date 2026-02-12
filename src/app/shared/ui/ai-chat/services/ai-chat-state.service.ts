import { Injectable, signal, computed } from '@angular/core';
import { SessionData } from '@app/shared/models';

const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 520;
const DOCK_DEFAULT_WIDTH = 420;
const STORAGE_KEY_DOCK_WIDTH = 'ai-chat-dock-width';
const STORAGE_KEY_DOCK_MODE = 'ai-chat-dock-mode';

export type DockMode = 'pinned' | 'collapsed';

interface AiChatState {
  dockMode: DockMode;
  dockWidth: number;
  activeSessionId: string | null;
  sessions: Map<string, SessionData>;
  userScrolled: boolean;
  hasNewMessages: boolean;
}

/**
 * Global state service for AI chat panel.
 *
 * Manages panel open/close state, width persistence, and UI state.
 * All state is reactive using Angular Signals.
 */
@Injectable({ providedIn: 'root' })
export class AiChatStateService {
  private readonly state = signal<AiChatState>({
    dockMode: this.loadStoredDockMode(),
    dockWidth: this.loadStoredDockWidth(),
    activeSessionId: null,
    sessions: new Map(),
    userScrolled: false,
    hasNewMessages: false,
  });

  /** Computed signals for read-only access */
  readonly dockMode = computed(() => this.state().dockMode);
  readonly dockWidth = computed(() => this.state().dockWidth);
  readonly panelOpen = computed(() => this.state().dockMode === 'pinned');
  readonly panelWidth = computed(() => this.state().dockWidth);
  readonly activeSessionId = computed(() => this.state().activeSessionId);
  readonly sessions = computed(() => this.state().sessions);
  readonly userScrolled = computed(() => this.state().userScrolled);
  readonly hasNewMessages = computed(() => this.state().hasNewMessages);

  /** Computed CSS value for main content compression */
  readonly mainContentStyle = computed(() => {
    const width = this.panelOpen() ? this.state().dockWidth : 0;
    return {
      'flex-basis': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
      'max-width': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
    };
  });

  /** Computed CSS value for panel width */
  readonly panelStyle = computed(() => ({
    width: `${this.state().dockWidth}px`,
    transform: this.panelOpen() ? 'translateX(0)' : 'translateX(100%)',
  }));

  toggleDockMode(): void {
    this.state.update((s) => {
      const nextMode: DockMode = s.dockMode === 'pinned' ? 'collapsed' : 'pinned';
      this.saveDockMode(nextMode);
      return { ...s, dockMode: nextMode };
    });
  }

  setDockMode(mode: DockMode): void {
    this.state.update((s) => ({ ...s, dockMode: mode }));
    this.saveDockMode(mode);
  }

  setDockWidth(width: number): void {
    const clamped = this.clampWidth(width);
    this.state.update((s) => ({ ...s, dockWidth: clamped }));
    this.saveDockWidth(clamped);
  }

  togglePanel(): void {
    this.toggleDockMode();
  }

  openPanel(): void {
    this.setDockMode('pinned');
  }

  closePanel(): void {
    this.setDockMode('collapsed');
  }

  setPanelWidth(width: number): void {
    this.setDockWidth(width);
  }

  setActiveSession(sessionId: string | null): void {
    this.state.update((s) => ({ ...s, activeSessionId: sessionId }));
  }

  setSessions(sessions: Map<string, SessionData>): void {
    this.state.update((s) => ({ ...s, sessions }));
  }

  setUserScrolled(scrolled: boolean): void {
    this.state.update((s) => ({ ...s, userScrolled: scrolled }));
  }

  setHasNewMessages(hasNew: boolean): void {
    this.state.update((s) => ({ ...s, hasNewMessages: hasNew }));
  }

  private clampWidth(width: number): number {
    return Math.max(DOCK_MIN_WIDTH, Math.min(DOCK_MAX_WIDTH, width));
  }

  private loadStoredDockWidth(): number {
    if (typeof localStorage === 'undefined') return DOCK_DEFAULT_WIDTH;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCK_WIDTH);
      if (!stored) return DOCK_DEFAULT_WIDTH;
      const parsed = parseInt(stored, 10);
      if (!Number.isFinite(parsed)) return DOCK_DEFAULT_WIDTH;
      return this.clampWidth(parsed);
    } catch {
      return DOCK_DEFAULT_WIDTH;
    }
  }

  private saveDockWidth(width: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DOCK_WIDTH, width.toString());
    } catch {
      // Ignore storage errors
    }
  }

  private loadStoredDockMode(): DockMode {
    if (typeof localStorage === 'undefined') return 'pinned';
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCK_MODE);
      return stored === 'collapsed' ? 'collapsed' : 'pinned';
    } catch {
      return 'pinned';
    }
  }

  private saveDockMode(mode: DockMode): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DOCK_MODE, mode);
    } catch {
      // Ignore storage errors
    }
  }
}
