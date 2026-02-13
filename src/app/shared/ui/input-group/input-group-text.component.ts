import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

/**
 * InputGroupText Component
 * Text/span element for input group (labels, hints, etc.)
 *
 * Features:
 * - Muted foreground color
 * - Proper sizing for input group context
 * - SVG icons are sized appropriately
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'span[spark-input-group-text]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class InputGroupTextComponent {
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   *
   * Key styles from aim:
   * - text-muted-foreground: muted color
   * - gap-2: spacing between items
   * - text-xs/relaxed: smaller text with relaxed line height
   * - [&_svg:not([class*="size-"])]:size-4: SVG icon size
   */
  protected computedClass = computed(() => {
    return cn(
      'text-muted-foreground gap-2 text-xs/relaxed [&_svg:not([class*="size-"])]:size-4 flex items-center [&_svg]:pointer-events-none',
      this.class()
    );
  });
}
