/**
 * Status Badges Component
 * Displays AI status indicators (Thinking, Typing, Done, Error)
 * Mineral & Time Theme - Angular 20+
 */

import { Component, input, output, computed } from '@angular/core';
import { BadgeType } from '../types/chat.types';

/**
 * Status badge component
 * Shows animated status indicators for AI operations
 */
@Component({
  selector: 'ai-status-badges',
  standalone: true,
  template: `
    <div class="status-badges-container">
      @if (badge(); as badgeValue) {
        <div
          [class]="'badge badge-' + badgeValue.type"
          (click)="onBadgeClick()"
          [attr.aria-label]="badgeValue.type + ' ' + (badgeValue.text || '')"
        >
          @switch (badgeValue.type) {
            @case ('thinking') {
              <div class="pulsing-dot"></div>
            }
            @case ('typing') {
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            }
            @case ('done') {
              <span class="icon">✓</span>
            }
            @case ('error') {
              <span class="icon">⚠</span>
            }
          }

          @if (badgeValue.text) {
            <span class="text">{{ badgeValue.text }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .status-badges-container {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;
        justify-content: flex-start;
        padding: var(--spacing-sm) 0;
        transition: all var(--duration-normal) ease;
        animation: slideUp 0.4s ease-out 0.1s both;
      }

      .badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        transition: all var(--duration-fast) ease;
        animation: badgeFadeIn 0.3s ease-out;
        cursor: pointer;
        user-select: none;
      }

      .badge:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px oklch(0.28 0.03 185 / 15%);
      }

      .badge-thinking {
        background: oklch(0.48 0.07 195 / 15%);
        border: 1px solid oklch(0.48 0.07 195 / 40%);
        color: oklch(0.48 0.07 195);
      }

      .badge-typing {
        background: oklch(0.60 0.08 210 / 15%);
        border: 1px solid oklch(0.60 0.08 210 / 40%);
        color: oklch(0.60 0.08 210);
      }

      .badge-done {
        background: oklch(0.55 0.06 195 / 15%);
        border: 1px solid oklch(0.55 0.06 195 / 40%);
        color: oklch(0.55 0.06 195);
      }

      .badge-error {
        background: oklch(0.50 0.20 25 / 15%);
        border: 1px solid oklch(0.50 0.20 25 / 40%);
        color: oklch(0.50 0.20 25);
      }

      /* Pulsing dot animation (Thinking) */
      .pulsing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: oklch(0.48 0.07 195);
        box-shadow: 0 0 6px oklch(0.48 0.07 195 / 60%);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.2);
        }
      }

      /* Typing indicator (Typing) */
      .typing-indicator {
        display: flex;
        gap: 2px;
        align-items: center;
        width: 16px;
        height: 10px;
      }

      .typing-dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: oklch(0.60 0.08 210);
        animation: bounce 1.4s ease-in-out infinite;
      }

      .typing-dot:nth-child(1) {
        animation-delay: 0s;
      }

      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes bounce {
        0%,
        60%,
        100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-4px);
        }
      }

      /* Icon styles */
      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }

      .text {
        font-size: 11px;
      }

      /* Badge fade in */
      @keyframes badgeFadeIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Slide up animation */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .status-badges-container {
          justify-content: center;
        }
      }
    `,
  ],
})
export class StatusBadgesComponent {
  /**
   * Current badge to display
   */
  readonly badge = input<StatusBadge | null>(null);

  /**
   * Emit when badge is clicked
   */
  readonly badgeClick = output<void>();

  /**
   * Get badge type for styling
   */
  readonly badgeType = computed(() => this.badge()?.type);

  /**
   * Handle badge click
   */
  onBadgeClick(): void {
    this.badgeClick.emit();
  }
}

/**
 * Status badge interface
 */
export interface StatusBadge {
  type: BadgeType;
  text?: string;
}
