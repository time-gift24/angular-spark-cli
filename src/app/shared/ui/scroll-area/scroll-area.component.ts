import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
} from '@angular/core';
import { cn } from '@app/shared/utils';

/**
 * Scroll Area Component
 *
 * A styled scrollable container with custom scrollbar styling.
 * Uses viewport-directional scrollbar orientation with touch support.
 *
 * Reference: .vendor/streamdown/apps/website/components/ui/scroll-area.tsx
 *
 * @selector div[spark-scroll-area]
 * @standalone
 * @changeDetection OnPush
 */
@Component({
  selector: 'div[spark-scroll-area]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-scroll-area]': '""',
  },
  template: `
    <div
      class="scroll-area-viewport"
      [attr.data-scroll-area-viewport]="''"
    >
      <ng-content />
    </div>
    <div
      class="scroll-area-scrollbar"
      [attr.data-scroll-area-scrollbar]="''"
      [attr.data-orientation]="orientation()"
    >
      <div
        class="scroll-area-thumb"
        [attr.data-scroll-area-thumb]="''"
      ></div>
    </div>
    <div
      class="scroll-area-corner"
      [attr.data-scroll-area-corner]="''"
    ></div>
  `,
  styleUrl: './scroll-area.component.css',
})
export class ScrollAreaComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Scrollbar orientation - horizontal, vertical, or both
   * Defaults to vertical for typical scroll behavior
   */
  readonly orientation = input<'horizontal' | 'vertical' | 'both'>('vertical');

  /**
   * Optional CSS class name for custom styling
   */
  readonly class = input<string>('');

  /**
   * Computed host class combining base styles with custom classes
   */
  protected hostClass = computed(() => {
    return cn('scroll-area-root', this.class());
  });
}
