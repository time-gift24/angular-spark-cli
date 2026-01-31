import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeparatorComponent } from '../../shared/ui/separator/separator.component';

@Component({
  selector: 'app-separator-demo',
  standalone: true,
  imports: [CommonModule, SeparatorComponent],
  templateUrl: './separator-demo.component.html',
  styleUrls: ['./separator-demo.component.css'],
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class SeparatorDemoComponent {}
