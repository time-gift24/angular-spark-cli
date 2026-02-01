import {
  Component,
  Input,
  Output,
  EventEmitter,
  Signal,
  computed,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { SessionData, SessionColor } from '@app/shared/models';

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
  standalone: true,
  imports: [],
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
  @Input({ required: true })
  sessions: Signal<Map<string, SessionData>>;

  /**
   * Signal containing the ID of the currently active session.
   *
   * Used to highlight the active tab and determine click behavior.
   * Note: An empty string indicates no active session.
   *
   * @required
   */
  @Input({ required: true })
  activeSessionId: Signal<string>;

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
  @Output()
  readonly sessionSelect = new EventEmitter<string>();

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
  @Output()
  readonly sessionToggle = new EventEmitter<void>();

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
  @Output()
  readonly newChat = new EventEmitter<void>();

  /**
   * Event emitted when user right-clicks on a session tab.
   *
   * Emits an object with the session ID for showing context menu.
   *
   * @example
   * ```typescript
   * (sessionContextMenu)="showContextMenu($event)"
   *
   * showContextMenu(sessionId: string): void {
   *   this.contextMenuSessionId = sessionId;
   *   this.contextMenuVisible = true;
   * }
   * ```
   */
  @Output()
  readonly sessionContextMenu = new EventEmitter<string>();

  /**
   * Event emitted when user wants to rename a session.
   *
   * Emits an object with sessionId and newName.
   */
  @Output()
  readonly sessionRename = new EventEmitter<{ sessionId: string; newName: string }>();

  /**
   * Event emitted when user wants to change session color.
   *
   * Emits an object with sessionId and color.
   */
  @Output()
  readonly sessionColorChange = new EventEmitter<{ sessionId: string; color: SessionColor }>();

  /**
   * Event emitted when user wants to close a session.
   *
   * Emits the session ID to close.
   */
  @Output()
  readonly sessionClose = new EventEmitter<string>();

  /**
   * Currently shown context menu for session ID
   */
  contextMenuSessionId = signal<string | null>(null);

  /**
   * Context menu position
   */
  contextMenuPosition = signal<{ x: number; y: number } | null>(null);

  /**
   * Color submenu visibility
   */
  showColorSubmenu = signal<boolean>(false);

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
    const sessionMap = this.sessions();

    // Convert Map to array and sort by lastUpdated (most recent first)
    return Array.from(sessionMap.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  });

  /**
   * Handles click events on session tabs.
   *
   * Click Behavior:
   * - If clicking the active session → Emit sessionToggle event
   * - If clicking a different session → Emit sessionSelect event with session ID
   *
   * @param event - The mouse event (prevent default to avoid form submission)
   * @param sessionId - The ID of the clicked session
   */
  handleSessionClick(event: MouseEvent, sessionId: string): void {
    event.preventDefault();

    const activeId = this.activeSessionId();

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
   * Handles right-click (context menu) on session tabs.
   *
   * @param event - The mouse event
   * @param sessionId - The ID of the session
   */
  handleSessionContextMenu(event: MouseEvent, sessionId: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuSessionId.set(sessionId);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.sessionContextMenu.emit(sessionId);
  }

  /**
   * Closes the context menu.
   */
  closeContextMenu(): void {
    this.contextMenuSessionId.set(null);
    this.contextMenuPosition.set(null);
    this.showColorSubmenu.set(false);
  }

  /**
   * Initiates renaming a session.
   *
   * @param sessionId - The ID of the session to rename
   */
  renameSession(sessionId: string): void {
    const session = this.sessions().get(sessionId);
    if (!session) return;

    const newName = prompt('输入新的会话名称:', session.name);
    if (newName && newName.trim()) {
      this.sessionRename.emit({ sessionId, newName: newName.trim() });
    }

    this.closeContextMenu();
  }

  /**
   * Toggles the color submenu visibility.
   */
  toggleColorSubmenu(): void {
    this.showColorSubmenu.update((v) => !v);
  }

  /**
   * Gets all available colors for the color submenu.
   */
  getAvailableColors(): Array<{ value: SessionColor; label: string; color: string }> {
    return [
      { value: 'default', label: '默认绿', color: 'oklch(0.48 0.07 195)' },
      { value: 'blue', label: '蓝色', color: 'oklch(0.55 0.12 225)' },
      { value: 'purple', label: '紫色', color: 'oklch(0.55 0.14 285)' },
      { value: 'pink', label: '粉色', color: 'oklch(0.60 0.18 350)' },
      { value: 'orange', label: '橙色', color: 'oklch(0.65 0.15 50)' },
      { value: 'yellow', label: '黄色', color: 'oklch(0.75 0.12 85)' },
    ];
  }

  /**
   * Changes session color to specific color.
   *
   * @param sessionId - The ID of the session
   * @param color - The color to apply
   */
  changeSessionColor(sessionId: string, color: SessionColor): void {
    this.sessionColorChange.emit({ sessionId, color });
    this.closeContextMenu();
  }

  /**
   * Closes a session.
   *
   * @param sessionId - The ID of the session to close
   */
  closeSession(sessionId: string): void {
    this.sessionClose.emit(sessionId);
    this.closeContextMenu();
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
