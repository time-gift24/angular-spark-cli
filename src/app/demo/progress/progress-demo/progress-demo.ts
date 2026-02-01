import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressComponent } from '@app/shared/ui/progress/progress';

@Component({
  selector: 'app-progress-demo',
  standalone: true,
  imports: [CommonModule, ProgressComponent],
  templateUrl: './progress-demo.html',
  styleUrl: '../../shared/demo-page-styles.css',
})
export class ProgressDemoComponent {
  readonly progress = signal(13);

  constructor() {
    setTimeout(() => {
      this.progress.set(66);
    }, 500);
  }
}
