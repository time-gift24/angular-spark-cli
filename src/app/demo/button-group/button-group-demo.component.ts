import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ButtonGroupComponent,
  ButtonGroupTextComponent,
  ButtonGroupSeparatorComponent,
  type ButtonGroupOrientation,
} from '@app/shared/ui/button-group';
import { ButtonComponent } from '@app/shared/ui/button';

@Component({
  selector: 'app-button-group-demo',
  imports: [ButtonGroupComponent, ButtonGroupTextComponent, ButtonGroupSeparatorComponent, ButtonComponent],
  templateUrl: './button-group-demo.component.html',
  styleUrl: './button-group-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class ButtonGroupDemoComponent {
  readonly orientation = signal<ButtonGroupOrientation>('horizontal');

  setOrientation(orientation: ButtonGroupOrientation): void {
    this.orientation.set(orientation);
  }
}
