/**
 * Session Toggle Button Component
 * Floating action button to toggle AI chat panel
 * Mineral & Time Theme - Angular 20+
 */

import { Component, input, output, computed } from '@angular/core';
import {
  fixedPosition,
  relativePosition,
  sessionToggleBase,
  hasBadgePulse,
  notificationBadge,
  toggleIcon,
} from './css';
import { cn } from '@app/shared';

/**
 * Session toggle button component
 * Fixed floating button to open/close AI chat
 */
@Component({
  selector: 'ai-session-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      [class]="buttonClasses()"
      [attr.aria-label]="isOpen() ? 'Close AI chat' : 'Open AI chat'"
      [attr.aria-expanded]="isOpen()"
      (click)="onClick()"
    >
      @if (isOpen()) {
        <!-- Close/Collapse icon -->
        <svg
          [class]="iconClasses()"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      } @else {
        <!-- Chat icon -->
        <svg
          [class]="iconClasses()"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }

      @if (hasBadge()) {
        <span [class]="badgeClasses()" aria-hidden="true"></span>
      }
    </button>
  `,
})
export class SessionToggleComponent {
  /**
   * Is panel open
   */
  readonly isOpen = input(false);

  /**
   * Show notification badge
   */
  readonly hasBadge = input(false);

  /**
   * Use fixed positioning (default: true)
   * Set to false when used in wrapper component
   */
  readonly useFixedPosition = input(true);

  /**
   * Emit when button clicked
   */
  readonly toggle = output<void>();

  // Base styles
  readonly sessionToggleBaseStyles = sessionToggleBase;
  readonly notificationBadgeBase = notificationBadge;
  readonly toggleIconBase = toggleIcon;

  // Computed classes
  protected buttonClasses = computed(() =>
    cn(
      this.sessionToggleBaseStyles,
      'session-toggle',
      this.useFixedPosition() ? fixedPosition : relativePosition,
      this.hasBadge() ? 'has-badge' : '',
    ),
  );

  protected iconClasses = computed(() => this.toggleIconBase);

  protected badgeClasses = computed(() => cn(this.notificationBadgeBase, 'notification-badge'));

  /**
   * Handle button click
   */
  onClick(): void {
    this.toggle.emit();
  }
}
