import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-avatar-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'flex h-full w-full items-center justify-center rounded-full bg-muted',
    '[class.delayed]': 'delayed()',
  },
  templateUrl: './avatar-fallback.html',
  styleUrl: './avatar-fallback.css',
})
export class AvatarFallbackComponent {
  readonly class = input<string>('');
  readonly delayMs = input<number>(0);

  protected delayed = computed(() => this.delayMs() > 0);

  protected computedClass = computed(() => {
    return this.class();
  });
}
