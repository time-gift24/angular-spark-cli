/**
 * Button Group Component
 *
 * Groups multiple buttons or button-like elements together.
 * Handles orientation and ensures consistent styling across items.
 *
 * Usage:
 * <div spark-button-group orientation="horizontal">
 *   <button>Button 1</button>
 *   <button>Button 2</button>
 * </div>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'div[spark-button-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'group',
    '[class]': 'hostClass()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-slot]': '"button-group"',
  },
  template: `
    <ng-content />
  `,
})
export class ButtonGroupComponent {
  readonly orientation = input<ButtonGroupOrientation>('horizontal');
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'flex',
      'w-fit',
      'items-stretch',
      // Focus visible z-index handling
      '[&>*]:focus-visible:z-10',
      '[&>*]:focus-visible:relative',
      // Select trigger width handling
      '[&>[data-slot=select-trigger]:not([class*=w-]):w-fit',
      // Button group gap handling
      '[&>[data-slot=button-group]]:gap-2',
      // Orientation styles
      this.orientation() === 'horizontal' && this.getHorizontalStyles(),
      this.orientation() === 'vertical' && this.getVerticalStyles(),
      this.class()
    );
  });

  private getHorizontalStyles(): string {
    return cn(
      '[&>*:not(:first-child)]:rounded-l-none',
      '[&>*:not(:first-child)]:border-l-0',
      '[&>*:not(:last-child)]:rounded-r-none'
    );
  }

  private getVerticalStyles(): string {
    return cn(
      'flex-col',
      '[&>*:not(:first-child)]:rounded-t-none',
      '[&>*:not(:first-child)]:border-t-0',
      '[&>*:not(:last-child)]:rounded-b-none'
    );
  }
}
