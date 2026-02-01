import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared/utils';

@Component({
  selector: 'label[spark-label]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.for]': 'htmlFor()',
  },
  template: '<ng-content />',
})
export class LabelComponent {
  readonly htmlFor = input<string | undefined>(undefined);
  readonly class = input<string>('');

  /**
   * Base label styles - Ultra compact with proper accessibility
   */
  private getBaseClasses(): string {
    return 'flex items-center gap-2 text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50';
  }

  /**
   * Computed class for the label element
   */
  protected computedClass = computed(() => {
    return cn(this.getBaseClasses(), this.class());
  });
}
