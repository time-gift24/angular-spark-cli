import {
  Component,
  Input,
  Output,
  EventEmitter,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SessionTabsBarComponent } from '@app/shared/ui/session-tabs-bar';
import { ChatInputComponent } from '@app/shared/ui/ai-chat';
import { SessionData } from '@app/shared/models';

/**
 * Session Chat Container Component
 *
 * Pure presentational component that composes SessionTabsBar and ChatInput.
 * All state is managed by parent component, this component only forwards events.
 *
 * Key Features:
 * - Displays session tabs with input below (when open)
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
 *       [isOpen]="isOpen()"
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
  standalone: true,
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
  @Input({ required: true })
  sessions!: Signal<Map<string, SessionData>>;

  /**
   * ID of the currently active session
   * @required
   */
  @Input({ required: true })
  activeSessionId!: Signal<string>;

  /**
   * Whether the input panel is open
   * @required
   */
  @Input({ required: true })
  isOpen!: Signal<boolean>;

  /**
   * Current input value (two-way binding)
   * @required
   */
  @Input({ required: true })
  inputValue!: Signal<string>;

  /**
   * Placeholder text for input
   * @default 'Ask AI anything...'
   */
  @Input()
  placeholder = 'Ask AI anything...';

  /**
   * Whether input is disabled
   * @default false
   */
  @Input()
  disabled = false;

  /**
   * Custom container CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  containerClass?: string;

  /**
   * Custom tabs wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  tabsWrapperClass?: string;

  /**
   * Custom input wrapper CSS classes (Tailwind utilities)
   * @optional
   */
  @Input()
  inputWrapperClass?: string;

  /**
   * Maximum number of tabs (informational only, logic in parent)
   * @default 5
   */
  @Input()
  maxTabs = 5;

  /**
   * Event emitted when user clicks "new chat" button
   * Parent component should handle 5-tab limit and close least active session
   */
  @Output()
  readonly newChat = new EventEmitter<void>();

  /**
   * Event emitted when user selects a different session tab
   * Emits the session ID
   */
  @Output()
  readonly sessionSelect = new EventEmitter<string>();

  /**
   * Event emitted when user clicks active session tab (toggle panel)
   */
  @Output()
  readonly sessionToggle = new EventEmitter<void>();

  /**
   * Event emitted when user sends a message
   * Emits the message content
   */
  @Output()
  readonly send = new EventEmitter<string>();

  /**
   * Event emitted when input value changes (for two-way binding)
   * Emits the new input value
   */
  @Output()
  readonly inputValueChange = new EventEmitter<string>();
}
