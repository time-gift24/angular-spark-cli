import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertComponent,
  AlertTitleComponent,
  AlertDescriptionComponent,
} from '../../shared/ui/alert/alert.component';

@Component({
  selector: 'app-alert-demo',
  standalone: true,
  imports: [CommonModule, AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
  templateUrl: './alert-demo.component.html',
  styleUrls: ['./alert-demo.component.css'],
})
export class AlertDemoComponent {}
