import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-badge-demo',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './badge-demo.component.html',
  styleUrls: ['./badge-demo.component.css'],
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class BadgeDemoComponent {}
