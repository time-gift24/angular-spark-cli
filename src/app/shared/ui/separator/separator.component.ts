import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared/utils';

export type SeparatorOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'div[spark-separator]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-hidden]': 'decorative()',
  },
  template: '',
})
export class SeparatorComponent {
  readonly orientation = input<SeparatorOrientation>('horizontal');
  readonly decorative = input<boolean>(true);
  readonly class = input<string>('');

  /**
   * Base separator styles - Ultra compact with responsive orientation
   */
  private getBaseClasses(): string {
    return 'bg-border shrink-0';
  }

  /**
   * Orientation styles
   */
  private getOrientationClasses(): string {
    const orientation = this.orientation();

    const orientationMap: Record<SeparatorOrientation, string> = {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    };

    return orientationMap[orientation] || orientationMap.horizontal;
  }

  /**
   * Computed class for the separator element
   */
  protected computedClass = computed(() => {
    return cn(this.getBaseClasses(), this.getOrientationClasses(), this.class());
  });
}
