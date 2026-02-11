import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderComponent } from '@app/shared/ui/slider/slider';

@Component({
  selector: 'app-slider-demo',
  imports: [CommonModule, SliderComponent],
  templateUrl: './slider-demo.html',
  styleUrl: '../../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderDemoComponent {
  readonly sliderValue = signal([50]);
}
