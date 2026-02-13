import {
  Component,
  input,
  output,
  Signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SessionData, SessionColor } from '@app/shared/models';
import { ContextMenuTriggerDirective, ContextMenuItem } from '@app/shared/ui/context-menu';

/**
 * Session Tabs Bar Component
 *
 * Displays a horizontal row of session tabs that are always visible at the bottom
 * of the screen. This component provides session switching functionality with visual
 * feedback for the active session.
 *
 * Key Features:
 * - Displays all available sessions as tabs
 * - Highlights the currently active session
 * - Emits events for session selection
 * - Preserves insertion order (no auto-sorting while clicking tabs)
 *
 * Interaction Behavior:
 * - Clicking active session → Keep active highlight only
 * - Clicking different session → Emits sessionSelect event with session ID
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <spark-session-tabs-bar
 *       [sessions]="sessionState.sessions"
 *       [activeSessionId]="sessionState.activeSessionId"
 *       (sessionSelect)="onSessionSelect($event)"
 *     />
 *   `
 * })
 * export class HostComponent {
 *   constructor(public sessionState: SessionStateService) {}
 *
 *   onSessionSelect(sessionId: string): void {
 *     this.sessionState.switchSession(sessionId);
 *   }
 * }
 * ```
 *
 * @Phase 4 - Task 4.1: Session Tabs Bar Component Definition
 */
@Component({
  selector: 'spark-session-tabs-bar',
  imports: [ContextMenuTriggerDirective],
  templateUrl: './session-tabs-bar.component.html',
  styleUrl: './session-tabs-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionTabsBarComponent {
  /**
   * Signal containing the map of all sessions.
   *
   * The component converts this map into an array for display while
   * preserving the map insertion order.
   *
   * @required
   */
  readonly sessions = input.required<Signal<Map<string, SessionData>>>();

  /**
   * Signal containing the ID of the currently active session.
   *
   * Used to highlight the active tab and determine click behavior.
   * Note: An empty string indicates no active session.
   *
   * @required
   */
  readonly activeSessionId = input.required<Signal<string>>();

  /**
   * Event emitted when a user selects a different session.
   *
   * Emits the session ID of the selected session.
   * NOT emitted when clicking the already-active session.
   *
   * @example
   * ```typescript
   * (sessionSelect)="handleSessionSelect($event)"
   *
   * handleSessionSelect(sessionId: string): void {
   *   this.sessionState.switchSession(sessionId);
   * }
   * ```
   */
  readonly sessionSelect = output<string>();

  /**
   * Legacy output kept for backward compatibility.
   *
   * Session tab clicks no longer emit this event.
   */
  readonly sessionToggle = output<void>();

  /**
   * Event emitted when user clicks the "New Chat" button.
   *
   * Parent component should handle this by creating a new session.
   * Emits no payload.
   *
   * @example
   * ```typescript
   * (newChat)="handleNewChat()"
   *
   * handleNewChat(): void {
   *   const newSessionId = this.sessionState.createSession();
   *   this.sessionState.switchSession(newSessionId);
   * }
   * ```
   */
  readonly newChat = output<void>();

  /**
   * Event emitted when user wants to rename a session.
   *
   * Emits an object with sessionId and newName.
   */
  readonly sessionRename = output<{ sessionId: string; newName: string }>();

  /**
   * Event emitted when user wants to change session color.
   *
   * Emits an object with sessionId and color.
   */
  readonly sessionColorChange = output<{ sessionId: string; color: SessionColor }>();

  /**
   * Event emitted when user wants to close a session.
   *
   * Emits the session ID to close.
   */
  readonly sessionClose = output<string>();

  /**
   * Available colors for sessions (cached for performance)
   */
  private readonly AVAILABLE_COLORS: ReadonlyArray<{
    value: SessionColor;
    label: string;
    color: string;
  }> = [
    { value: 'blue', label: '蓝色', color: '#3b82f6' },
    { value: 'purple', label: '紫色', color: '#8b5cf6' },
    { value: 'pink', label: '粉色', color: '#ec4899' },
    { value: 'orange', label: '橙色', color: '#f97316' },
    { value: 'yellow', label: '黄色', color: '#eab308' },
  ] as const;

  private readonly COLOR_STYLE_TOKENS: Readonly<
    Record<
      SessionColor,
      {
        bg: string;
        bgActive: string;
        border: string;
        borderActive: string;
        text: string;
        textActive: string;
      }
    >
  > = {
    // Tailwind colors: blue-500/600/700
    blue: {
      bg: '#3b82f61f',
      bgActive: '#3b82f638',
      border: '#3b82f652',
      borderActive: '#3b82f680',
      text: '#1d4ed8',
      textActive: '#1e40af',
    },
    // Tailwind colors: violet-500/600/700
    purple: {
      bg: '#8b5cf61f',
      bgActive: '#8b5cf638',
      border: '#8b5cf652',
      borderActive: '#8b5cf680',
      text: '#6d28d9',
      textActive: '#5b21b6',
    },
    // Tailwind colors: pink-500/600/700
    pink: {
      bg: '#ec48991f',
      bgActive: '#ec489938',
      border: '#ec489952',
      borderActive: '#ec489980',
      text: '#be185d',
      textActive: '#9d174d',
    },
    // Tailwind colors: orange-500/600/700
    orange: {
      bg: '#f973161f',
      bgActive: '#f9731638',
      border: '#f9731652',
      borderActive: '#f9731680',
      text: '#c2410c',
      textActive: '#9a3412',
    },
    // Tailwind colors: yellow-500/600/700
    yellow: {
      bg: '#eab3081f',
      bgActive: '#eab30838',
      border: '#eab30852',
      borderActive: '#eab30880',
      text: '#a16207',
      textActive: '#854d0e',
    },
  } as const;

  /**
   * Gets menu items for a session tab
   */
  getSessionMenuItems(sessionId: string): ContextMenuItem[] {
    const session = this.sessions()().get(sessionId);
    if (!session) {
      return [];
    }

    // Build color menu items (flattened, not nested)
    const colorMenuItems: ContextMenuItem[] = this.AVAILABLE_COLORS.map((color) => {
      const isCurrent = (session.color ?? 'purple') === color.value;
      return {
        label: isCurrent ? `${color.label}（当前）` : color.label,
        icon: { type: 'swatch', color: color.color },
        shortcut: isCurrent ? '✓' : undefined,
        action: () => this.changeSessionColor(sessionId, color.value),
      };
    });

    const menuItems: ContextMenuItem[] = [
      {
        label: '重命名',
        icon: { type: 'icon', name: 'edit' },
        action: () => this.renameSession(sessionId),
      },
      ...colorMenuItems,
      {
        label: '关闭会话',
        icon: { type: 'icon', name: 'x' },
        destructive: true,
        action: () => this.closeSession(sessionId),
      },
    ];

    return menuItems;
  }

  /**
   * Computed signal that returns sessions in insertion order.
   *
   * @readonly
   * @returns Array of SessionData objects for display
   */
  readonly displaySessions: Signal<SessionData[]> = computed(() => {
    const sessionMap = this.sessions()();
    return Array.from(sessionMap.values());
  });

  /**
   * Handles click events on session tabs.
   *
   * Click Behavior:
   * - Only responds to left-click (button === 0)
   * - If clicking the active session → No-op (keep highlight)
   * - If clicking a different session → Emit sessionSelect event with session ID
   *
   * @param event - The mouse event (prevent default to avoid form submission)
   * @param sessionId - The ID of the clicked session
   */
  handleSessionClick(event: MouseEvent, sessionId: string): void {
    event.preventDefault();

    // Only respond to left-click (button === 0)
    // Prevents right-click from triggering session switching
    if (event.button !== 0) {
      return;
    }

    const activeId = this.activeSessionId()();

    if (sessionId === activeId) {
      return;
    }

    // Clicking different session → switch to that session
    this.sessionSelect.emit(sessionId);
  }

  /**
   * Handles click events on the "New Chat" button.
   *
   * Emits the newChat event for parent component to handle.
   * Parent component should create a new session and switch to it.
   *
   * @param event - The mouse event (prevent default to avoid form submission)
   */
  handleNewChat(event: MouseEvent): void {
    event.preventDefault();
    this.newChat.emit();
  }

  /**
   * Initiates renaming a session.
   *
   * @param sessionId - The ID of the session to rename
   */
  renameSession(sessionId: string): void {
    const session = this.sessions()().get(sessionId);
    if (!session) return;

    const newName = prompt('输入新的会话名称:', session.name);
    if (newName && newName.trim()) {
      this.sessionRename.emit({ sessionId, newName: newName.trim() });
    }
  }

  /**
   * Changes session color to specific color.
   *
   * @param sessionId - The ID of the session
   * @param color - The color to apply
   */
  changeSessionColor(sessionId: string, color: SessionColor): void {
    this.sessionColorChange.emit({ sessionId, color });
  }

  /**
   * Closes a session.
   *
   * @param sessionId - The ID of the session to close
   */
  closeSession(sessionId: string): void {
    this.sessionClose.emit(sessionId);
  }

  private getSessionColorKey(color?: string): SessionColor {
    switch (color) {
      case 'blue':
      case 'purple':
      case 'pink':
      case 'orange':
      case 'yellow':
        return color;
      default:
        // Backward compatible fallback for old persisted values (e.g. "default")
        return 'purple';
    }
  }

  getSessionBackgroundColor(session: SessionData, isActive: boolean): string {
    const palette = this.COLOR_STYLE_TOKENS[this.getSessionColorKey(session.color)];
    return isActive ? palette.bgActive : palette.bg;
  }

  getSessionBorderColor(session: SessionData, isActive: boolean): string {
    const palette = this.COLOR_STYLE_TOKENS[this.getSessionColorKey(session.color)];
    return isActive ? palette.borderActive : palette.border;
  }

  getSessionTextColor(session: SessionData, isActive: boolean): string {
    const palette = this.COLOR_STYLE_TOKENS[this.getSessionColorKey(session.color)];
    return isActive ? palette.textActive : palette.text;
  }
}
