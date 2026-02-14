import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'sonner-description',
  template: `<ng-content />`,
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SonnerDescriptionComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return `text-sm opacity-90 ${this.class()}`.trim();
  });
}
