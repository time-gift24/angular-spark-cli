import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '@app/shared/utils';

/**
 * KBD Component - Keyboard key shortcuts display
 *
 * Displays keyboard shortcuts in a styled badge.
 * All sizing uses CSS variables.
 *
 * @selector kbd[spark-kbd]
 * @standalone true
 *
 * @example
 * ```html
 * <kbd spark-kbd [keys]="['Ctrl', 'K']"></kbd>
 * ```
 */
@Component({
  selector: 'kbd[spark-kbd]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    '[class]': 'computedClass()',
  },
  template: `
    @for (key of keys(); track key; let isLast = $last) {
      <span class="kbd-key">{{ key }}</span>
      @if (!isLast) {
        <span class="kbd-separator">+</span>
      }
    }
  `,
  styleUrl: './kbd.css',
})
export class KbdComponent {
  readonly keys = input.required<string[]>();
  readonly class = input<string>('');

  /**
   * Base kbd styles
   */
  private readonly baseClass = 'inline-flex items-center';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return cn(this.baseClass, this.class());
  });
}
