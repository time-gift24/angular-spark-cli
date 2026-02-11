/**
 * Status Badges Component
 * Displays AI status indicators (Thinking, Typing, Done, Error)
 * Mineral & Time Theme - Angular 20+
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeType } from '@app/shared/ui/ai-chat/types/chat.types';
import {
  statusBadgesContainer,
  badgeBase,
  badgeThinking,
  badgeTyping,
  badgeDone,
  badgeError,
  pulsingDot,
  typingIndicator,
  typingDot,
  badgeIcon,
  badgeText,
} from './css';
import { cn } from '@app/shared/utils';

/**
 * Status badge component
 * Shows animated status indicators for AI operations
 */
@Component({
  selector: 'ai-status-badges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()">
      @if (badge(); as badgeValue) {
        <div
          [class]="badgeClasses(badgeValue.type)"
          [attr.aria-label]="badgeValue.type + ' ' + (badgeValue.text || '')"
        >
          @switch (badgeValue.type) {
            @case ('thinking') {
              <div [class]="pulsingDotClasses()"></div>
            }
            @case ('typing') {
              <div [class]="typingIndicatorClasses()">
                <div [class]="typingDotClasses()"></div>
                <div [class]="typingDotClasses()"></div>
                <div [class]="typingDotClasses()"></div>
              </div>
            }
            @case ('done') {
              <span [class]="iconClasses()">✓</span>
            }
            @case ('error') {
              <span [class]="iconClasses()">⚠</span>
            }
          }

          @if (badgeValue.text) {
            <span [class]="textClasses()">{{ badgeValue.text }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class StatusBadgesComponent {
  /**
   * Current badge to display
   */
  readonly badge = input<StatusBadge | null>(null);

  // Base styles
  readonly containerBase = statusBadgesContainer;
  readonly badgeBaseStyles = badgeBase;
  readonly pulsingDotBase = pulsingDot;
  readonly typingIndicatorBase = typingIndicator;
  readonly typingDotBase = typingDot;
  readonly iconBase = badgeIcon;
  readonly textBase = badgeText;

  // Computed classes
  protected containerClasses = computed(() => cn(this.containerBase, 'status-badges-container'));

  protected badgeClasses = (type: BadgeType) =>
    cn(this.badgeBaseStyles, 'badge', 'badge-' + type, this.getBadgeVariantStyles(type));

  protected pulsingDotClasses = computed(() => cn(this.pulsingDotBase, 'pulsing-dot'));

  protected typingIndicatorClasses = computed(() =>
    cn(this.typingIndicatorBase, 'typing-indicator'),
  );

  protected typingDotClasses = computed(() => cn(this.typingDotBase, 'typing-dot'));

  protected iconClasses = computed(() => cn(this.iconBase, 'icon'));

  protected textClasses = computed(() => cn(this.textBase, 'text'));

  /**
   * Get badge type for styling
   */
  readonly badgeType = computed(() => this.badge()?.type);

  /**
   * Get variant-specific styles
   */
  private getBadgeVariantStyles(type: BadgeType): string {
    const variantMap: Record<BadgeType, string> = {
      thinking: badgeThinking,
      typing: badgeTyping,
      done: badgeDone,
      error: badgeError,
    };

    return variantMap[type] || '';
  }
}

/**
 * Status badge interface
 */
export interface StatusBadge {
  type: BadgeType;
  text?: string;
}
