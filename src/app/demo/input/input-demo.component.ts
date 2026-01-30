import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { examples } from './examples';
import type { InputExample } from './types';

@Component({
  selector: 'app-input-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-demo.component.html',
  styleUrls: ['./input-demo.component.css'],
})
export class InputDemoComponent {
  readonly examples = examples;
}
