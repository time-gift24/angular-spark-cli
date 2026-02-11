import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwitchComponent } from '@app/shared/ui/switch/switch.component';
import { LabelComponent } from '@app/shared/ui/label/label.component';
import { CardComponents } from '@app/shared/ui/card/card.component';
import { SeparatorComponent } from '@app/shared/ui/separator/separator.component';

@Component({
  selector: 'app-switch-demo',
  imports: [CommonModule, SwitchComponent, LabelComponent, CardComponents, SeparatorComponent],
  templateUrl: './switch-demo.component.html',
  styleUrls: ['./switch-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class SwitchDemoComponent {
  airplaneMode = signal(false);
  notifications = signal(true);
  autoUpdates = signal(false);
  twoFactor = signal(true);
}
