import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * DockedMessagesAreaComponent
 *
 * Pure presentational component that displays chat messages in a
 * draggable card with fixed positioning. Used for sessions with mode='docked'.
 *
 * Features:
 * - Fixed positioning with drag support (initially on right side)
 * - Default size: 380px width, full screen height
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
    <div class="docked-messages-wrapper" [style.style]="wrapperStyle()">
      <ai-chat-messages-card
        [messages]="messages"
      />
    </div>
  `,
  styles: `
    .docked-messages-wrapper {
      position: fixed !important;
      right: 24px !important;
      top: 24px !important;
      height: calc(100vh - 144px) !important;
      z-index: 999 !important;
      pointer-events: none;
      width: 600px !important;
    }
    .docked-messages-wrapper ai-chat-messages-card {
      pointer-events: auto;
      width: 100% !important;
      height: 100% !important;
    }
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

  protected wrapperStyle(): SafeStyle {
    return '';
  }
}
