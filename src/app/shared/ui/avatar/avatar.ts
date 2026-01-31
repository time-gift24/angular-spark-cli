import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

const avatarVariants = {
  base: 'relative flex shrink-0 overflow-hidden rounded-full',
  sizes: {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-14 w-14 text-lg',
  }
};

export type AvatarSize = keyof typeof avatarVariants.sizes;

@Component({
  selector: 'ui-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    '[class]': 'computedClass()',
  },
  templateUrl: './avatar.html',
  styleUrl: './avatar.css'
})
export class AvatarComponent {
  readonly size = input<AvatarSize>('md');
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    const sizeClass = avatarVariants.sizes[this.size() || 'md'];
    return `${avatarVariants.base} ${sizeClass} ${this.class()}`;
  });
}
