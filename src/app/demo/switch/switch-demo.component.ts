import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwitchComponent } from '../../shared/ui/switch/switch.component';
import { LabelComponent } from '../../shared/ui/label/label.component';
import { CardComponents } from '../../shared/ui/card/card.component';
import { SeparatorComponent } from '../../shared/ui/separator/separator.component';

@Component({
  selector: 'app-switch-demo',
  standalone: true,
  imports: [CommonModule, SwitchComponent, LabelComponent, CardComponents, SeparatorComponent],
  templateUrl: './switch-demo.component.html',
  styleUrls: ['./switch-demo.component.css'],
})
export class SwitchDemoComponent {
  airplaneMode = signal(false);
  notifications = signal(true);
  autoUpdates = signal(false);
  twoFactor = signal(true);
}
