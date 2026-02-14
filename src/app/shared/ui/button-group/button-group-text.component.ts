/**
 * Button Group Text Component
 *
 * Text label for button group, often used as a heading or description.
 *
 * Usage:
 * <div spark-button-group-text>Group Label</div>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-button-group-text]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"button-group-text"',
  },
  template: `
    <ng-content />
  `,
})
export class ButtonGroupTextComponent {
  readonly class = input<string>('');
  readonly asChild = input<boolean>(false);

  protected readonly hostClass = computed(() => {
    return cn(
      'bg-muted',
      'flex',
      'items-center',
      'gap-2',
      'rounded-md',
      'border',
      'px-4',
      'text-sm',
      'font-medium',
      'shadow-xs',
      '[&_svg]:pointer-events-none',
      '[&_svg:not([class*=size-])]:size-4',
      this.class()
    );
  });
}
