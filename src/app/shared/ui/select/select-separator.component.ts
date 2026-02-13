import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-select-separator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"select-separator"',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': '"horizontal"',
  },
  template: '',
})
export class SelectSeparatorComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      '-mx-1',
      'my-1',
      'h-px',
      'bg-border',
      this.class()
    );
  });
}
