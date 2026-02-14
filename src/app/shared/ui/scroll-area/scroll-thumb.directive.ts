import { Directive, HostBinding } from '@angular/core';

/**
 * Scroll Thumb Directive
 *
 * The draggable handle portion of a scrollbar.
 * Applies rounded appearance and hover states.
 *
 * Reference: .vendor/streamdown/apps/website/components/ui/scroll-area.tsx
 *
 * @selector div[spark-scroll-area-thumb]
 * @standalone
 */
@Directive({
  selector: 'div[spark-scroll-area-thumb]',
  host: {
    '[class]': 'scroll-area-thumb',
    '[attr.data-scroll-area-thumb]': '""',
  },
})
export class ScrollThumbDirective {
  /**
   * Host binding for CSS classes
   * Uses bg-border for base color with hover states via CSS
   */
  @HostBinding('class')
  readonly hostClass = 'bg-border relative flex-1 rounded-full';
}
