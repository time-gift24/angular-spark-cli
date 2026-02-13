import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KbdComponent } from '@app/shared/ui/kbd';

@Component({
  selector: 'app-kbd-demo',
  imports: [KbdComponent],
  templateUrl: './kbd-demo.html',
  styleUrl: '../shared/demo-page-styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbdDemoComponent {}
