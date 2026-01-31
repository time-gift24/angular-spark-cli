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
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        border-radius: 24px;
        background: oklch(0.48 0.07 195 / 95%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: none;
        box-shadow:
          0 4px 12px oklch(0.28 0.03 185 / 15%),
          0 0 0 2px oklch(0.48 0.07 195 / 20%);
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
        transform: scale(1.05);
        box-shadow:
          0 6px 16px oklch(0.28 0.03 185 / 20%),
          0 0 0 2px oklch(0.48 0.07 195 / 30%);
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
        top: 4px;
        right: 4px;
        width: 12px;
        height: 12px;
        border-radius: 6px;
        background: oklch(0.50 0.20 25);
        border: 2px solid oklch(0.91 0.015 85);
        box-shadow: 0 2px 4px oklch(0.28 0.03 185 / 30%);
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
            0 4px 12px oklch(0.28 0.03 185 / 15%),
            0 0 0 2px oklch(0.48 0.07 195 / 20%);
        }
        50% {
          box-shadow:
            0 4px 12px oklch(0.28 0.03 185 / 15%),
            0 0 0 4px oklch(0.48 0.07 195 / 30%);
        }
      }

      /* SVG icon styling */
      .session-toggle svg {
        width: 24px;
        height: 24px;
        stroke-width: 2;
        transition: transform var(--duration-fast) ease;
      }

      .session-toggle:hover svg {
        transform: scale(1.1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .session-toggle {
          bottom: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
        }

        .session-toggle svg {
          width: 22px;
          height: 22px;
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
