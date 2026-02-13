import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpinnerComponent, type SpinnerSize } from '@app/shared/ui/spinner';

@Component({
  selector: 'app-spinner-demo',
  imports: [SpinnerComponent],
  templateUrl: './spinner-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerDemoComponent {
  readonly sizes: SpinnerSize[] = ['sm', 'md', 'lg', 'xl'];
}
