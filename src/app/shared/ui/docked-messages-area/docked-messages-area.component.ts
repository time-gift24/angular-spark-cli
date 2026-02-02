import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component';

/**
 * DockedMessagesAreaComponent
 *
 * Pure presentational component that displays chat messages in a
 * draggable card with fixed positioning. Used for sessions with mode='docked'.
 *
 * Features:
 * - Fixed positioning with drag support (initially on right side)
 * - Default size: 380px width, 60vh height
 * - Receives messages as @Input
 * - Delegates rendering to ChatMessagesCardComponent
 * - User can freely drag the card anywhere
 *
 * @example
 * ```html
 * <app-docked-messages-area
 *   [messages]="activeSession()?.messages || []"
 * />
 * ```
 */
@Component({
  selector: 'app-docked-messages-area',
  standalone: true,
  imports: [CommonModule, ChatMessagesCardComponent],
  template: `
    <ai-chat-messages-card
      [messages]="messages"
      [position]="'fixed'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DockedMessagesAreaComponent {
  /**
   * Messages to display
   * @required
   */
  @Input({ required: true })
  messages!: ChatMessage[];
}
