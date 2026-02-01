import { Component, signal, computed, Signal } from '@angular/core';
import { SessionTabsBarComponent } from '@app/shared/ui/session-tabs-bar';
import { SessionData, SessionStatus, SessionColor } from '@app/shared/models';

/**
 * Demo Session Tabs Bar Component
 *
 * 展示 Session Tabs Bar 组件的功能和交互效果
 */
@Component({
  selector: 'app-demo-session-tabs-bar',
  standalone: true,
  imports: [SessionTabsBarComponent],
  templateUrl: './demo-session-tabs-bar.component.html',
  styleUrl: './demo-session-tabs-bar.component.css',
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class DemoSessionTabsBarComponent {
  /** 所有会话数据 */
  private sessionsInternal = signal<Map<string, SessionData>>(new Map());

  /** 暴露为 Signal 的会话数据（组件接口要求） */
  readonly sessions: Signal<Map<string, SessionData>> = computed(() => this.sessionsInternal());

  /** 当前激活的会话 ID */
  readonly activeSessionId = signal<string>('');

  /** 下一个会话 ID 计数器 */
  private nextId = 1;

  constructor() {
    this.initializeDemoSessions();
  }

  /**
   * 初始化演示会话数据
   */
  private initializeDemoSessions(): void {
    const now = Date.now();
    const demoSessions: SessionData[] = [
      {
        id: 'session-1',
        name: 'Angular 开发讨论',
        messages: [],
        inputValue: '',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 500 },
        lastUpdated: now - 1000 * 60 * 5,
        status: SessionStatus.PROCESSING,
        color: 'default',
      },
      {
        id: 'session-2',
        name: 'TypeScript 类型问题',
        messages: [],
        inputValue: '如何定义泛型类型？',
        position: { x: 150, y: 150 },
        size: { width: 380, height: 480 },
        lastUpdated: now - 1000 * 60 * 15,
        status: SessionStatus.IDLE,
        color: 'blue',
      },
      {
        id: 'session-3',
        name: 'CSS 样式优化',
        messages: [],
        inputValue: '',
        position: { x: 200, y: 200 },
        size: { width: 420, height: 520 },
        lastUpdated: now - 1000 * 60 * 30,
        status: SessionStatus.DISCONNECTED,
        color: 'purple',
      },
    ];

    const map = new Map<string, SessionData>();
    demoSessions.forEach(session => map.set(session.id, session));
    this.sessionsInternal.set(map);
    this.activeSessionId.set('session-1');
  }

  // ==================== 统计信息 ====================

  /** 会话总数 */
  readonly sessionCount = computed(() => this.sessionsInternal().size);

  /** 当前激活会话名称 */
  readonly activeSessionName = computed(() => {
    const activeId = this.activeSessionId();
    if (!activeId) return '';
    const session = this.sessionsInternal().get(activeId);
    return session?.name || '';
  });

  // ==================== 事件处理 ====================

  /**
   * 处理会话选择事件
   */
  onSessionSelect(sessionId: string): void {
    this.activeSessionId.set(sessionId);
  }

  /**
   * 处理会话切换事件（点击当前激活的会话）
   */
  onSessionToggle(): void {
    console.log('[Demo] Session toggled');
  }

  /**
   * 处理新建会话事件
   */
  onNewChat(): void {
    const newSession: SessionData = {
      id: `session-${this.nextId++}`,
      name: `新对话 ${this.nextId - 1}`,
      messages: [],
      inputValue: '',
      position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
    };

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.set(newSession.id, newSession);
      return newMap;
    });

    this.activeSessionId.set(newSession.id);
  }

  /**
   * 处理会话重命名事件
   */
  onSessionRename(event: { sessionId: string; newName: string }): void {
    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = { ...session, name: event.newName, lastUpdated: Date.now() };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
  }

  /**
   * 处理会话颜色变更事件
   */
  onSessionColorChange(event: { sessionId: string; color: SessionColor }): void {
    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = { ...session, color: event.color, lastUpdated: Date.now() };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
  }

  /**
   * 处理会话关闭事件
   */
  onSessionClose(sessionId: string): void {
    const current = this.sessionsInternal();
    if (current.size <= 1) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.delete(sessionId);
      return newMap;
    });

    if (this.activeSessionId() === sessionId) {
      const remaining = this.sessionsInternal();
      const firstId = Array.from(remaining.keys())[0];
      this.activeSessionId.set(firstId || '');
    }
  }
}
