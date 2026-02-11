import {
  input,
  output,
  Component,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SessionTabsBarComponent } from '../session-tabs-bar/session-tabs-bar.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { SessionData } from '@app/shared/models';

/**
 * Session Chat Container Component
 *
 * Pure presentational component that composes SessionTabsBar and ChatInput.
 * All state is managed by parent component, this component only forwards events.
 *
 * Key Features:
 * - Displays session tabs with input below (always visible)
 * - Forwards all core events without modification
 * - Supports Tailwind class overrides for full customization
 * - Two-way binding support for inputValue
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <app-session-chat-container
 *       [sessions]="sessions"
 *       [activeSessionId]="activeSessionId()"
 *       [inputValue]="inputValue()"
 *       (newChat)="onNewChat()"
 *       (sessionSelect)="onSessionSelect($event)"
 *     />
 *   `
 * })
 * ```
 */
@Component({
  selector: 'app-session-chat-container',
  imports: [SessionTabsBarComponent, ChatInputComponent],
  templateUrl: './session-chat-container.component.html',
  styleUrl: './session-chat-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionChatContainerComponent {
  /**
   * Map of all session data
   * @required
   */
  readonly sessions = input.required<Signal<Map<string, SessionData>>>();

  /**
   * ID of the currently active session
   * @required
   */
  readonly activeSessionId = input.required<Signal<string>>();

  /**
   * Whether the input panel is open
   * @deprecated Input is always visible now, this property is kept for backward compatibility
   */
  readonly isOpen = input<Signal<boolean> | undefined>(undefined);

  /**
   * Current input value (two-way binding)
   * @required
   */
  readonly inputValue = input.required<Signal<string>>();

  /**
   * Placeholder text for input
   * @default 'Ask AI anything...'
   */
  readonly placeholder = input('Ask AI anything...');

  /**
   * Whether input is disabled
   * @default false
   */
  readonly disabled = input(false);

  /**
   * Custom container CSS classes (Tailwind utilities)
   * @optional
   */
  readonly containerClass = input<string | undefined>(undefined);

  /**
   * Custom tabs wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  readonly tabsWrapperClass = input<string | undefined>(undefined);

  /**
   * Custom input wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  readonly inputWrapperClass = input<string | undefined>(undefined);

  /**
   * Maximum number of tabs (informational only, logic in parent)
   * @default 5
   */
  readonly maxTabs = input(5);

  /**
   * Event emitted when user clicks "new chat" button
   * Parent component should handle 5-tab limit and close least active session
   */
  readonly newChat = output<void>();

  /**
   * Event emitted when user selects a different session tab
   * Emits the session ID
   */
  readonly sessionSelect = output<string>();

  /**
   * Event emitted when user clicks active session tab (toggle panel)
   */
  readonly sessionToggle = output<void>();

  /**
   * Event emitted when user sends a message
   * Emits the message content
   */
  readonly send = output<string>();

  /**
   * Event emitted when input value changes (for two-way binding)
   * Emits the new input value
   */
  readonly inputValueChange = output<string>();

  /**
   * Event emitted when user changes session color
   * Emits sessionId and color
   */
  readonly sessionColorChange = output<{ sessionId: string; color: string }>();

  /**
   * Event emitted when user renames a session
   * Emits sessionId and newName
   */
  readonly sessionRename = output<{ sessionId: string; newName: string }>();

  /**
   * Event emitted when user closes a session
   * Emits sessionId
   */
  readonly sessionClose = output<string>();

  /**
   * Default Tailwind classes for main container
   */
  protected readonly defaultContainerClass = 'flex flex-col w-full gap-2';

  /**
   * Default Tailwind classes for tabs wrapper
   */
  protected readonly defaultTabsWrapperClass = 'w-full';

  /**
   * Default Tailwind classes for input wrapper
   */
  protected readonly defaultInputWrapperClass =
    'w-full transition-all duration-200 ease-out';

  /**
   * Computed container class (custom or default)
   */
  protected getContainerClass(): string {
    return this.containerClass() || this.defaultContainerClass;
  }

  /**
   * Computed tabs wrapper class (custom or default)
   */
  protected getTabsWrapperClass(): string {
    return this.tabsWrapperClass() || this.defaultTabsWrapperClass;
  }

  /**
   * Computed input wrapper class (custom or default)
   */
  protected getInputWrapperClass(): string {
    return this.inputWrapperClass() || this.defaultInputWrapperClass;
  }

  /**
   * Forward session select event
   */
  protected onSessionSelect(sessionId: string): void {
    this.sessionSelect.emit(sessionId);
  }

  /**
   * Forward session toggle event
   */
  protected onSessionToggle(): void {
    this.sessionToggle.emit();
  }

  /**
   * Forward new chat event
   */
  protected onNewChat(): void {
    this.newChat.emit();
  }

  /**
   * Forward send event
   */
  protected onSend(message: string): void {
    this.send.emit(message);
  }

  /**
   * Forward input value change event
   */
  protected onInputChange(value: string): void {
    this.inputValueChange.emit(value);
  }

  /**
   * Forward session color change event
   */
  protected onSessionColorChange(event: { sessionId: string; color: string }): void {
    this.sessionColorChange.emit(event);
  }

  /**
   * Forward session rename event
   */
  protected onSessionRename(event: { sessionId: string; newName: string }): void {
    this.sessionRename.emit(event);
  }

  /**
   * Forward session close event
   */
  protected onSessionClose(sessionId: string): void {
    this.sessionClose.emit(sessionId);
  }
}
