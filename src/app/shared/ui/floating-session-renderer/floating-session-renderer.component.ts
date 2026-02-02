import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { SessionData } from '@app/shared/models';
import { ChatMessage } from '@app/shared/ui/ai-chat/types/chat.types';
import { ChatMessagesCardComponent } from '@app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component';

/**
 * Default floating session position
 */
const DEFAULT_POSITION = { x: 100, y: 100 };

/**
 * Default floating session size
 */
const DEFAULT_SIZE = { width: 400, height: 500 };

/**
 * Minimum position values (viewport boundaries)
 */
const MIN_POSITION = { x: 0, y: 0 };

/**
 * FloatingSessionRendererComponent
 *
 * Pure presentational component that displays chat messages at an
 * absolute position determined by the session's position and size.
 * Used for sessions with mode='floating'.
 *
 * Features:
 * - Absolute positioning based on session.position
 * - Dynamic sizing based on session.size
 * - Viewport boundary clamping (prevents off-screen rendering)
 * - Fallback to DEFAULT_POSITION if position invalid
 * - Delegates rendering to ChatMessagesCardComponent
 *
 * @example
 * ```html
 * <app-floating-session-renderer
 *   [session]="activeSession()"
 *   [messages]="activeSession()?.messages || []"
 * />
 * ```
 */
@Component({
  selector: 'app-floating-session-renderer',
  standalone: true,
  imports: [CommonModule, ChatMessagesCardComponent],
  templateUrl: './floating-session-renderer.component.html',
  styleUrl: './floating-session-renderer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingSessionRendererComponent {
  /**
   * Session data containing position and size
   * @required
   */
  @Input({ required: true })
  session!: SessionData;

  /**
   * Messages to display (also available in session.messages)
   * @required
   */
  @Input({ required: true })
  messages!: ChatMessage[];

  /**
   * Get clamped position style
   * Ensures session stays within viewport bounds
   */
  protected getPositionStyle(): Record<string, string> {
    if (!this.session?.position) {
      return {
        left: `${DEFAULT_POSITION.x}px`,
        top: `${DEFAULT_POSITION.y}px`,
        width: `${DEFAULT_SIZE.width}px`,
        height: `${DEFAULT_SIZE.height}px`
      };
    }

    const { x, y } = this.session.position;
    const { width, height } = this.session.size || DEFAULT_SIZE;

    // Clamp position to viewport bounds
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height - 120; // Reserve space for container

    const clampedX = Math.max(MIN_POSITION.x, Math.min(x, maxX));
    const clampedY = Math.max(MIN_POSITION.y, Math.min(y, maxY));

    return {
      position: 'absolute',
      left: `${clampedX}px`,
      top: `${clampedY}px`,
      width: `${width}px`,
      height: `${height}px`
    };
  }

  /**
   * Default container classes
   * Absolute positioning with shadow and border
   */
  protected readonly containerClasses = [
    'floating-session-renderer',
    'bg-background',
    'border',
    'border-border',
    'rounded-lg',
    'shadow-2xl',
    'overflow-hidden',
    'z-10'
  ].join(' ');
}
