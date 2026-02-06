import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar size variants
 * Maps to CSS variables in styles.css
 */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Avatar Component - User avatar image with fallback
 *
 * Displays a circular user avatar with support for images and fallback text.
 * Sizes use CSS variables for consistent theming.
 *
 * @selector ui-avatar
 * @standalone true
 *
 * @example
 * ```html
 * <ui-avatar size="md" [imageUrl]="user.avatar" fallback="JD" />
 * ```
 */
@Component({
  selector: 'ui-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    '[class]': 'computedClass()',
    '[style]': 'avatarStyle()',
  },
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class AvatarComponent {
  readonly size = input<AvatarSize>('md');
  readonly class = input<string>('');

  /**
   * Base avatar styles
   */
  private readonly baseClass = 'relative flex shrink-0 overflow-hidden rounded-full';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return `${this.baseClass} ${this.class()}`;
  });

  /**
   * Dynamic sizing using CSS variables from styles.css
   * Maps size prop to corresponding CSS variable
   */
  protected avatarStyle = computed(() => {
    const size = this.size();
    const sizeMap: Record<AvatarSize, string> = {
      sm: 'var(--avatar-size-sm)',
      md: 'var(--avatar-size-md)',
      lg: 'var(--avatar-size-lg)',
      xl: 'var(--avatar-size-xl)',
    };
    const fontSizeMap: Record<AvatarSize, string> = {
      sm: 'var(--avatar-font-size-sm)',
      md: 'var(--avatar-font-size-md)',
      lg: 'var(--avatar-font-size-lg)',
      xl: 'var(--avatar-font-size-lg)',
    };

    return {
      width: sizeMap[size],
      height: sizeMap[size],
      fontSize: fontSizeMap[size],
    };
  });
}
