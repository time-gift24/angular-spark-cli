import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component';

/**
 * DockedMessagesAreaComponent
 *
 * Pure presentational component that displays chat messages in a
 * fixed right-side dock area. Used for sessions with mode='docked'.
 *
 * Features:
 * - Fixed positioning on right side of viewport
 * - Full height (above SessionChatContainer)
 * - Receives messages and sessionId as @Input
 * - Delegates rendering to ChatMessagesCardComponent
 *
 * @example
 * ```html
 * <app-docked-messages-area
 *   [messages]="activeSession()?.messages || []"
 *   [sessionId]="activeSessionId()"
 * />
 * ```
 */
@Component({
  selector: 'app-docked-messages-area',
  standalone: true,
  imports: [CommonModule, ChatMessagesCardComponent],
  templateUrl: './docked-messages-area.component.html',
  styleUrl: './docked-messages-area.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DockedMessagesAreaComponent {
  /**
   * Messages to display
   * @required
   */
  @Input({ required: true })
  messages!: ChatMessage[];

  /**
   * Default container classes
   * Fixed position: right side, full height
   */
  protected readonly containerClasses = [
    'docked-messages-area',
    'fixed',
    'right-0',
    'top-0',
    'bottom-[120px]',  // Leave space for SessionChatContainer at bottom
    'w-[480px]',  // Fixed width for docked area
    'bg-background/80',  // Semi-transparent background
    'backdrop-blur-sm',  // Subtle glass effect
    'border-l',
    'border-border',
    'shadow-xl'
  ].join(' ');
}
