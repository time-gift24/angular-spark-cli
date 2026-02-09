import { Injectable, signal, computed } from '@angular/core';
import { SessionData } from '@app/shared/models';

const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 800;
const PANEL_DEFAULT_WIDTH = 500;
const STORAGE_KEY = 'ai-chat-panel-width';

interface AiChatState {
  panelOpen: boolean;
  panelWidth: number;
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
    panelOpen: false,
    panelWidth: this.loadStoredWidth(),
    activeSessionId: null,
    sessions: new Map(),
    userScrolled: false,
    hasNewMessages: false,
  });

  /** Computed signals for read-only access */
  readonly panelOpen = computed(() => this.state().panelOpen);
  readonly panelWidth = computed(() => this.state().panelWidth);
  readonly activeSessionId = computed(() => this.state().activeSessionId);
  readonly sessions = computed(() => this.state().sessions);
  readonly userScrolled = computed(() => this.state().userScrolled);
  readonly hasNewMessages = computed(() => this.state().hasNewMessages);

  /** Computed CSS value for main content compression */
  readonly mainContentStyle = computed(() => {
    const width = this.panelOpen() ? this.state().panelWidth : 0;
    return {
      'flex-basis': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
      'max-width': this.panelOpen() ? `calc(100% - ${width}px)` : '100%',
    };
  });

  /** Computed CSS value for panel width */
  readonly panelStyle = computed(() => ({
    width: `${this.state().panelWidth}px`,
    transform: this.panelOpen() ? 'translateX(0)' : 'translateX(100%)',
  }));

  togglePanel(): void {
    this.state.update((s) => ({ ...s, panelOpen: !s.panelOpen }));
  }

  openPanel(): void {
    console.log('[AiChatState] openPanel called, current panelOpen:', this.state().panelOpen);
    this.state.update((s) => {
      const newState = { ...s, panelOpen: true };
      console.log('[AiChatState] New state panelOpen:', newState.panelOpen);
      return newState;
    });
  }

  closePanel(): void {
    this.state.update((s) => ({ ...s, panelOpen: false }));
  }

  setPanelWidth(width: number): void {
    const clamped = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, width));
    this.state.update((s) => ({ ...s, panelWidth: clamped }));
    this.saveWidth(clamped);
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

  private loadStoredWidth(): number {
    if (typeof localStorage === 'undefined') return PANEL_DEFAULT_WIDTH;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : PANEL_DEFAULT_WIDTH;
    } catch {
      return PANEL_DEFAULT_WIDTH;
    }
  }

  private saveWidth(width: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, width.toString());
    } catch {
      // Ignore storage errors
    }
  }
}
