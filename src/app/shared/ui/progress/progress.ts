import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    'role': 'progressbar',
  },
  templateUrl: './progress.html',
  styleUrl: './progress.css'
})
export class ProgressComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly class = input<string>('');

  protected percentage = computed(() => {
    const val = this.value();
    const maximum = this.max();
    const safeMax = Math.max(maximum, 1); // Prevent division by zero
    return Math.min(Math.max((val / safeMax) * 100, 0), 100);
  });

  protected computedClass = computed(() => {
    return this.class();
  });
}
