import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { SessionChatContainerComponent } from '@app/shared/ui/ai-chat';
import { SessionStatus, type SessionData } from '@app/shared/models';
import { initialState } from './examples';

@Component({
  selector: 'app-demo-session-chat-container',
  imports: [SessionChatContainerComponent],
  templateUrl: './demo-session-chat-container.component.html',
  styleUrls: ['./demo-session-chat-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoSessionChatContainerComponent {
  // State
  private sessionsInternal = signal<Map<string, SessionData>>(
    initialState.sessions,
  );
  readonly sessions = computed(() => this.sessionsInternal());
  readonly activeSessionId = signal(initialState.activeSessionId);
  readonly isOpen = signal(initialState.isOpen);
  readonly inputValue = signal(initialState.inputValue);
  readonly sessionsSignal = computed(() => this.sessionsInternal());
  readonly activeSessionIdSignal = this.activeSessionId;
  readonly isOpenSignal = this.isOpen;
  readonly inputValueSignal = this.inputValue;

  // Event log
  readonly eventLog = signal<string[]>([]);

  // Counter for new sessions
  private nextId = 3;

  /**
   * Handle new chat event
   */
  onNewChat(): void {
    const currentSessions = this.sessionsInternal();

    // Check 5-tab limit
    if (currentSessions.size >= 5) {
      this.addLog('已达到最大会话数 (5)，关闭最不活跃的会话');

      // Find least active session
      let leastActiveId = '';
      let leastActiveTime = Infinity;

      currentSessions.forEach((session, id) => {
        if (session.lastUpdated < leastActiveTime) {
          leastActiveTime = session.lastUpdated;
          leastActiveId = id;
        }
      });

      // Close least active
      if (leastActiveId) {
        this.sessionsInternal.update((map) => {
          const newMap = new Map(map);
          newMap.delete(leastActiveId);
          return newMap;
        });
      }
    }

    // Create new session
    const newSession: SessionData = {
      id: `session-${this.nextId++}`,
      name: `新对话 ${this.nextId - 1}`,
      messages: [],
      inputValue: '',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: SessionStatus.IDLE,
      color: 'purple',
      mode: 'docked',
    };

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      newMap.set(newSession.id, newSession);
      return newMap;
    });

    this.activeSessionId.set(newSession.id);
    this.addLog(`创建新会话: ${newSession.name}`);
  }

  /**
   * Handle session select event
   */
  onSessionSelect(sessionId: string): void {
    this.activeSessionId.set(sessionId);
    const session = this.sessionsInternal().get(sessionId);
    this.addLog(`切换会话: "${session?.name || sessionId}"`);

    // Restore draft input
    if (session) {
      this.inputValue.set(session.inputValue || '');
    }
  }

  /**
   * Handle session toggle event
   */
  onSessionToggle(): void {
    this.isOpen.update((v) => !v);
    this.addLog(`面板: ${this.isOpen() ? '展开' : '收起'}`);
  }

  /**
   * Handle send message event
   */
  onSend(message: string): void {
    this.addLog(`发送消息: "${message}"`);

    // Clear input
    this.inputValue.set('');

    // Save to session
    const activeId = this.activeSessionId();
    if (activeId) {
      this.sessionsInternal.update((map) => {
        const newMap = new Map(map);
        const session = newMap.get(activeId);
        if (session) {
          const updated = {
            ...session,
            inputValue: '',
            lastUpdated: Date.now(),
          };
          newMap.set(activeId, updated);
        }
        return newMap;
      });
    }
  }

  /**
   * Handle input value change
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);

    // Save draft to session
    const activeId = this.activeSessionId();
    if (activeId) {
      this.sessionsInternal.update((map) => {
        const newMap = new Map(map);
        const session = newMap.get(activeId);
        if (session) {
          const updated = {
            ...session,
            inputValue: value,
            lastUpdated: Date.now(),
          };
          newMap.set(activeId, updated);
        }
        return newMap;
      });
    }
  }

  /**
   * Toggle panel
   */
  togglePanel(): void {
    this.onSessionToggle();
  }

  /**
   * Clear log
   */
  clearLog(): void {
    this.eventLog.set([]);
  }

  /**
   * Handle session color change
   */
  onSessionColorChange(event: { sessionId: string; color: string }): void {
    const { sessionId, color } = event;

    // Update session color (don't update lastUpdated to preserve sorting)
    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(sessionId);
      if (session) {
        const updated = {
          ...session,
          color: color as any,
        };
        newMap.set(sessionId, updated);
      }
      return newMap;
    });

    const session = this.sessionsInternal().get(sessionId);
    this.addLog(`更改颜色: "${session?.name}" → ${color}`);
  }

  /**
   * Add log entry
   */
  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.update((log) => [`[${timestamp}] ${message}`, ...log]);
  }
}
