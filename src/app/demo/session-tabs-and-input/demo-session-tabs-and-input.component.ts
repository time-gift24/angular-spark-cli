import { Component, signal, computed, Signal } from '@angular/core';
import { SessionTabsBarComponent, ChatInputComponent } from '@app/shared/ui/ai-chat';
import { SessionData, SessionColor, SessionStatus } from '@app/shared/models';

/**
 * Demo Session Tabs and Input Component
 *
 * 展示 Session Tabs + Chat Input 组合
 * - 宽度为屏幕的 2/5
 * - 发送消息后右下角显示 Toast 通知
 */
@Component({
  selector: 'app-demo-session-tabs-and-input',
  standalone: true,
  imports: [SessionTabsBarComponent, ChatInputComponent],
  templateUrl: './demo-session-tabs-and-input.component.html',
  styleUrls: ['./demo-session-tabs-and-input.component.css'],
})
export class DemoSessionTabsAndInputComponent {
  // 面板状态
  readonly isOpen = signal<boolean>(true);

  // 会话状态
  private sessionsInternal = signal<Map<string, SessionData>>(new Map());
  readonly sessions: Signal<Map<string, SessionData>> = computed(() => this.sessionsInternal());
  readonly activeSessionId = signal<string>('');

  // 输入状态
  readonly inputValue = signal<string>('');

  // 输入框配置
  readonly placeholder = signal<string>('Ask AI anything...');
  readonly disabled = signal<boolean>(false);

  // Toast 通知状态
  readonly toastVisible = signal<boolean>(false);
  readonly toastMessage = signal<string>('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // 事件日志
  readonly eventLog = signal<string[]>([]);

  // 下一个会话 ID 计数器
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
        mode: 'docked',
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
        mode: 'docked',
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
        mode: 'docked',
      },
    ];

    const map = new Map<string, SessionData>();
    demoSessions.forEach((session) => map.set(session.id, session));
    this.sessionsInternal.set(map);
    this.activeSessionId.set('session-1');
  }

  /**
   * 处理面板切换
   */
  onSessionToggle(): void {
    this.isOpen.update((v) => !v);
    this.addLog(`Toggle panel: ${this.isOpen() ? 'open' : 'closed'}`);
  }

  /**
   * 处理会话选择
   */
  onSessionSelect(sessionId: string): void {
    this.activeSessionId.set(sessionId);
    const session = this.sessionsInternal().get(sessionId);
    this.addLog(`Session selected: "${session?.name || sessionId}"`);
  }

  /**
   * 处理新建会话
   */
  onNewChat(): void {
    const newSession: SessionData = {
      id: `session-${this.nextId++}`,
      name: `新对话 ${this.nextId - 1}`,
      messages: [],
      inputValue: '',
      position: { x: 100, y: 100 },
      size: { width: 400, height: 500 },
      lastUpdated: Date.now(),
      status: SessionStatus.IDLE,
      color: 'default',
      mode: 'docked',
    };

    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      newMap.set(newSession.id, newSession);
      return newMap;
    });

    this.activeSessionId.set(newSession.id);
    this.addLog(`New session created: "${newSession.name}"`);
  }

  /**
   * 处理会话重命名
   */
  onSessionRename(event: { sessionId: string; newName: string }): void {
    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = { ...session, name: event.newName, lastUpdated: Date.now() };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
    this.addLog(`Session renamed: "${event.newName}"`);
  }

  /**
   * 处理会话颜色变更
   */
  onSessionColorChange(event: { sessionId: string; color: SessionColor }): void {
    this.sessionsInternal.update((map) => {
      const newMap = new Map(map);
      const session = newMap.get(event.sessionId);
      if (session) {
        const updated = { ...session, color: event.color, lastUpdated: Date.now() };
        newMap.set(event.sessionId, updated);
      }
      return newMap;
    });
    this.addLog(`Session color changed: ${event.color}`);
  }

  /**
   * 处理会话关闭
   */
  onSessionClose(sessionId: string): void {
    const current = this.sessionsInternal();
    if (current.size <= 1) {
      this.addLog('Cannot close last session');
      return;
    }

    const session = current.get(sessionId);
    this.sessionsInternal.update((map) => {
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

    this.addLog(`Session closed: "${session?.name || sessionId}"`);
  }

  /**
   * 处理发送消息 - 显示 Toast 通知
   */
  onSend(message: string): void {
    this.addLog(`Send message: "${message}"`);

    // 清空输入 - 必须在这里清空，因为 ChatInput 组件的 value 是单向绑定的
    this.inputValue.set('');

    // 清空会话输入草稿
    const activeId = this.activeSessionId();
    if (activeId) {
      this.sessionsInternal.update((map) => {
        const newMap = new Map(map);
        const session = newMap.get(activeId);
        if (session) {
          const updated = { ...session, inputValue: '', lastUpdated: Date.now() };
          newMap.set(activeId, updated);
        }
        return newMap;
      });
    }

    // 显示 Toast 通知
    this.showToast(`✓ 已发送: ${message.length > 20 ? message.substring(0, 20) + '...' : message}`);
  }

  /**
   * 显示 Toast 通知
   */
  private showToast(message: string): void {
    // 清除之前的定时器
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    // 显示新的 Toast
    this.toastMessage.set(message);
    this.toastVisible.set(true);

    // 3秒后自动隐藏
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimer = null;
    }, 3000);
  }

  /**
   * 处理文件按钮点击
   */
  onFileClick(): void {
    this.addLog('File button clicked');
  }

  /**
   * 处理图片按钮点击
   */
  onImageClick(): void {
    this.addLog('Image button clicked');
  }

  /**
   * 处理语音按钮点击
   */
  onVoiceClick(): void {
    this.addLog('Voice button clicked');
  }

  /**
   * 切换面板状态
   */
  togglePanel(): void {
    this.onSessionToggle();
  }

  /**
   * 切换禁用状态
   */
  toggleDisabled(): void {
    this.disabled.update((v) => !v);
  }

  /**
   * 清空日志
   */
  clearLog(): void {
    this.eventLog.set([]);
  }

  /**
   * 添加日志
   */
  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.update((log) => [`[${timestamp}] ${message}`, ...log]);
  }

  /**
   * 功能说明
   */
  readonly features = [
    {
      icon: '📐',
      title: '2/5 屏幕宽度',
      desc: 'Chat Input 组件容器宽度为屏幕的 40%',
    },
    {
      icon: '🔔',
      title: '发送通知',
      desc: '回车发送消息后，右下角显示 Toast 通知',
    },
    {
      icon: '🎯',
      title: '独立组件组合',
      desc: 'Session Tabs Bar 和 Chat Input 都是独立组件',
    },
    {
      icon: '⌨️',
      title: '交互完整',
      desc: '支持切换会话、新建会话、发送消息等完整功能',
    },
  ];

  /**
   * 快捷键说明
   */
  readonly shortcuts = [
    { key: 'Enter', value: '发送消息' },
    { key: 'Shift + Enter', value: '换行' },
    { key: '点击标签', value: '切换会话' },
    { key: '点击激活标签', value: '展开/收起面板' },
  ];
}
