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
 * - Emits events for session selection and panel toggle
 * - Sorts sessions by last updated timestamp (most recent first)
 *
 * Interaction Behavior:
 * - Clicking active session → Emits sessionToggle event (collapse/expand panel)
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
 *       (sessionToggle)="onSessionToggle()"
 *     />
 *   `
 * })
 * export class HostComponent {
 *   constructor(public sessionState: SessionStateService) {}
 *
 *   onSessionSelect(sessionId: string): void {
 *     this.sessionState.switchSession(sessionId);
 *   }
 *
 *   onSessionToggle(): void {
 *     this.sessionState.toggleMessagesVisibility();
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
   * The component computes a sorted array from this map for display.
   * Sessions are sorted by lastUpdated timestamp (most recent first).
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
   * NOT emitted when clicking the already-active session (that emits sessionToggle instead).
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
   * Event emitted when a user clicks the active session tab.
   *
   * This typically toggles the visibility of the messages panel
   * (collapse/expand). Emits no payload.
   *
   * @example
   * ```typescript
   * (sessionToggle)="handleSessionToggle()"
   *
   * handleSessionToggle(): void {
   *   this.sessionState.toggleMessagesVisibility();
   * }
   * ```
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
    { value: 'default', label: '默认绿', color: 'var(--session-color-default)' },
    { value: 'blue', label: '蓝色', color: 'var(--session-color-blue)' },
    { value: 'purple', label: '紫色', color: 'var(--session-color-purple)' },
    { value: 'pink', label: '粉色', color: 'var(--session-color-pink)' },
    { value: 'orange', label: '橙色', color: 'var(--session-color-orange)' },
    { value: 'yellow', label: '黄色', color: 'var(--session-color-yellow)' },
  ] as const;

  /**
   * Cache for menu items to avoid recreating on every change detection
   */
  private menuItemsCache = new Map<string, ContextMenuItem[]>();

  /**
   * Gets menu items for a session tab
   */
  getSessionMenuItems(sessionId: string): ContextMenuItem[] {
    // Check cache first
    if (this.menuItemsCache.has(sessionId)) {
      return this.menuItemsCache.get(sessionId)!;
    }

    const session = this.sessions()().get(sessionId);
    if (!session) return [];

    // Build color menu items (flattened, not nested)
    const colorMenuItems: ContextMenuItem[] = this.AVAILABLE_COLORS.map((color) => ({
      label: color.label,
      icon: `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color.color}"></span>`,
      action: () => this.changeSessionColor(sessionId, color.value),
    }));

    const menuItems: ContextMenuItem[] = [
      {
        label: '重命名',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>`,
        action: () => this.renameSession(sessionId),
      },
      ...colorMenuItems,
      {
        label: '关闭会话',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        destructive: true,
        action: () => this.closeSession(sessionId),
      },
    ];

    // Cache the menu items
    this.menuItemsCache.set(sessionId, menuItems);
    return menuItems;
  }

  /**
   * Computed signal that returns sessions sorted by last updated timestamp.
   *
   * Sorting Logic:
   * - Sorts by lastUpdated in descending order (most recent first)
   * - Provides stable ordering for tabs
   * - Automatically reacts when sessions map changes
   *
   * @readonly
   * @returns Array of SessionData objects sorted by recency
   */
  readonly sortedSessions: Signal<SessionData[]> = computed(() => {
    const sessionMap = this.sessions()();

    // Convert Map to array and sort by lastUpdated (most recent first)
    return Array.from(sessionMap.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  });

  /**
   * Handles click events on session tabs.
   *
   * Click Behavior:
   * - Only responds to left-click (button === 0)
   * - If clicking the active session → Emit sessionToggle event
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
      // Clicking active session → toggle panel visibility
      this.sessionToggle.emit();
    } else {
      // Clicking different session → switch to that session
      this.sessionSelect.emit(sessionId);
    }
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

  /**
   * Gets the color class for a session.
   *
   * @param session - The session data
   * @returns The color class name
   */
  getSessionColorClass(session: SessionData): string {
    const color = session.color || 'default';
    return `session-color-${color}`;
  }
}
