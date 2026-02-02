import { Component, signal, computed, Signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionChatContainerComponent } from '@app/shared/ui/session-chat-container';
import { DockedMessagesAreaComponent } from '@app/shared/ui/docked-messages-area';
import { FloatingSessionRendererComponent } from '@app/shared/ui/floating-session-renderer';
import { SessionData, SessionStatus, SessionColor, ChatMessage } from '@app/shared/models';

/**
 * Storage keys for multi-session chat
 */
const SESSIONS_STORAGE_KEY = 'multi-chat-sessions';
const ACTIVE_SESSION_KEY = 'multi-chat-active-session';
const PANEL_STATE_KEY = 'multi-chat-panel-state';

/**
 * Stored sessions data structure
 */
interface StoredSessionsData {
  sessions: Record<string, SessionData>;
  activeSessionId: string;
  panelOpen: boolean;
}

/**
 * MultiSessionChatPageComponent
 *
 * Smart container component for multi-session AI chat page with
 * hybrid docked/floating session modes.
 *
 * Architecture:
 * - Manages all session state (Map<id, SessionData>)
 * - Routes messages to DockedMessagesArea OR FloatingSessionRenderer
 * - Reuses SessionChatContainer for tabs and input
 * - Persists state to localStorage
 *
 * Responsibilities:
 * - Session CRUD (create, read, update, delete)
 * - Active session switching
 * - Message sending and AI response simulation
 * - Storage persistence
 * - 5-session limit enforcement
 */
@Component({
  selector: 'app-multi-session-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    SessionChatContainerComponent,
    DockedMessagesAreaComponent,
    FloatingSessionRendererComponent
  ],
  templateUrl: './multi-session-chat-page.component.html',
  styleUrl: './multi-session-chat-page.component.css'
})
export class MultiSessionChatPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  // ===== State Signals =====

  /**
   * Panel visibility state
   */
  readonly isOpen = signal<boolean>(true);

  /**
   * All sessions map
   */
  private readonly sessionsInternal = signal<Map<string, SessionData>>(new Map());
  readonly sessions: Signal<Map<string, SessionData>> = computed(() => this.sessionsInternal());

  /**
   * Active session ID
   */
  readonly activeSessionId = signal<string>('');

  /**
   * Current input value
   */
  readonly inputValue = signal<string>('');

  // ===== Computed Values =====

  /**
   * Active session data
   */
  readonly activeSession = computed(() => {
    const id = this.activeSessionId();
    return id ? this.sessionsInternal().get(id) : undefined;
  });

  /**
   * Active session's mode (docked or floating)
   */
  readonly activeMode = computed(() => {
    return this.activeSession()?.mode || 'docked';
  });

  /**
   * Should show docked messages area?
   */
  readonly shouldShowDocked = computed(() => {
    return this.isOpen() && this.activeMode() === 'docked';
  });

  /**
   * Should show floating session renderer?
   */
  readonly shouldShowFloating = computed(() => {
    return this.isOpen() && this.activeMode() === 'floating';
  });

  // ===== Constructor =====

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultSession();

    // Auto-save on destroy
    this.destroyRef.onDestroy(() => {
      this.saveToStorage();
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Ensure we have at least one session
    if (this.sessionsInternal().size === 0) {
      this.createNewSession('New Chat');
    }
  }

  // ===== Session Management =====

  /**
   * Load state from storage
   */
  private loadFromStorage(): void {
    try {
      const sessionsData = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      const panelState = localStorage.getItem(PANEL_STATE_KEY);

      if (sessionsData) {
        const parsed = JSON.parse(sessionsData) as StoredSessionsData;
        const sessionsMap = new Map<string, SessionData>(Object.entries(parsed.sessions));
        this.sessionsInternal.set(sessionsMap);
        this.activeSessionId.set(activeSession || parsed.activeSessionId || '');
      }

      if (panelState) {
        const state = JSON.parse(panelState);
        this.isOpen.set(state.panelOpen ?? true);
      }
    } catch (error) {
      console.error('[MultiSessionChatPage] Failed to load from storage:', error);
    }
  }

  /**
   * Save state to storage
   */
  private saveToStorage(): void {
    try {
      const sessionsObj = Object.fromEntries(this.sessionsInternal());
      const data: StoredSessionsData = {
        sessions: sessionsObj,
        activeSessionId: this.activeSessionId(),
        panelOpen: this.isOpen()
      };

      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId());
      localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ panelOpen: this.isOpen() }));
    } catch (error) {
      console.error('[MultiSessionChatPage] Failed to save to storage:', error);
    }
  }

  /**
   * Initialize default session if none exists
   */
  private initializeDefaultSession(): void {
    if (this.sessionsInternal().size === 0) {
      this.createNewSession('New Chat');
    }
  }

  /**
   * Create a new session
   */
  private createNewSession(name: string): string {
    const newSession: SessionData = {
      id: `session-${Date.now()}`,
      name,
      messages: [],
      inputValue: '',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: SessionStatus.IDLE,
      color: 'default',
      mode: 'docked'  // Default to docked mode
    };

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.set(newSession.id, newSession);
      return newMap;
    });

    this.activeSessionId.set(newSession.id);
    this.saveToStorage();

    return newSession.id;
  }

  /**
   * Handle session selection from tabs bar
   */
  onSessionSelect(sessionId: string): void {
    // Save current input to active session before switching
    this.saveCurrentInput();

    this.activeSessionId.set(sessionId);
    const session = this.sessionsInternal().get(sessionId);

    if (session) {
      this.inputValue.set(session.inputValue || '');
    }

    this.saveToStorage();
  }

  /**
   * Handle new chat creation
   */
  onNewChat(): void {
    this.saveCurrentInput();

    // Enforce 5-session limit
    if (this.sessionsInternal().size >= 5) {
      this.closeLeastActiveSession();
    }

    this.createNewSession(`Chat ${this.sessionsInternal().size + 1}`);
  }

  /**
   * Close least active session (by lastUpdated timestamp)
   */
  private closeLeastActiveSession(): void {
    const sessions = Array.from(this.sessionsInternal().entries());
    sessions.sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated);

    const [leastActiveId] = sessions[0];
    if (leastActiveId !== this.activeSessionId()) {
      this.sessionsInternal.update(map => {
        const newMap = new Map(map);
        newMap.delete(leastActiveId);
        return newMap;
      });
      console.log(`[MultiSessionChatPage] Closed least active session: ${leastActiveId}`);
    }
  }

  // ===== Input Handling =====

  /**
   * Handle send message
   */
  onSend(message: string): void {
    if (!this.activeSessionId()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    // Add user message
    this.addMessage(userMessage);

    // Clear input
    this.inputValue.set('');
    this.saveCurrentInput();

    // Simulate AI response
    this.simulateAIResponse(message);
  }

  /**
   * Add message to active session
   */
  private addMessage(message: ChatMessage): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated: SessionData = {
          ...session,
          messages: [...session.messages, message],
          lastUpdated: Date.now()
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });

    this.saveToStorage();
  }

  /**
   * Simulate AI response (demo purposes)
   */
  private simulateAIResponse(userMessage: string): void {
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `I received: "${userMessage}". This is a demo response.`,
        timestamp: Date.now()
      };

      this.addMessage(aiMessage);
    }, 1000);
  }

  /**
   * Save current input to active session
   */
  private saveCurrentInput(): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated = {
          ...session,
          inputValue: this.inputValue(),
          lastUpdated: Date.now()
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });
  }

  /**
   * Handle input value change
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);
  }
}
