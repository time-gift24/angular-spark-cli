import { Component, signal, computed, Signal } from '@angular/core';
import { SessionTabsBarComponent } from '../../shared/ui/session-tabs-bar/session-tabs-bar.component';
import { SessionData, SessionStatus, SessionColor } from '../../shared/models';

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
  styleUrls: ['./demo-session-tabs-bar.component.css'],
})
export class DemoSessionTabsBarComponent {
  /** 控制面板显示状态 */
  readonly showControls = signal<boolean>(true);

  /** 所有会话数据 */
  private sessionsInternal = signal<Map<string, SessionData>>(new Map());

  /** 暴露为 Signal 的会话数据（组件接口要求） */
  readonly sessions: Signal<Map<string, SessionData>> = computed(() => this.sessionsInternal());

  /** 当前激活的会话 ID */
  readonly activeSessionId = signal<string>('');

  /** 下一个会话 ID 计数器 */
  private nextId = 1;

  constructor() {
    // 初始化一些示例会话
    this.initializeDemoSessions();
  }

  /**
   * 初始化演示会话数据
   */
  initializeDemoSessions(): void {
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

    // 默认激活第一个会话
    this.activeSessionId.set('session-1');
  }

  /**
   * 处理会话选择事件
   */
  onSessionSelect(sessionId: string): void {
    console.log('[Demo] Session selected:', sessionId);
    this.activeSessionId.set(sessionId);
  }

  /**
   * 处理会话切换事件（点击当前激活的会话）
   */
  onSessionToggle(): void {
    console.log('[Demo] Session toggled');
    // 在实际应用中，这里会切换面板的展开/收起状态
    alert('切换面板展开/收起状态');
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
    console.log('[Demo] New session created:', newSession.id);
  }

  /**
   * 添加新会话（用于控制面板测试）
   */
  addRandomSession(): void {
    this.onNewChat();
  }

  /**
   * 删除当前激活的会话
   */
  removeActiveSession(): void {
    const activeId = this.activeSessionId();
    if (!activeId) return;

    const current = this.sessionsInternal();
    if (current.size <= 1) {
      alert('至少保留一个会话');
      return;
    }

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.delete(activeId);
      return newMap;
    });

    // 切换到第一个可用会话
    const remaining = this.sessionsInternal();
    const firstId = Array.from(remaining.keys())[0];
    this.activeSessionId.set(firstId || '');

    console.log('[Demo] Session removed:', activeId);
  }

  /**
   * 更新当前会话名称
   */
  updateActiveSessionName(): void {
    const activeId = this.activeSessionId();
    if (!activeId) return;

    const current = this.sessionsInternal();
    const session = current.get(activeId);
    if (!session) return;

    const newName = prompt('输入新的会话名称:', session.name);
    if (newName && newName.trim()) {
      this.sessionsInternal.update(map => {
        const newMap = new Map(map);
        const updated = { ...session, name: newName.trim(), lastUpdated: Date.now() };
        newMap.set(activeId, updated);
        return newMap;
      });
    }
  }

  /**
   * 切换当前会话状态为 Processing
   */
  setActiveSessionProcessing(): void {
    this.updateActiveSessionStatus(SessionStatus.PROCESSING);
  }

  /**
   * 切换当前会话状态为 Idle
   */
  setActiveSessionIdle(): void {
    this.updateActiveSessionStatus(SessionStatus.IDLE);
  }

  /**
   * 切换当前会话状态为 Disconnected
   */
  setActiveSessionDisconnected(): void {
    this.updateActiveSessionStatus(SessionStatus.DISCONNECTED);
  }

  /**
   * 更新当前会话状态
   */
  private updateActiveSessionStatus(status: SessionStatus): void {
    const activeId = this.activeSessionId();
    if (!activeId) return;

    const current = this.sessionsInternal();
    const session = current.get(activeId);
    if (!session) return;

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      const updated = { ...session, status, lastUpdated: Date.now() };
      newMap.set(activeId, updated);
      return newMap;
    });

    console.log('[Demo] Session status updated:', status);
  }

  /**
   * 获取会话统计信息
   */
  readonly sessionCount = computed(() => this.sessionsInternal().size);

  readonly activeSessionName = computed(() => {
    const activeId = this.activeSessionId();
    if (!activeId) return '';
    const session = this.sessionsInternal().get(activeId);
    return session?.name || '';
  });

  /**
   * 处理会话重命名事件
   */
  onSessionRename(event: { sessionId: string; newName: string }): void {
    console.log('[Demo] Session rename:', event);
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
    console.log('[Demo] Session color change:', event);
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
    console.log('[Demo] Session close:', sessionId);
    const current = this.sessionsInternal();
    if (current.size <= 1) {
      alert('至少保留一个会话');
      return;
    }

    this.sessionsInternal.update(map => {
      const newMap = new Map(map);
      newMap.delete(sessionId);
      return newMap;
    });

    // 如果关闭的是当前会话，切换到第一个可用会话
    if (this.activeSessionId() === sessionId) {
      const remaining = this.sessionsInternal();
      const firstId = Array.from(remaining.keys())[0];
      this.activeSessionId.set(firstId || '');
    }
  }
}
