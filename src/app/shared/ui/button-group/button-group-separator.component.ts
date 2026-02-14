/**
 * Button Group Separator Component
 *
 * Visual separator between button groups or items.
 *
 * Usage:
 * <div spark-button-group-separator></div>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-button-group-separator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'separator',
    'aria-orientation': 'orientation()',
    '[class]': 'hostClass()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-slot]': '"button-group-separator"',
  },
  template: '',
})
export class ButtonGroupSeparatorComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'bg-input',
      'relative',
      '!m-0',
      'self-stretch',
      this.orientation() === 'vertical' && 'h-auto',
      this.class()
    );
  });
}
