import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';

@Component({
  selector: 'app-badge-demo',
  imports: [CommonModule, BadgeComponent],
  templateUrl: './badge-demo.component.html',
  styleUrls: ['./badge-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class BadgeDemoComponent {}
