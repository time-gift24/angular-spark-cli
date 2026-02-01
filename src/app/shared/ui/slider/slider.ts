import { Component, computed, input, model, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'relative flex w-full touch-none select-none items-center',
  },
  templateUrl: './slider.html',
  styleUrl: './slider.css',
})
export class SliderComponent {
  readonly value = model<number[]>([50]);
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return this.class();
  });

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    this.value.set([newValue]);
    // valueChange is automatically emitted by model()
  }

  protected getTrackWidth(): string {
    const [currentValue] = this.value();
    const minValue = this.min();
    const maxValue = this.max();
    const range = maxValue - minValue;
    const safeRange = Math.max(range, 1); // Prevent division by zero
    const percentage = ((currentValue - minValue) / safeRange) * 100;
    return `${percentage}%`;
  }

  protected getThumbPosition(): string {
    const [currentValue] = this.value();
    const minValue = this.min();
    const maxValue = this.max();
    const range = maxValue - minValue;
    const safeRange = Math.max(range, 1); // Prevent division by zero
    const percentage = ((currentValue - minValue) / safeRange) * 100;
    return `${percentage}%`;
  }
}
