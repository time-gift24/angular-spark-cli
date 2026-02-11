import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeparatorComponent } from '@app/shared/ui/separator/separator.component';

@Component({
  selector: 'app-separator-demo',
  imports: [CommonModule, SeparatorComponent],
  templateUrl: './separator-demo.component.html',
  styleUrls: ['./separator-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class SeparatorDemoComponent {}
