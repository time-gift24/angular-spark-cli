import {
  Directive,
  input,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  HostBinding,
} from '@angular/core';
import { cn } from '@app/shared/utils';

/**
 * Scroll Bar Directive
 *
 * Custom scrollbar component with orientation support.
 * Can be used standalone or as part of ScrollArea.
 *
 * Reference: .vendor/streamdown/apps/website/components/ui/scroll-area.tsx
 *
 * @selector div[spark-scroll-area-scrollbar]
 * @standalone
 */
@Directive({
  selector: 'div[spark-scroll-area-scrollbar]',
  host: {
    '[class]': 'hostClass()',
    '[attr.data-scroll-area-scrollbar]': '""',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class ScrollBarDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Scrollbar orientation - horizontal or vertical
   * Defaults to vertical
   */
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');

  /**
   * Optional CSS class name for custom styling
   */
  readonly class = input<string>('');

  /**
   * Host binding for CSS classes
   */
  @HostBinding('class')
  get hostClasses(): string {
    return this.hostClass();
  }

  /**
   * Computed host class combining base styles with orientation
   */
  protected hostClass = computed(() => {
    const orientation = this.orientation();
    const baseClasses = [
      'scroll-area-scrollbar',
      'flex',
      'touch-none',
      'p-px',
      'select-none',
      'transition-colors',
    ];

    // Orientation-specific classes
    if (orientation === 'vertical') {
      baseClasses.push(
        'h-full',
        'w-2.5',
        'border-l',
        'border-l-transparent'
      );
    } else {
      baseClasses.push(
        'h-2.5',
        'flex-col',
        'border-t',
        'border-t-transparent'
      );
    }

    return cn(...baseClasses, this.class());
  });
}
