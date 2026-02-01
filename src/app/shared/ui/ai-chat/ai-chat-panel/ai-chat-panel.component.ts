/**
 * AI Chat Panel Component
 * Unified AI chat interface with session management
 * Mineral & Time Theme - Angular 20+
 *
 * Features:
 * - Session tabs bar for multi-conversation management
 * - Chat messages display with drag/resize support
 * - Modern pill-style input with liquid-glass effect
 * - Status badges for AI state indication
 * - Collapsible panel with toggle button
 */

import {
  Component,
  signal,
  computed,
  Signal,
  afterNextRender,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionTabsBarComponent } from '@app/shared/ui/session-tabs-bar/session-tabs-bar.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatMessagesCardComponent } from '../chat-messages-card/chat-messages-card.component';
import { StatusBadgesComponent } from '../status-badges/status-badges.component';
import { SessionToggleComponent } from '../session-toggle-button/session-toggle-button.component';
import { StatusBadge, BadgeType, ChatMessage as AiChatChatMessage } from '../types/chat.types';
import { SessionData, SessionStatus, SessionColor, ChatMessage } from '@app/shared/models';
import { cn } from '@app/shared/utils';

/**
 * Storage key for sessions data
 */
const SESSIONS_STORAGE_KEY = 'ai-chat-sessions';
const ACTIVE_SESSION_KEY = 'ai-chat-active-session';
const PANEL_STATE_KEY = 'ai-chat-panel-state';

/**
 * Stored sessions data structure
 */
interface StoredSessionsData {
  sessions: Record<string, SessionData>;
  activeSessionId: string;
  panelOpen: boolean;
  panelMessagesVisible: boolean;
}

/**
 * AI Chat Panel Component
 *
 * Main container for AI chat functionality that integrates:
 * - Session management tabs
 * - Message display
 * - Input controls
 * - Status indicators
 */
@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    SessionTabsBarComponent,
    ChatInputComponent,
    ChatMessagesCardComponent,
    StatusBadgesComponent,
    SessionToggleComponent,
  ],
  templateUrl: './ai-chat-panel.component.html',
  styleUrls: ['./ai-chat-panel.component.css'],
})
export class AiChatPanelComponent {
  private readonly destroyRef = inject(DestroyRef);

  // ===== State Signals =====

  /**
   * Panel visibility state
   */
  readonly isOpen = signal<boolean>(false);

  /**
   * Messages panel visibility (can be collapsed while panel is open)
   */
  readonly isMessagesVisible = signal<boolean>(true);

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

  /**
   * Current AI status badge
   */
  readonly currentBadge = signal<StatusBadge | null>(null);

  // ===== Component Classes =====

  protected readonly hostClasses = computed(() =>
    cn('ai-chat-panel-host', this.isOpen() ? 'open' : 'closed'),
  );

  protected readonly panelContainerClasses = computed(() =>
    cn('ai-chat-panel-container', 'liquid-glass', 'liquid-glass-mineral-light'),
  );

  protected readonly messagesCardClasses = computed(() =>
    cn('chat-messages-card-wrapper', !this.isMessagesVisible() ? 'collapsed' : ''),
  );

  // ===== Constructor =====

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultSession();

    afterNextRender(() => {
      this.scrollToBottom();
    });

    // Auto-save on destroy
    this.destroyRef.onDestroy(() => {
      this.saveToStorage();
    });
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
        this.isOpen.set(state.panelOpen || false);
        this.isMessagesVisible.set(state.panelMessagesVisible !== false);
      }
    } catch (error) {
      console.error('[AiChatPanel] Failed to load from storage:', error);
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
        panelOpen: this.isOpen(),
        panelMessagesVisible: this.isMessagesVisible(),
      };

      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId());
      localStorage.setItem(
        PANEL_STATE_KEY,
        JSON.stringify({
          panelOpen: this.isOpen(),
          panelMessagesVisible: this.isMessagesVisible(),
        }),
      );
    } catch (error) {
      console.error('[AiChatPanel] Failed to save to storage:', error);
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
    };

    this.sessionsInternal.update((map) => {
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
      this.isMessagesVisible.set(true);
    }

    this.saveToStorage();
    this.scrollToBottom();
  }

  /**
   * Handle session toggle (collapse/expand)
   */
  onSessionToggle(): void {
    this.isMessagesVisible.update((v) => !v);
    this.saveToStorage();
  }

  /**
   * Handle new chat creation
   */
  onNewChat(): void {
    this.saveCurrentInput();
    this.createNewSession(`Chat ${this.sessionsInternal().size + 1}`);
    this.isMessagesVisible.set(true);
  }

  /**
   * Handle session rename
   */
  onSessionRename(event: { sessionId: string; newName: string }): void {
    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = {
          ...session,
          name: event.newName,
          lastUpdated: Date.now(),
        };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
    this.saveToStorage();
  }

  /**
   * Handle session color change
   */
  onSessionColorChange(event: { sessionId: string; color: string }): void {
    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = {
          ...session,
          color: event.color as SessionColor,
          lastUpdated: Date.now(),
        };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
    this.saveToStorage();
  }

  /**
   * Handle session close
   */
  onSessionClose(sessionId: string): void {
    const current = this.sessionsInternal();
    if (current.size <= 1) {
      // Don't close the last session
      return;
    }

    const wasActive = this.activeSessionId() === sessionId;

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      newMap.delete(sessionId);
      return newMap;
    });

    // If we closed the active session, switch to another
    if (wasActive) {
      const remaining = this.sessionsInternal();
      const firstId = Array.from(remaining.keys())[0];
      if (firstId) {
        this.onSessionSelect(firstId);
      }
    }

    this.saveToStorage();
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
      timestamp: Date.now(),
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

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated: SessionData = {
          ...session,
          messages: [...session.messages, message],
          lastUpdated: Date.now(),
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });

    this.saveToStorage();
    this.scrollToBottom();
  }

  /**
   * Simulate AI response (demo purposes)
   */
  private simulateAIResponse(userMessage: string): void {
    // Show thinking badge
    this.currentBadge.set({
      id: `badge-${Date.now()}-thinking`,
      type: 'thinking' as BadgeType,
      text: 'Thinking...',
    });

    // Simulate processing delay
    setTimeout(() => {
      // Show typing badge
      this.currentBadge.set({
        id: `badge-${Date.now()}-typing`,
        type: 'typing' as BadgeType,
        text: 'Typing...',
      });

      // Simulate typing delay
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: `I received your message: "${userMessage}". This is a demo response from the AI chat panel.`,
          timestamp: Date.now(),
          actions: [
            {
              id: 'copy',
              label: 'Copy',
              icon: '📋',
              callback: () => {
                navigator.clipboard.writeText(aiMessage.content);
              },
            },
          ],
        };

        this.addMessage(aiMessage);

        // Show done badge briefly
        this.currentBadge.set({
          id: `badge-${Date.now()}-done`,
          type: 'done' as BadgeType,
          text: 'Done',
        });

        setTimeout(() => {
          this.currentBadge.set(null);
        }, 2000);
      }, 1500);
    }, 1000);
  }

  /**
   * Handle file button click
   */
  onFileClick(): void {
    console.log('File button clicked');
    // TODO: Implement file upload
  }

  /**
   * Handle image button click
   */
  onImageClick(): void {
    console.log('Image button clicked');
    // TODO: Implement image upload
  }

  /**
   * Handle voice button click
   */
  onVoiceClick(): void {
    console.log('Voice button clicked');
    // TODO: Implement voice input
  }

  /**
   * Handle panel toggle
   */
  onTogglePanel(): void {
    this.isOpen.update((v) => !v);
    this.saveToStorage();
  }

  // ===== Helpers =====

  /**
   * Save current input to active session
   */
  private saveCurrentInput(): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated = {
          ...session,
          inputValue: this.inputValue(),
          lastUpdated: Date.now(),
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });
  }

  /**
   * Scroll messages to bottom
   */
  private scrollToBottom(): void {
    // This will be called by ChatMessagesCardComponent
    setTimeout(() => {
      // TODO: Implement scroll to bottom
    }, 100);
  }

  /**
   * Get active session computed
   */
  readonly activeSession = computed(() => {
    const id = this.activeSessionId();
    return id ? this.sessionsInternal().get(id) : undefined;
  });

  /**
   * Get active session messages
   * Converts from SessionData.ChatMessage to AiChatChatMessage format
   */
  readonly activeMessages = computed(() => {
    const messages = this.activeSession()?.messages || [];
    // Convert messages to the format expected by ChatMessagesCard
    return messages.map((msg) => ({
      ...msg,
      actions: msg.actions?.map((action) => ({
        ...action,
        action: action.callback || (() => {}),
      })),
    })) as AiChatChatMessage[];
  });

  /**
   * Input placeholder text
   */
  readonly placeholder = computed(() => {
    if (!this.activeSessionId()) {
      return 'Select or create a session to start chatting...';
    }
    return 'Ask AI anything...';
  });

  /**
   * Is input disabled
   */
  readonly isInputDisabled = computed(() => {
    return !this.activeSessionId();
  });
}
