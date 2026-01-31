import { Component, Input, Output, EventEmitter, Signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { SessionData } from '../../models';

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
  sessions!: Signal<Map<string, SessionData>>;

  /**
   * Signal containing the ID of the currently active session.
   *
   * Used to highlight the active tab and determine click behavior.
   *
   * @required
   */
  @Input({ required: true })
  activeSessionId!: Signal<string>;

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
}
