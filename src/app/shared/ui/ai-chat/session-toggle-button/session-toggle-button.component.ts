/**
 * Session Toggle Button Component
 * Floating action button to toggle AI chat panel
 * Mineral & Time Theme - Angular 20+
 */

import { Component, input, output, computed } from '@angular/core';

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
      class="session-toggle"
      [class.has-badge]="hasBadge()"
      [attr.aria-label]="isOpen() ? 'Close AI chat' : 'Open AI chat'"
      [attr.aria-expanded]="isOpen()"
      (click)="onClick()"
    >
      @if (isOpen()) {
        <!-- Close/Collapse icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      } @else {
        <!-- Chat icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }

      @if (hasBadge()) {
        <span class="notification-badge" aria-hidden="true"></span>
      }
    </button>
  `,
  styles: [
    `
      .session-toggle {
        position: fixed;
        top: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background: oklch(0.48 0.07 195 / 98%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: none;
        box-shadow:
          0 6px 20px oklch(0.28 0.03 185 / 25%),
          0 0 0 3px oklch(0.48 0.07 195 / 30%);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--duration-normal) ease;
        z-index: 1000;
        padding: 0;
        color: oklch(1 0 0);
      }

      .session-toggle:hover {
        background: oklch(0.48 0.07 195);
        transform: scale(1.08);
        box-shadow:
          0 8px 24px oklch(0.28 0.03 185 / 30%),
          0 0 0 4px oklch(0.48 0.07 195 / 40%);
      }

      .session-toggle:active {
        transform: scale(0.95);
      }

      .session-toggle:focus-visible {
        outline: 2px solid oklch(0.48 0.07 195);
        outline-offset: 2px;
      }

      /* Notification badge */
      .notification-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        border-radius: 7px;
        background: oklch(0.50 0.20 25);
        border: 2px solid oklch(0.48 0.07 195 / 98%);
        box-shadow: 0 2px 6px oklch(0.28 0.03 185 / 40%);
        animation: badgePop 0.3s ease-out;
      }

      @keyframes badgePop {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Has badge state */
      .has-badge {
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow:
            0 6px 20px oklch(0.28 0.03 185 / 25%),
            0 0 0 3px oklch(0.48 0.07 195 / 30%);
        }
        50% {
          box-shadow:
            0 6px 20px oklch(0.28 0.03 185 / 25%),
            0 0 0 5px oklch(0.48 0.07 195 / 50%);
        }
      }

      /* SVG icon styling */
      .session-toggle svg {
        width: 28px;
        height: 28px;
        stroke-width: 2.5;
        transition: transform var(--duration-fast) ease;
      }

      .session-toggle:hover svg {
        transform: scale(1.1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .session-toggle {
          top: 16px;
          right: 16px;
          width: 52px;
          height: 52px;
        }

        .session-toggle svg {
          width: 26px;
          height: 26px;
        }
      }
    `,
  ],
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
   * Emit when button clicked
   */
  readonly toggle = output<void>();

  /**
   * Handle button click
   */
  onClick(): void {
    this.toggle.emit();
  }
}
