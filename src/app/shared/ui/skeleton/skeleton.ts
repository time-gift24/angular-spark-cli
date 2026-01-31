import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css'
})
export class SkeletonComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    const baseClasses = 'animate-pulse rounded-md bg-muted';
    const userClasses = this.class();

    return userClasses ? `${baseClasses} ${userClasses}` : baseClasses;
  });
}
